/**
 * Advanced Image Security Scanner
 * Scans images for security threats, EXIF data, and duplicates
 * 
 * @module lib/storage/image-security
 */

export interface SecurityScanResult {
  safe: boolean;
  threats: SecurityThreat[];
  warnings: SecurityWarning[];
  exifData: ExifData | null;
  hash: string;
  scanTime: number;
}

export interface SecurityThreat {
  type: 'malicious_content' | 'embedded_code' | 'size_manipulation' | 'invalid_structure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface SecurityWarning {
  type: 'exif_data' | 'large_file' | 'unusual_dimensions' | 'unknown_format';
  description: string;
  action: 'strip' | 'warn' | 'none';
}

export interface ExifData {
  // Camera info
  make?: string;
  model?: string;
  software?: string;
  
  // Date/time
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;
  
  // Location data (privacy concern)
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  hasLocation: boolean;
  
  // Image properties
  orientation?: number;
  flash?: number;
  focalLength?: number;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  
  // Thumbnail
  hasThumbnail: boolean;
  thumbnailSize?: number;
  
  // Raw data (for debugging)
  raw: Record<string, unknown>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  hash: string;
  matchType: 'exact' | 'similar' | 'none';
  similarityScore?: number;
  existingFile?: string;
}

export interface SecurityConfig {
  /** Block images with embedded scripts/code */
  checkEmbeddedCode: boolean;
  /** Strip all EXIF data by default */
  stripExif: boolean;
  /** Block GPS location data */
  blockGeoLocation: boolean;
  /** Check for duplicate images */
  checkDuplicates: boolean;
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Unusual dimension ratio threshold */
  maxDimensionRatio: number;
  /** Log security events */
  logEvents: boolean;
}

// Default configuration
const DEFAULT_CONFIG: SecurityConfig = {
  checkEmbeddedCode: true,
  stripExif: true,
  blockGeoLocation: true,
  checkDuplicates: false, // Requires database/Redis
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxDimensionRatio: 10, // 10:1 ratio max
  logEvents: true,
};

// In-memory hash store for duplicate detection (use Redis/DB in production)
const imageHashes = new Map<string, { hash: string; path: string; timestamp: number }>();

/**
 * Calculate perceptual hash of an image (simplified dHash)
 */
async function calculatePerceptualHash(buffer: Buffer): Promise<string> {
  try {
    const sharp = await import('sharp').then(m => m.default || m).catch(() => null);
    
    if (!sharp) {
      // Fallback to simple hash
      return simpleHash(buffer);
    }

    // Resize to small size for hashing
    const resized = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();

    // Calculate difference hash
    let hash = '';
    for (let i = 1; i < resized.length; i++) {
      hash += resized[i] > resized[i - 1] ? '1' : '0';
    }

    return hash;
  } catch {
    return simpleHash(buffer);
  }
}

/**
 * Simple hash fallback (not perceptual)
 */
function simpleHash(buffer: Buffer): string {
  let hash = 0;
  for (let i = 0; i < Math.min(buffer.length, 10000); i++) {
    const char = buffer[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Extract EXIF data from image
 */
async function extractExifData(buffer: Buffer): Promise<ExifData | null> {
  try {
    const sharp = await import('sharp').then(m => m.default || m).catch(() => null);
    
    if (!sharp) return null;

    const metadata = await sharp(buffer).metadata();
    const exif = metadata.exif;

    if (!exif) {
      return {
        hasLocation: false,
        hasThumbnail: false,
        raw: {},
      };
    }

    // Parse EXIF data (simplified - use exifreader library for full parsing)
    const result: ExifData = {
      make: metadata?.make as string | undefined,
      model: metadata?.model as string | undefined,
      software: undefined, // Would need full EXIF parsing
      orientation: metadata.orientation as number | undefined,
      hasLocation: false,
      hasThumbnail: !!metadata.icc,
      raw: { exif, metadata },
    };

    // Note: Full GPS/EXIF parsing requires a dedicated library like 'exifreader'
    // This is a simplified implementation

    return result;
  } catch (error) {
    console.warn('[ImageSecurity] EXIF extraction failed:', error);
    return null;
  }
}

/**
 * Check for embedded malicious code in image
 */
function checkForEmbeddedCode(buffer: Buffer): SecurityThreat[] {
  const threats: SecurityThreat[] = [];

  // Check for script tags (SVG)
  const str = buffer.toString('utf8', 0, Math.min(buffer.length, 8192));
  const dangerousPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /vbscript:/i,
    /data:\s*text\/html/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(str)) {
      threats.push({
        type: 'embedded_code',
        severity: 'critical',
        description: 'Potential embedded script or executable code detected',
        recommendation: 'Reject this file - it may contain malicious code',
      });
      break;
    }
  }

  // Check for PHP/other code after image data
  const phpPattern = /\?php|<\?=/i;
  if (phpPattern.test(str)) {
    threats.push({
      type: 'embedded_code',
      severity: 'critical',
      description: 'PHP code detected in file',
      recommendation: 'Reject this file immediately',
    });
  }

  return threats;
}

/**
 * Validate image structure
 */
function validateImageStructure(
  buffer: Buffer, 
  mimeType: string
): SecurityThreat[] {
  const threats: SecurityThreat[] = [];

  // Check file signature matches claimed type
  const signatures: Record<string, RegExp> = {
    'image/jpeg': /^ffd8ff/,
    'image/png': /^89504e47/,
    'image/gif': /^47494638/,
    'image/webp': /^52494646/,
    'image/svg+xml': /^(3c3f786d|3c73766)/,
  };

  const header = buffer.slice(0, 4).toString('hex');
  const expectedSignature = signatures[mimeType];

  if (expectedSignature && !expectedSignature.test(header)) {
    threats.push({
      type: 'invalid_structure',
      severity: 'high',
      description: `File signature doesn't match claimed type (${mimeType})`,
      recommendation: 'File may be mislabeled or corrupted',
    });
  }

  // Check for truncated files
  const expectedTrailers: Record<string, RegExp> = {
    'image/jpeg': /ffd9$/, // EOI marker
    'image/png': /49454e44/, // IEND
    'image/gif': /3b$/, // Trailer
  };

  if (buffer.length > 100) {
    const footer = buffer.slice(-20).toString('hex');
    const expectedTrailer = expectedTrailers[mimeType];
    
    if (expectedTrailer && !expectedTrailer.test(footer)) {
      threats.push({
        type: 'invalid_structure',
        severity: 'low',
        description: 'File may be truncated or incomplete',
        recommendation: 'Image may not display correctly',
      });
    }
  }

  return threats;
}

/**
 * Main security scan function
 */
export async function scanImage(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  config: Partial<SecurityConfig> = {}
): Promise<SecurityScanResult> {
  const startTime = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const threats: SecurityThreat[] = [];
  const warnings: SecurityWarning[] = [];

  // 1. Check for embedded code
  if (cfg.checkEmbeddedCode) {
    const codeThreats = checkForEmbeddedCode(buffer);
    threats.push(...codeThreats);
  }

  // 2. Validate structure
  const structureThreats = validateImageStructure(buffer, mimeType);
  threats.push(...structureThreats);

  // 3. Extract and analyze EXIF
  let exifData: ExifData | null = null;
  try {
    exifData = await extractExifData(buffer);
    
    if (exifData) {
      // Check for location data
      if (cfg.blockGeoLocation && exifData.hasLocation) {
        warnings.push({
          type: 'exif_data',
          description: 'Image contains GPS location data',
          action: 'strip',
        });
      }

      // Check for thumbnail with potential hidden data
      if (exifData.hasThumbnail && exifData.thumbnailSize && exifData.thumbnailSize > 50000) {
        warnings.push({
          type: 'exif_data',
          description: 'Large thumbnail detected in EXIF data',
          action: 'strip',
        });
      }
    }
  } catch (error) {
    console.warn('[ImageSecurity] EXIF analysis failed:', error);
  }

  // 4. Check dimensions (basic check without Sharp)
  if (cfg.maxDimensionRatio) {
    // Would need Sharp for actual dimensions
    // This is a placeholder
  }

  // 5. Calculate hash for duplicate detection
  let hash = '';
  try {
    hash = await calculatePerceptualHash(buffer);
  } catch (error) {
    hash = simpleHash(buffer);
  }

  // 6. Log event if configured
  if (cfg.logEvents) {
    console.log('[ImageSecurity] Scan completed', {
      file: fileName,
      safe: threats.length === 0,
      threatCount: threats.length,
      warningCount: warnings.length,
      hasExif: !!exifData,
      hash: hash.substring(0, 8),
      scanTime: Date.now() - startTime,
    });
  }

  return {
    safe: threats.filter(t => t.severity === 'critical' || t.severity === 'high').length === 0,
    threats,
    warnings,
    exifData,
    hash,
    scanTime: Date.now() - startTime,
  };
}

/**
 * Check for duplicate images
 */
export async function checkDuplicate(
  buffer: Buffer,
  userId: string
): Promise<DuplicateCheckResult> {
  const hash = await calculatePerceptualHash(buffer);

  // Check for exact match
  for (const [key, value] of imageHashes.entries()) {
    if (value.hash === hash) {
      return {
        isDuplicate: true,
        hash,
        matchType: 'exact',
        existingFile: value.path,
      };
    }

    // Simple similarity check (hamming distance for perceptual hashes)
    const distance = hammingDistance(hash, value.hash);
    const similarity = 1 - (distance / Math.max(hash.length, value.hash.length));
    
    if (similarity > 0.9) { // 90% similar
      return {
        isDuplicate: true,
        hash,
        matchType: 'similar',
        similarityScore: similarity,
        existingFile: value.path,
      };
    }
  }

  return {
    isDuplicate: false,
    hash,
    matchType: 'none',
  };
}

/**
 * Store hash for future duplicate checks
 */
export function storeImageHash(
  hash: string, 
  path: string, 
  userId: string
): void {
  imageHashes.set(`${userId}:${path}`, {
    hash,
    path,
    timestamp: Date.now(),
  });

  // Clean old entries (keep last 1000 per user)
  const userEntries = Array.from(imageHashes.entries())
    .filter(([key]) => key.startsWith(`${userId}:`));
  
  if (userEntries.length > 1000) {
    const toDelete = userEntries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, userEntries.length - 1000);
    
    for (const [key] of toDelete) {
      imageHashes.delete(key);
    }
  }
}

/**
 * Calculate Hamming distance between two strings
 */
function hammingDistance(str1: string, str2: string): number {
  let distance = 0;
  const len = Math.min(str1.length, str2.length);
  
  for (let i = 0; i < len; i++) {
    if (str1[i] !== str2[i]) {
      distance++;
    }
  }
  
  // Add remaining length difference
  distance += Math.abs(str1.length - str2.length);
  
  return distance;
}

/**
 * Strip EXIF data from image (returns new buffer)
 */
export async function stripExifData(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = await import('sharp').then(m => m.default || m).catch(() => null);
    
    if (!sharp) {
      console.warn('[ImageSecurity] Sharp not available, cannot strip EXIF');
      return buffer;
    }

    return await sharp(buffer)
      .withoutExif()
      .withMetadata({}) // Clear most metadata
      .toBuffer();
  } catch (error) {
    console.error('[ImageSecurity] Failed to strip EXIF:', error);
    return buffer;
  }
}

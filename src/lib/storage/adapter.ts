/**
 * Storage Adapter Interface
 * Defines the contract for all storage providers
 * 
 * @module lib/storage/adapter
 */

export interface StorageFile {
  path: string;
  url: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DeleteResult {
  success: boolean;
  path: string;
  error?: string;
}

export interface ListOptions {
  prefix?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'modified' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface ListedFile {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

/**
 * Storage Adapter Interface - All storage providers must implement this
 */
export interface IStorageAdapter {
  /** Unique identifier for this adapter */
  readonly name: string;
  
  /** Human-readable description */
  readonly displayName: string;

  /**
   * Upload a file to storage
   * @param path - Destination path in storage
   * @param buffer - File content as Buffer
   * @param options - Upload options (content type, cache control, etc.)
   */
  upload(path: string, buffer: Buffer | Uint8Array, options?: UploadOptions): Promise<StorageFile>;

  /**
   * Download a file from storage
   * @param path - File path in storage
   */
  download(path: string): Promise<Buffer>;

  /**
   * Get public URL for a file
   * @param path - File path in storage
   */
  getPublicUrl(path: string): string;

  /**
   * Check if a file exists
   * @param path - File path to check
   */
  exists(path: string): Promise<boolean>;

  /**
   * Delete a file from storage
   * @param path - File path to delete
   */
  delete(path: string): Promise<DeleteResult>;

  /**
   * Delete multiple files
   * @param paths - Array of file paths to delete
   */
  deleteMany(paths: string[]): Promise<DeleteResult[]>;

  /**
   * List files in a directory/prefix
   * @param options - Listing options
   */
  list(options?: ListOptions): Promise<ListedFile[]>;

  /**
   * Get file metadata/statistics
   * @param path - File path
   */
  getMetadata(path: string): Promise<Partial<StorageFile> | null>;

  /**
   * Copy a file within storage
   * @param sourcePath - Source file path
   * @param destinationPath - Destination file path
   */
  copy(sourcePath: string, destinationPath: string): Promise<StorageFile>;

  /**
   * Move/rename a file
   * @param sourcePath - Current file path
   * @param destinationPath - New file path
   */
  move(sourcePath: string, destinationPath: String): Promise<StorageFile>;

  /**
   * Generate a signed URL for temporary access (if supported)
   * @param path - File path
   * @param expiresIn - URL expiry time in seconds
   */
  generateSignedUrl?(path: string, expiresIn?: number): Promise<string>;

  /**
   * Check if adapter is properly configured and ready
   */
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }>;
}

/**
 * Storage configuration interface
 */
export interface StorageConfig {
  provider: 'supabase' | 'local' | 's3' | 'azure' | 'gcs';
  bucket?: string;
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    accountName?: string;
    accountKey?: string;
    connectionString?: string;
  };
  options?: {
    publicUrl?: string;
    cdnUrl?: string;
    maxFileSize?: number;
    allowedMimeTypes?: string[];
  };
}

/**
 * Upload result with additional processing info
 */
export interface ProcessedUploadResult extends StorageFile {
  originalSize: number;
  compressionRatio: number;
  optimized: boolean;
  dimensions?: {
    width: number;
    height: number;
  };
  thumbnailUrl?: string;
  variants?: {
    thumbnail?: string;
    medium?: string;
    large?: string;
  };
}

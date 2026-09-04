/**
 * Storage Module - Main Entry Point
 * Exports all storage-related functionality
 * 
 * @module lib/storage
 */

// Core adapter interface and types
export {
  IStorageAdapter,
  StorageFile,
  UploadOptions,
  DeleteResult,
  ListOptions,
  ListedFile,
  StorageConfig,
  ProcessedUploadResult,
} from './adapter';

// Storage adapters
export { SupabaseStorageAdapter } from './supabase-adapter';
export type { SupabaseStorageConfig } from './supabase-adapter';
export { LocalStorageAdapter } from './local-adapter';
export type { LocalStorageConfig } from './local-adapter';

// Image processor
export {
  processImage,
  generateThumbnail,
  generateThumbnails,
  addWatermark,
  getImageDimensions as getProcessorDimensions,
  hasTransparency,
  calculateCompressionRatio,
  formatFileSize,
} from './image-processor';
export type {
  ImageDimensions,
  ProcessedImage,
  ThumbnailConfig,
  WatermarkOptions,
  ImageProcessorConfig,
} from './image-processor';

// Storage manager
export {
  StorageManager,
  getStorageManager,
} from './manager';
export type {
  UploadContext,
  AdvancedUploadOptions,
  UploadResult,
} from './manager';

// Batch upload manager
export {
  BatchUploadManager,
  resumeBatch,
  getBatchStatus,
  formatBatchFileSize,
} from './batch-upload';
export type {
  BatchUploadItem,
  BatchUploadOptions,
  BatchUploadState,
} from './batch-upload';

// Security scanner
export {
  scanImage,
  checkDuplicate,
  storeImageHash,
  stripExifData,
} from './image-security';
export type {
  SecurityScanResult,
  SecurityThreat,
  SecurityWarning,
  ExifData,
  DuplicateCheckResult,
  SecurityConfig,
} from './image-security';

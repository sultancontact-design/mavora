/**
 * Supabase Storage Adapter
 * Implements the IStorageAdapter interface for Supabase Storage
 * 
 * @module lib/storage/supabase-adapter
 */

import { 
  IStorageAdapter, 
  StorageFile, 
  UploadOptions, 
  DeleteResult, 
  ListOptions, 
  ListedFile 
} from './adapter';
import { getSupabaseAdminClient } from '@/lib/supabase';

export interface SupabaseStorageConfig {
  bucket: string;
  publicUrl?: string;
}

export class SupabaseStorageAdapter implements IStorageAdapter {
  readonly name = 'supabase';
  readonly displayName = 'Supabase Storage';
  
  private bucket: string;
  private publicUrl: string;

  constructor(config: SupabaseStorageConfig) {
    this.bucket = config.bucket || 'listing-images';
    this.publicUrl = config.publicUrl || '';
  }

  async upload(
    path: string, 
    buffer: Buffer | Uint8Array, 
    options?: UploadOptions
  ): Promise<StorageFile> {
    const adminClient = getSupabaseAdminClient();
    
    const { data, error } = await adminClient.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType: options?.contentType || 'application/octet-stream',
        cacheControl: options?.cacheControl || '31536000', // 1 year
        upsert: options?.upsert || false,
      });

    if (error) {
      console.error('[SupabaseStorage] Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const url = this.getPublicUrl(data?.path || path);

    return {
      path: data?.path || path,
      url,
      size: Buffer.from(buffer).length,
      mimeType: options?.contentType || 'application/octet-stream',
      metadata: options?.metadata,
    };
  }

  async download(path: string): Promise<Buffer> {
    const adminClient = getSupabaseAdminClient();
    
    const { data, error } = await adminClient.storage
      .from(this.bucket)
      .download(path);

    if (error) {
      console.error('[SupabaseStorage] Download error:', error);
      throw new Error(`Download failed: ${error.message}`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  getPublicUrl(path: string): string {
    const adminClient = getSupabaseAdminClient();
    const { data } = adminClient.storage
      .from(this.bucket)
      .getPublicUrl(path);
    
    // Use custom public URL if configured
    if (this.publicUrl) {
      return `${this.publicUrl}/${path}`;
    }
    
    return data.publicUrl;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const adminClient = getSupabaseAdminClient();
      // Try to get metadata - if it succeeds, file exists
      const { data, error } = await adminClient.storage
        .from(this.bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop(),
          limit: 1,
        });

      if (error) return false;
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  }

  async delete(path: string): Promise<DeleteResult> {
    try {
      const adminClient = getSupabaseAdminClient();
      const { error } = await adminClient.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        console.error('[SupabaseStorage] Delete error:', error);
        return {
          success: false,
          path,
          error: error.message,
        };
      }

      return { success: true, path };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        path,
        error: err.message,
      };
    }
  }

  async deleteMany(paths: string[]): Promise<DeleteResult[]> {
    // Supabase supports batch delete
    try {
      const adminClient = getSupabaseAdminClient();
      const { error } = await adminClient.storage
        .from(this.bucket)
        .remove(paths);

      if (error) {
        console.error('[SupabaseStorage] Batch delete error:', error);
        // Fall back to individual deletes
        return Promise.all(paths.map(p => this.delete(p)));
      }

      return paths.map(path => ({ success: true, path }));
    } catch {
      // Fall back to individual deletes
      return Promise.all(paths.map(p => this.delete(p)));
    }
  }

  async list(options?: ListOptions): Promise<ListedFile[]> {
    const adminClient = getSupabaseAdminClient();
    
    const prefix = options?.prefix || '';
    const folderPath = prefix.includes('/') ? prefix.substring(0, prefix.lastIndexOf('/')) : '';
    
    const { data, error } = await adminClient.storage
      .from(this.bucket)
      .list(folderPath, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        sortBy: {
          column: (options?.sortBy === 'size' ? 'size' : 'created_at') as 'name' | 'created_at' | 'updated_at' | 'size',
          order: options?.sortOrder || 'asc',
        },
      });

    if (error) {
      console.error('[SupabaseStorage] List error:', error);
      throw new Error(`List failed: ${error.message}`);
    }

    return (data || []).map(file => ({
      name: file.name,
      path: `${folderPath ? folderPath + '/' : ''}${file.name}`,
      size: file.metadata?.size || 0,
      createdAt: new Date(file.created_at),
      updatedAt: new Date(file.last_modified || file.created_at),
      url: this.getPublicUrl(`${folderPath ? folderPath + '/' : ''}${file.name}`),
    }));
  }

  async getMetadata(path: string): Promise<Partial<StorageFile> | null> {
    try {
      const exists = await this.exists(path);
      if (!exists) return null;

      // Get URL to confirm existence
      const url = this.getPublicUrl(path);
      
      return {
        path,
        url,
        // Note: Supabase doesn't provide detailed metadata without downloading
      };
    } catch {
      return null;
    }
  }

  async copy(sourcePath: string, destinationPath: string): Promise<StorageFile> {
    const adminClient = getSupabaseAdminClient();
    
    // Download source
    const buffer = await this.download(sourcePath);
    
    // Upload to destination
    return this.upload(destinationPath, buffer);
  }

  async move(sourcePath: string, destinationPath: string): Promise<StorageFile> {
    // Copy first
    const result = await this.copy(sourcePath, destinationPath);
    
    // Then delete source
    await this.delete(sourcePath);
    
    return result;
  }

  async generateSignedUrl?(path: string, expiresIn: number = 3600): Promise<string> {
    const adminClient = getSupabaseAdminClient();
    
    const { data, error } = await adminClient.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('[SupabaseStorage] Signed URL error:', error);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }

    return data.signedUrl;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      const adminClient = getSupabaseAdminClient();
      
      // Try to list root (with empty result expected)
      const { error } = await adminClient.storage
        .from(this.bucket)
        .list('', { limit: 1 });

      if (error) {
        return {
          status: 'unhealthy',
          details: `Bucket "${this.bucket}" error: ${error.message}`,
        };
      }

      return { status: 'healthy' };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        status: 'unhealthy',
        details: err.message,
      };
    }
  }

  /** Get the bucket name */
  getBucketName(): string {
    return this.bucket;
  }
}

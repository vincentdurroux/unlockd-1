import { supabase } from './supabase';

export const storageService = {
  /**
   * Upload a file to a Supabase bucket
   * @param bucket The name of the bucket (e.g., 'images')
   * @param path The path inside the bucket (e.g., 'ads/my-image.jpg')
   * @param file The file object from an input type="file"
   */
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  }
};

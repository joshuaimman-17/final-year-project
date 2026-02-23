import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseStorage = {
    /**
     * Uploads a file to the configured Supabase bucket.
     * @param file The file buffer or Blob to upload
     * @param fileName The desired filename (including path if needed)
     * @param bucketName Optional bucket name, defaults to env variable
     */
    upload: async (file: Buffer | Blob | File, fileName: string, bucketName: string = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'APP-STORAGE') => {
        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: (file instanceof File) ? file.type : undefined
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(data.path);

        return {
            id: data.path,
            url: publicUrl,
            path: data.path
        };
    },

    /**
     * Deletes a file from the bucket.
     */
    delete: async (path: string, bucketName: string = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'APP-STORAGE') => {
        const { error } = await supabase
            .storage
            .from(bucketName)
            .remove([path]);

        if (error) {
            console.error('Supabase Delete Error:', error);
            throw error;
        }
    }
};

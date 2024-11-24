import { v4 as uuidv4 } from 'uuid';
import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';
import { supabase } from '$lib/supabaseClient';
import sharp from 'sharp';

export const storageManager = () => {
  const getFileExtension = (fileName: string): string => {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  };

  const imageOptimizer = async (file: File) => {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    return await sharp(inputBuffer).resize(250).webp({ quality: 80 }).toBuffer();
  };

  const uploadPublicStorage = async (file: File, dir: string) => {
    const fileExtension = getFileExtension(file.name);
    const filePath = `${dir}/${uuidv4()}.${fileExtension}`;

    const optimizedImage = await imageOptimizer(file);

    const { data, error } = await supabase.storage
      .from(PUBLIC_SUPABASE_BUCKET)
      .upload(filePath, optimizedImage, {
        contentType: 'image/webp',
      });

    if (error) {
      throw new Error(error.message);
    }

    return data.path;
  };

  const removePublicStorageFile = async (paths: string[]) => {
    const { data, error } = await supabase.storage.from(PUBLIC_SUPABASE_BUCKET).remove(paths);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  return {
    uploadPublicStorage,
    removePublicStorageFile,
  };
};

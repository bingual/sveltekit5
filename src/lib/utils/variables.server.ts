import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';
import { supabase } from '$lib/supabaseClient';

import { map, pipe, reduce } from 'remeda';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export const storageManager = () => {
  const getFileExtension = (fileName: string): string => {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  };

  const imageOptimizer = async (file: File) => {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    return await sharp(inputBuffer).resize(400, 400).webp({ quality: 80 }).toBuffer();
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

export const replaceBlobImageSrc = (content: string, uploadResults: string[]) => {
  const getPublicUrl = (url: string) => {
    return supabase.storage.from(PUBLIC_SUPABASE_BUCKET).getPublicUrl(url).data.publicUrl;
  };

  const imgTagRegex = /<img\b[^>]*?\bsrc=["'](blob:.*?)["'][^>]*?>/gi;

  const matches = Array.from(content.matchAll(imgTagRegex));

  return pipe(
    matches,
    map((match, index) => {
      const [fullMatch, blobSrc] = match;
      const newSrc = getPublicUrl(uploadResults[index]);

      return newSrc
        ? { original: fullMatch, updated: fullMatch.replace(blobSrc, newSrc) }
        : { original: fullMatch, updated: fullMatch };
    }),
    reduce(
      (updatedContent, { original, updated }) => updatedContent.replace(original, updated),
      content,
    ),
  );
};

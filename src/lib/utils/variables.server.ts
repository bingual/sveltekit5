import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';
import { supabase } from '$lib/supabaseClient';

import { map, pipe, reduce } from 'remeda';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export const storageManager = () => {
  const getFileExtension = (fileName: string): string => {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  };

  const getPublicUrls = (urls: string[]) => {
    return map(urls, (url) => {
      return supabase.storage.from(PUBLIC_SUPABASE_BUCKET).getPublicUrl(url).data.publicUrl;
    });
  };

  const imageOptimizer = async (
    file: File,
    options = { width: 400, height: 400, quality: 100 },
  ) => {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    return await sharp(inputBuffer)
      .resize(options.width, options.height)
      .webp({ quality: options.quality })
      .toBuffer();
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

  const replaceBlobImageSrc = (content: string, uploadResults: string[]) => {
    const imgTagRegex = /<img\b[^>]*?\bsrc=["'](blob:.*?)["'][^>]*?>/gi;

    const matches = Array.from(content.matchAll(imgTagRegex));

    return pipe(
      matches,
      map((match, index) => {
        const [fullMatch, blobSrc] = match;
        const newSrc = uploadResults[index];

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

  return {
    getPublicUrls,
    imageOptimizer,
    uploadPublicStorage,
    removePublicStorageFile,
    replaceBlobImageSrc,
  };
};

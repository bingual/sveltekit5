import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';
import { supabase } from '$lib/supabaseClient';
import { PostWithImages } from '$lib/utils/prismaTypes';

import { sanitize } from '@jill64/universal-sanitizer';
import { filter, isArray, isString, map, pipe, reduce } from 'remeda';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export const storageManager = () => {
  const getPublicUrls = (urls: string[]) => {
    return map(urls, (url) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from(PUBLIC_SUPABASE_BUCKET).getPublicUrl(url);

      if (!publicUrl) {
        throw new Error(`해당 URL의 공개 주소를 생성할 수 없습니다: ${url}`);
      }

      return publicUrl;
    });
  };

  const getOriginUrls = (urls: string[]) => {
    const prefix = PUBLIC_SUPABASE_BUCKET;

    const filteredUrls = pipe(
      urls,
      filter((url) => url.startsWith('https') && url.includes(prefix)),
      map((url) => url.substring(url.indexOf(prefix) + prefix.length + 1)),
    );

    return filteredUrls.length > 0 ? filteredUrls : [];
  };

  const imageOptimizer = async (
    file: File,
    options: { width?: number; height?: number; quality: number } = { quality: 100 },
  ) => {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    return await sharp(inputBuffer)
      .resize(options.width, options.height)
      .webp({ quality: options.quality })
      .toBuffer();
  };

  const uploadPublicStorage = async (file: File, dir: string) => {
    const filePath = `${dir}/${uuidv4()}.webp`;

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

  const replaceBlobImageSrc = (htmlContent: string, uploadResults: string[]) => {
    const imgTagRegex = /<img\b[^>]*?\bsrc=["'](blob:.*?)["'][^>]*?>/gi;

    const matches = Array.from(htmlContent.matchAll(imgTagRegex));

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
        htmlContent,
      ),
    );
  };

  const extractImgSrc = (htmlContent: string) => {
    const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/g;

    const matches = Array.from(htmlContent.matchAll(imgSrcRegex));

    return reduce(
      matches,
      (acc, match) => {
        const src = match[1];
        if (src) acc.push(src);
        return acc;
      },
      [] as string[],
    );
  };

  return {
    getPublicUrls,
    getOriginUrls,
    imageOptimizer,
    uploadPublicStorage,
    removePublicStorageFile,
    replaceBlobImageSrc,
    extractImgSrc,
  };
};

export const sanitizeContents = (htmlContents: PostWithImages[] | string) => {
  const sanitizeConfig = (htmlContent: string) => {
    return sanitize(htmlContent, {
      sanitizeHtml: {
        allowedTags: [
          'b',
          'strong',
          'i',
          'em',
          'u',
          'del',
          'mark',
          'sup',
          'sub',
          'span',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'ul',
          'ol',
          'li',
          'a',
          'img',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'pre',
          'code',
          'blockquote',
          'hr',
          'br',
          'div',
          'figure',
          'figcaption',
          'iframe',
        ],
        allowedAttributes: {
          '*': ['class', 'style'],
          a: ['href', 'name', 'target'],
          img: ['src', 'alt', 'width', 'height', 'draggable'],
        },
        allowedSchemesByTag: {
          img: ['http', 'https', 'data'],
        },
        allowedSchemesAppliedToAttributes: ['src'],
        allowedSchemes: ['http', 'https'],
        allowedIframeHostnames: [],
        transformTags: {
          img: (tagName, attribs) => {
            const src = attribs.src ?? '';
            if (!/^https?:\/\/|^\/(images|uploads)\//.test(src)) {
              delete attribs.src;
            }
            return {
              tagName,
              attribs,
            };
          },
        },
      },
    });
  };

  return pipe(htmlContents, (input) =>
    isArray(input)
      ? map(input, (htmlContent) => ({
          ...htmlContent,
          content: sanitizeConfig(htmlContent.content),
        }))
      : isString(input)
        ? sanitizeConfig(input)
        : (() => {
            throw new Error('잘못된 입력 유형: 배열 또는 문자열이 필요합니다.');
          })(),
  );
};

import { PUBLIC_SUPABASE_BUCKET, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { storageManager } from '$lib/utils/variables.server';

const { getOriginUrls, imageOptimizer, replaceBlobImageSrc, extractImgSrc } = storageManager();

import { localStorageManager } from '$lib/utils/variables';

import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
  browser: false,
}));

describe('getOriginUrls', () => {
  it('버킷 접두사 이후의 원래 경로를 반환해야 한다', () => {
    const urls = [
      `${PUBLIC_SUPABASE_URL}/${PUBLIC_SUPABASE_BUCKET}/images/image1.jpg`,
      `${PUBLIC_SUPABASE_URL}/${PUBLIC_SUPABASE_BUCKET}/images/image2.jpg`,
    ];

    const result = getOriginUrls(urls);

    expect(result).toEqual([`images/image1.jpg`, `images/image2.jpg`]);
  });

  it('https로 시작하지 않는 URL을 처리해야 한다', () => {
    const urls = [`http://${PUBLIC_SUPABASE_BUCKET}/images/image1.jpg`];

    expect(() => getOriginUrls(urls)).toThrowError();
  });

  it('버킷 접두사가 없는 URL을 올바르게 처리해야 한다', () => {
    const urls = [`${PUBLIC_SUPABASE_URL}/images`];

    expect(() => getOriginUrls(urls)).toThrowError();
  });
});

describe('imageOptimizer', () => {
  it('옵션에 따라 이미지 크기와 품질이 변경되어야 한다', async () => {
    // 테스트용 이미지 파일 생성 (가상 파일 객체)
    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    const testFile = new File([testImageBuffer], 'test.webp', { type: 'image/webp' });

    const options = { width: 400, height: 400, quality: 100 };
    const optimizedImageBuffer = await imageOptimizer(testFile, options);

    const optimizedImage = sharp(optimizedImageBuffer);
    const metadata = await optimizedImage.metadata();

    expect(metadata.width).toBe(options.width);
    expect(metadata.height).toBe(options.height);
    expect(metadata.format).toBe('webp');
  });
});

describe('replaceBlobImageSrc', () => {
  it('img 태그의 blob URL이 uploadResults에 따라 대체되어야 한다', () => {
    const content = `
      <p>Some content</p>
      <img src="blob:example1" alt="Image 1" />
      <img src="blob:example2" alt="Image 2" />
      <p>More content</p>
      <img src="blob:example3" alt="Image 3" />
    `;

    const uploadResults = [
      'https://example.com/image1-public-url',
      'https://example.com/image2-public-url',
      'https://example.com/image3-public-url',
    ];

    const expectedOutput = `
      <p>Some content</p>
      <img src="https://example.com/image1-public-url" alt="Image 1" />
      <img src="https://example.com/image2-public-url" alt="Image 2" />
      <p>More content</p>
      <img src="https://example.com/image3-public-url" alt="Image 3" />
    `;

    const result = replaceBlobImageSrc(content, uploadResults);

    expect(result).toBe(expectedOutput);
  });

  it('uploadResults에 해당하는 값이 없으면 img 태그가 원래 상태로 유지되어야 한다', () => {
    const content = `
      <p>Some content</p>
      <img src="blob:example1" alt="Image 1" />
      <img src="blob:example2" alt="Image 2" />
    `;

    const uploadResults = ['https://example.com/image1-public-url']; // 하나의 결과만 제공

    const expectedOutput = `
      <p>Some content</p>
      <img src="https://example.com/image1-public-url" alt="Image 1" />
      <img src="blob:example2" alt="Image 2" />
    `;

    const result = replaceBlobImageSrc(content, uploadResults);

    expect(result).toBe(expectedOutput);
  });

  it('img 태그가 없으면 원래 content를 그대로 반환해야 한다', () => {
    const content = `<p>No images here!</p>`;
    const uploadResults: string[] = [];

    const result = replaceBlobImageSrc(content, uploadResults);

    expect(result).toBe(content);
  });

  it('content가 빈 문자열일 경우, 빈 문자열을 반환해야 한다', () => {
    const content = '';
    const uploadResults: string[] = [];

    const result = replaceBlobImageSrc(content, uploadResults);

    expect(result).toBe('');
  });
});

describe('extractImgSrc', () => {
  it('모든 img 태그의 src 속성을 추출해야 한다', () => {
    const htmlContent = `
      <p>Some content</p> 
      <img src="https://example.com/image1.jpg" alt="Image 1">
      <img src="images/image2.png">;
    `;

    const result = extractImgSrc(htmlContent);
    expect(result).toEqual(['https://example.com/image1.jpg', 'images/image2.png']);
  });

  it('img 태그가 없으면 빈 배열을 반환해야 한다', () => {
    const htmlContent = '<p>No images here</p>';
    const result = extractImgSrc(htmlContent);
    expect(result).toEqual([]);
  });

  it('src 속성이 없는 img 태그를 올바르게 처리해야 한다', () => {
    const htmlContent = '<img alt="No source">';
    const result = extractImgSrc(htmlContent);
    expect(result).toEqual([]);
  });

  it('다양한 속성을 가진 img 태그의 src 속성을 추출해야 한다', () => {
    const htmlContent =
      '<img src="https://example.com/image.jpg" width="500" height="300" alt="Example">';
    const result = extractImgSrc(htmlContent);
    expect(result).toEqual(['https://example.com/image.jpg']);
  });

  it('깨진 img 태그를 무시해야 한다', () => {
    const htmlContent = '<img src="https://example.com/image.jpg><p>Broken tag</p>';
    const result = extractImgSrc(htmlContent);
    expect(result).toEqual([]);
  });
});

describe('localStorageManager (Non-Browser 환경)', () => {
  const mockKey = 'testKey';
  const mockValue = { name: 'test', age: 30 };

  beforeEach(() => {
    localStorage.clear();
  });

  it('브라우저 환경이 아니라면 undefined를 반환해야한다.', () => {
    vi.mock('$app/environment', () => ({
      browser: false,
    }));
    const { saveToLocalStorage, clearLocalStorage, loadFromLocalStorage } = localStorageManager();

    saveToLocalStorage(mockKey, mockValue);
    clearLocalStorage();

    const result = loadFromLocalStorage(mockKey);
    expect(result).toBeUndefined();
  });
});

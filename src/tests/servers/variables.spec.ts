import { storageManager } from '$lib/utils/variables.server';

const { imageOptimizer, replaceBlobImageSrc } = storageManager();

import { localStorageManager } from '$lib/utils/variables';

import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
  browser: false,
}));

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

    const testFile = new File([testImageBuffer], 'test.png', { type: 'image/png' });

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

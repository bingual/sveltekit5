import { storageManager } from '$lib/utils/variables.server';

const { getOriginUrls, imageOptimizer, replaceBlobImageSrc, extractImgSrc } = storageManager();

import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';
import { localStorageManager } from '$lib/utils/variables';

import { difference } from 'remeda';
import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
  browser: false,
}));

const httpsExampleUrl = 'https://example.com';
const httpExampleUrl = 'http://example.com';

describe('getOriginUrls', () => {
  const prefix = `${httpsExampleUrl}/${PUBLIC_SUPABASE_BUCKET}`;
  const invalidPrefix1 = `${httpExampleUrl}/OTHER_BUCKET/images`;
  const invalidPrefix2 = `${httpExampleUrl}/${PUBLIC_SUPABASE_BUCKET}`;
  const invalidPrefix3 = `${httpExampleUrl}/images`;

  it('정상적인 URL 목록에서 올바른 결과를 반환해야 한다', () => {
    const urls = [
      `${prefix}/images/image1.jpg`,
      `${prefix}/images/image2.jpg`,
      `${prefix}/images/image3.jpg`,
      `${prefix}/images/image4.jpg`,
    ];
    const expectedResult = [
      'images/image1.jpg',
      'images/image2.jpg',
      'images/image3.jpg',
      'images/image4.jpg',
    ];
    expect(getOriginUrls(urls)).toEqual(expectedResult);
  });

  it('https로 시작하지 않는 URL은 결과에서 제외해야 한다', () => {
    const urls = [
      `${invalidPrefix1}/images/image1.jpg`,
      `${invalidPrefix2}/images/image2.jpg`,
      `${prefix}/images/image3.jpg`,
      `${prefix}/images/image4.jpg`,
    ];
    const expectedResult = ['images/image3.jpg', 'images/image4.jpg'];
    expect(getOriginUrls(urls)).toEqual(expectedResult);
  });

  it('prefix와 일치하지 않는 URL은 결과에서 제외해야 한다', () => {
    const urls = [
      `${invalidPrefix1}/images/image1.jpg`,
      `${invalidPrefix2}/images/image2.jpg`,
      `${invalidPrefix3}/image3.jpg`,
      `${prefix}/images/image4.jpg`,
    ];
    const expectedResult = ['images/image4.jpg'];
    expect(getOriginUrls(urls)).toEqual(expectedResult);
  });

  it('유효한 URL이 하나도 없으면 빈 배열을 반환해야 한다', () => {
    const urls = [
      `${invalidPrefix1}/images/image1.jpg`,
      `${invalidPrefix2}/images/image2.jpg`,
      `${invalidPrefix3}/image3.jpg`,
    ];
    const expectedResult: string[] = [];
    expect(getOriginUrls(urls)).toEqual(expectedResult);
  });

  it('빈 배열을 입력받으면 빈 배열을 반환해야 한다', () => {
    const urls: string[] = [];
    const expectedResult: string[] = [];
    expect(getOriginUrls(urls)).toEqual(expectedResult);
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
      `${httpsExampleUrl}/image1-public-url`,
      `${httpsExampleUrl}/image2-public-url`,
      `${httpsExampleUrl}/image3-public-url`,
    ];

    const expectedOutput = `
      <p>Some content</p>
      <img src="${httpsExampleUrl}/image1-public-url" alt="Image 1" />
      <img src="${httpsExampleUrl}/image2-public-url" alt="Image 2" />
      <p>More content</p>
      <img src="${httpsExampleUrl}/image3-public-url" alt="Image 3" />
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

    const uploadResults = [`${httpsExampleUrl}/image1-public-url`]; // 하나의 결과만 제공

    const expectedOutput = `
      <p>Some content</p>
      <img src="${httpsExampleUrl}/image1-public-url" alt="Image 1" />
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
      <img src="${httpsExampleUrl}/image1.jpg" alt="Image 1">
      <p></p> 
      <img src="images/image2.png">;
    `;

    const result = extractImgSrc(htmlContent);
    expect(result).toEqual([`${httpsExampleUrl}/image1.jpg`, 'images/image2.png']);
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
    const htmlContent = `<img src="${httpsExampleUrl}/image.jpg" width="500" height="300" alt="Example">`;
    const result = extractImgSrc(htmlContent);
    expect(result).toEqual([`${httpsExampleUrl}/image.jpg`]);
  });

  it('깨진 img 태그를 무시해야 한다', () => {
    const htmlContent = `<img src={"${httpsExampleUrl}/image.jpg><p>Broken tag</p>"}`;
    const result = extractImgSrc(htmlContent);
    expect(result).toEqual([]);
  });
});

describe('getOriginUrls & extractImgSrc & difference 테스트', () => {
  const prefix = `${httpsExampleUrl}/${PUBLIC_SUPABASE_BUCKET}`;

  it('memoImageUrls와 extractedImgSrc가 동일한 경우 차이가 없어야 한다', () => {
    const memoImageUrls = [`images/image1.jpg`, `images/image2.jpg`];

    const sanitizedMemos = `
      <img src="${prefix}/images/image1.jpg"/>
      <img src="${prefix}/images/image2.jpg"/>
    `;

    const extractedImgSrc = getOriginUrls(extractImgSrc(sanitizedMemos));
    const diffExtracted = difference(memoImageUrls, extractedImgSrc);

    expect(diffExtracted).toEqual([]);
  });

  it('memoImageUrls가 더 많고 extractedImgSrc가 더 적은 경우 차이를 반환해야 한다', () => {
    const memoImageUrls = [`images/image1.jpg`, `images/image2.jpg`, `images/image3.jpg`];

    const sanitizedMemos = `
      <img src="${prefix}/images/image1.jpg"/>
      <img src="${prefix}/images/image2.jpg"/>
    `;

    const extractedImgSrc = getOriginUrls(extractImgSrc(sanitizedMemos));
    const diffExtracted = difference(memoImageUrls, extractedImgSrc);

    expect(diffExtracted).toEqual([`images/image3.jpg`]);
  });

  it('memoImageUrls가 더 적고 extractedImgSrc가 더 많은 경우 차이가 없어야 한다', () => {
    const memoImageUrls = [`images/image1.jpg`];

    const sanitizedMemos = `
      <img src="${prefix}/images/image1.jpg"/>
      <img src="${prefix}/images/image2.jpg"/>
      <img src="${prefix}/images/image3.jpg"/>
    `;

    const extractedImgSrc = getOriginUrls(extractImgSrc(sanitizedMemos));
    const diffExtracted = difference(memoImageUrls, extractedImgSrc);

    expect(diffExtracted).toEqual([]);
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

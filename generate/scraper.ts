import {
  type BrowserContextOptions,
  chromium,
  type LaunchOptions,
  type Locator,
  type Page,
} from '@playwright/test';
import { filter, join, map, pipe } from 'remeda';

export const scrapManager = () => {
  const setupBrowser = async (
    headless: LaunchOptions['headless'] = true,
    timeout: LaunchOptions['timeout'] = 15000,
    viewport: BrowserContextOptions['viewport'] = { width: 1280, height: 720 },
  ) => {
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    page.setDefaultTimeout(timeout);

    return { page, browser };
  };

  const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

  const getEmptyFieldNames = (fields: Record<string, string>) => {
    const emptyFieldNames = pipe(
      Object.entries(fields),
      filter(([_, value]) => value.trim() === ''),
      map(([key]) => key),
      join(', '),
    );

    if (emptyFieldNames) {
      throw new Error(`다음 필드는 비어 있습니다: ${emptyFieldNames}`);
    }
  };

  const scrollToTheBottom =
    <T>(callBack: (container: Locator[], collectedIndexes: Set<string>) => Promise<T[]>) =>
    async (page: Page, container: Locator[], scrollStep = 500, sleepInterval = 200) => {
      const collectedIndexes = new Set<string>();
      const results: T[] = [];

      while (true) {
        const { scrollHeight, currentHeight } = await page.evaluate(() => ({
          scrollHeight: document.body.scrollHeight,
          currentHeight: window.scrollY + window.innerHeight,
        }));

        if (currentHeight >= scrollHeight) {
          break;
        }

        const result = await callBack(container, collectedIndexes);
        results.push(...result);

        await page.mouse.wheel(0, scrollStep);
        await sleep(sleepInterval);
      }

      return results;
    };

  return {
    setupBrowser,
    getEmptyFieldNames,
    scrollToTheBottom,
  };
};

import {
  chromium,
  type BrowserContextOptions,
  type LaunchOptions,
  type Page,
  type Locator,
} from '@playwright/test';

export const scrapManager = () => {
  const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

  const setupBrowser = async (
    headless: LaunchOptions['headless'] = false,
    timeout: LaunchOptions['timeout'] = 15000,
    viewport: BrowserContextOptions['viewport'] = { width: 1280, height: 720 },
  ) => {
    const browser = await chromium.launch({ headless, timeout });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    return { page, browser };
  };

  const scrollToTheBottom =
    <T>(callBack: (container: Locator[], collectedBrandIndexes: Set<string>) => Promise<T[]>) =>
    async (page: Page, container: Locator[], scrollStep = 500, sleepInterval = 200) => {
      try {
        const collectedBrandIndexes = new Set<string>();
        const results: T[] = [];

        while (true) {
          const { scrollHeight, currentHeight } = await page.evaluate(() => ({
            scrollHeight: document.body.scrollHeight,
            currentHeight: window.scrollY + window.innerHeight,
          }));

          if (currentHeight >= scrollHeight) {
            break;
          }

          const result = await callBack(container, collectedBrandIndexes);
          results.push(...result);

          await page.evaluate((step) => {
            window.scrollBy(0, step);
          }, scrollStep);

          await sleep(sleepInterval);
        }

        return results;
      } catch (e) {
        console.error(e);
        const buffer = await page.screenshot();
        console.log(buffer.toString('base64'));
      }
    };

  return {
    setupBrowser,
    sleep,
    scrollToTheBottom,
  };
};

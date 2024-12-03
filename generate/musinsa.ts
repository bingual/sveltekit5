import { scrapManager } from './scraper';
import type { Locator } from '@playwright/test';

const { setupBrowser, scrollToTheBottom, getEmptyFieldNames } = scrapManager();

const scrapBrands = async () => {
  const getBrandInfos = async (brandContainer: Locator[], collectedBrandIndexes: Set<string>) => {
    type CollectedBrandInfos = {
      brandName: string;
      brandLink: string;
      brandLogo: string;
    };

    const collectedBrandInfos: CollectedBrandInfos[] = [];

    for await (const container of brandContainer) {
      if (await container.isVisible()) {
        const containerIndex = await container.getAttribute('data-index');
        if (containerIndex && !collectedBrandIndexes.has(containerIndex)) {
          const sections = await container.locator('section.sc-1xnobe3-0').all();

          for await (const section of sections) {
            if (await section.isVisible()) {
              const header = section.locator('header > div > div');

              const [brandName, brandLink, brandLogo] = await Promise.all([
                await header.locator('div > a').first().innerText(),
                await header.locator('div > a').first().getAttribute('href'),
                await header.locator('div > img').first().getAttribute('src'),
              ]);

              getEmptyFieldNames({
                brandName: brandName,
                brandLink: brandLink ?? '',
                brandLogo: brandLogo ?? '',
              });
              collectedBrandInfos.push({
                brandName: brandName,
                brandLink: brandLink ?? '',
                brandLogo: brandLogo ?? '',
              });
            }
          }
          collectedBrandIndexes.add(containerIndex);
        }
      }
    }

    return collectedBrandInfos;
  };

  const run = async () => {
    try {
      const { page, browser } = await setupBrowser();

      await page.goto(
        `https://www.musinsa.com/main/musinsa/brand?skip_bf=Y&sectionId=561&categoryCode=000`,
      );

      const brandContainer = await page
        .locator('#commonLayoutContents > article > div:nth-child(3) > div > div > div')
        .all();

      const scrollWithGetBrandInfos = await scrollToTheBottom(getBrandInfos)(
        page,
        brandContainer,
        400,
        100,
      );

      console.log(scrollWithGetBrandInfos);
      console.log(`length: ${scrollWithGetBrandInfos.length}`);

      await page.close();
      await browser.close();
    } catch (e) {
      console.log(e);
    }
  };

  await run();
};

(async () => {
  await scrapBrands();
})();

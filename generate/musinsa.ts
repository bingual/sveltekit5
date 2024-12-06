import type { Locator } from '@playwright/test';

import { scrapManager } from './scraper';

const { setupBrowser, scrollToTheBottom, getEmptyFieldNames } = scrapManager();

const scrapBrands = async () => {
  const getBrandInfos = async (brandContainer: Locator[], collectedBrandIndexes: Set<string>) => {
    type CollectedBrandInfos = {
      brandName: string;
      brandUrl: string;
      brandLogoUrl: string;
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

              const [brandName, brandUrl, brandLogoUrl] = await Promise.all([
                await header.locator('div > a').first().innerText(),
                (await header.locator('div > a').first().getAttribute('href')) ?? '',
                (await header.locator('div > img').first().getAttribute('src')) ?? '',
              ]);

              const fields: CollectedBrandInfos = {
                brandName,
                brandUrl,
                brandLogoUrl,
              };
              getEmptyFieldNames(fields);
              collectedBrandInfos.push(fields);
            }
          }
          collectedBrandIndexes.add(containerIndex);
        }
      }
    }

    return collectedBrandInfos;
  };

  const run = async () => {
    const { page, browser } = await setupBrowser();
    try {
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
    } catch (err) {
      console.error(err);
    } finally {
      await page.close();
      await browser.close();
    }
  };

  await run();
};

(async () => await scrapBrands())();

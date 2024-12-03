import { scrapManager } from './scraper';
import { Locator, Page } from '@playwright/test';

const scrapYoutubeMelon = async () => {
  const { setupBrowser, sleep, getEmptyFieldNames } = scrapManager();

  const getVideoInfos = async (page: Page, sections: Locator[]) => {
    type CollectedVideoInfos = {
      shareUrl: string;
      title: string;
      author: string;
      views: string;
      postingDate: string;
    };
    const collectedVideoInfos: CollectedVideoInfos[] = [];

    for await (const section of sections) {
      const videoInfo = section.locator('#video-info');
      const [title, author, views, postingDate] = await Promise.all([
        await section.locator('#video-title').innerText(),
        await section.locator('#text > a').innerText(),
        await videoInfo.locator('span').nth(0).innerText(),
        await videoInfo.locator('span').nth(2).innerText(),
      ]);

      const menuBtn = section.locator('#menu');
      if (await menuBtn.isVisible()) await menuBtn.click();

      const shareBtn = page.locator('#items > ytd-menu-service-item-renderer:nth-child(3)');
      if (await shareBtn.isVisible()) await shareBtn.click();

      await sleep(500);

      const shareUrlInput = page.locator('#share-url');
      let shareUrl = '';
      if (await shareUrlInput.isVisible())
        shareUrl = await shareUrlInput.evaluate((input) => (input as HTMLInputElement).value);

      const closeBtn = page.locator('#close-button');
      if (await closeBtn.isVisible()) await closeBtn.click();

      getEmptyFieldNames({ shareUrl, title, author, views, postingDate });
      collectedVideoInfos.push({ shareUrl, title, author, views, postingDate });
    }

    return collectedVideoInfos;
  };

  const run = async () => {
    try {
      const { page, browser } = await setupBrowser();

      await page.goto(`https://www.youtube.com/playlist?list=PLn_Pl3CGIaYGMJTra9H9p9clHJhSObMKD`);

      const contents = page.locator('#contents');
      const sections = await contents.locator('ytd-playlist-video-renderer').all();

      const videoInfos = await getVideoInfos(page, sections);

      console.log(videoInfos);
      console.log(`length: ${videoInfos.length}`);

      await page.close();
      await browser.close();
    } catch (e) {
      console.error(e);
    }
  };

  await run();
};

(async () => await scrapYoutubeMelon())();

import { scrapManager } from './scraper';
import { Locator, Page } from '@playwright/test';

const { setupBrowser, sleep, getEmptyFieldNames } = scrapManager();

const scrapYoutubeMelon = async () => {
  const getVideoInfos = async (page: Page, sections: Locator[]) => {
    type CollectedVideoInfos = {
      thumbUrl: string;
      shareUrl: string;
      rank: string;
      time: string;
      title: string;
      author: string;
      views: string;
      date: string;
    };
    const collectedVideoInfos: CollectedVideoInfos[] = [];

    for await (const section of sections) {
      const videoInfo = section.locator('#video-info');
      const [thumbUrl, rank, time, title, author, views, date] = await Promise.all([
        (await section.locator('#thumbnail > yt-image > img').getAttribute('src')) ?? '',
        await section.locator('#index').innerText(),
        await section
          .locator(
            '#overlays > ytd-thumbnail-overlay-time-status-renderer > div.thumbnail-overlay-badge-shape.style-scope.ytd-thumbnail-overlay-time-status-renderer > badge-shape > div',
          )
          .innerText(),
        await section.locator('#video-title').innerText(),
        await section.locator('#text > a').innerText(),
        await videoInfo.locator('span').nth(0).innerText(),
        await videoInfo.locator('span').nth(2).innerText(),
      ]);

      const menuBtn = section.locator('#menu');
      if (await menuBtn.isVisible()) await menuBtn.click();

      const shareBtn = page.locator('#items > ytd-menu-service-item-renderer:nth-child(3)');
      if (await shareBtn.isVisible()) await shareBtn.click();

      await sleep(1500);

      const shareUrlInput = page.locator('#share-url');

      let shareUrl = '';
      if (await shareUrlInput.isVisible())
        shareUrl = await shareUrlInput.evaluate((input) => (input as HTMLInputElement).value);

      const closeBtn = page.locator('#close-button');
      if (await closeBtn.isVisible()) await closeBtn.click();

      const fields: CollectedVideoInfos = {
        thumbUrl,
        shareUrl,
        rank,
        time,
        title,
        author,
        views,
        date,
      };
      getEmptyFieldNames(fields);
      collectedVideoInfos.push(fields);
    }

    return collectedVideoInfos;
  };

  const run = async () => {
    const { page, browser } = await setupBrowser(false);
    try {
      await page.goto(`https://www.youtube.com/playlist?list=PLn_Pl3CGIaYGMJTra9H9p9clHJhSObMKD`);

      const contents = page.locator('#contents');
      const sections = await contents.locator('ytd-playlist-video-renderer').all();

      const videoInfos = await getVideoInfos(page, sections);

      console.log(videoInfos);
      console.log(`length: ${videoInfos.length}`);
    } catch (err) {
      console.error(err);
    } finally {
      await page.close();
      await browser.close();
    }
  };

  await run();
};

(async () => await scrapYoutubeMelon())();

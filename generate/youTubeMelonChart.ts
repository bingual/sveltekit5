import { scrapManager } from './scraper';
import { Locator, Page } from '@playwright/test';

const { setupBrowser, getEmptyFieldNames } = scrapManager();

const scrapYoutubeMelon = async () => {
  const getVideoInfos = async (page: Page, sections: Locator[]) => {
    type CollectedVideoInfos = {
      mainTitle: string;
      rank: string;
      time: string;
      title: string;
      author: string;
      views: string;
      date: string;
      thumbUrl: string;
      shareUrl: string;
    };
    const collectedVideoInfos: CollectedVideoInfos[] = [];

    const mainTitle = await page
      .locator(
        '#page-header > yt-page-header-renderer > yt-page-header-view-model > div.page-header-view-model-wiz__page-header-content > div.page-header-view-model-wiz__page-header-headline > div > yt-dynamic-text-view-model > h1 > span',
      )
      .innerText();

    for await (const section of sections) {
      const videoInfo = section.locator('#video-info');
      const [rank, time, title, author, views, date, thumbUrl] = await Promise.all([
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
        (await section.locator('#thumbnail > yt-image > img').getAttribute('src')) ?? '',
      ]);

      const menuBtn = section.locator('#menu');
      await menuBtn.click();

      const shareBtn = page.locator('#items > ytd-menu-service-item-renderer:nth-child(3)');
      await shareBtn.click();

      const shareUrlInput = page.locator('#share-url');
      await shareUrlInput.waitFor({ state: 'visible' });
      const shareUrl = await shareUrlInput.inputValue();

      const closeBtn = page.locator('#close-button');
      await closeBtn.click();

      const fields: CollectedVideoInfos = {
        mainTitle,
        rank,
        time,
        title,
        author,
        views,
        date,
        thumbUrl,
        shareUrl,
      };
      getEmptyFieldNames(fields);
      collectedVideoInfos.push(fields);
    }

    return collectedVideoInfos;
  };

  const run = async () => {
    const { page, browser } = await setupBrowser();
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

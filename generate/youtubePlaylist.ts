import { prisma } from '$lib/prisma';

import { Locator, Page } from '@playwright/test';
import { join, map, pipe, split } from 'remeda';

import { scrapManager } from './scraper';

const { setupBrowser, getEmptyFieldNames } = scrapManager();

// TODO: 프로젝트 방향성 정해지면 cronjob 돌려서 1주일 마다 스크래핑 하는 코드 추가하기
const scrapYoutubePlaylist = async () => {
  const getPlaylist = async (page: Page) => {
    return await page
      .locator(
        '#page-header > yt-page-header-renderer > yt-page-header-view-model > div.page-header-view-model-wiz__page-header-content > div.page-header-view-model-wiz__page-header-headline > div > yt-dynamic-text-view-model > h1 > span',
      )
      .innerText();
  };

  const getVideoInfos = async (page: Page, sections: Locator[]) => {
    type CollectedVideoInfos = {
      time: string;
      title: string;
      author: string;
      views: string;
      date: string;
      thumbUrl: string;
      shareUrl: string;
    };
    const collectedVideoInfos: CollectedVideoInfos[] = [];

    for await (const section of sections) {
      const videoInfo = section.locator('#video-info');
      const [time, title, author, views, date, thumbUrl] = await Promise.all([
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
      const originShareUrl = await shareUrlInput.inputValue();

      const shareUrl = pipe(
        originShareUrl,
        split(' '),
        map((url) => url.replace('https://youtu.be/', 'https://www.youtube.com/embed/')),
        join('/'),
      );

      const closeBtn = page.locator('#close-button');
      await closeBtn.click();

      const fields: CollectedVideoInfos = {
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

      const mainTitle = await getPlaylist(page);
      const collectedVideoInfos = await getVideoInfos(page, sections);

      const findPlaylist = await prisma.youTubePlaylist.findFirst({
        where: {
          title: mainTitle,
        },
      });

      if (!findPlaylist) {
        const createPlaylistWithVideo = await prisma.youTubePlaylist.create({
          data: {
            title: mainTitle,
            videoInfos: { createMany: { data: collectedVideoInfos } },
          },
        });

        console.log(createPlaylistWithVideo);
      } else {
        console.log('이미 존재하는 플레이 리스트입니다.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      await page.close();
      await browser.close();
    }
  };

  await run();
};

(async () => await scrapYoutubePlaylist())();

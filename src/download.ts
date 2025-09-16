import fs from 'node:fs/promises';
import path from 'node:path';

import { extractImages, downloadImage, parallel, userAgent } from './utils.js';
import type { Image } from './utils.js';

type Args = {
  url: string;
  folder: string;
  concurrency: number;
};

export async function download(args: Args) {
  // 下载主文档（HTML）
  console.log('> downloading html...');

  const html = await fetch(args.url, {
    redirect: 'follow',
    // 尽可能带上浏览器 UA，避免被防火墙拦截。
    headers: { accept: 'text/html', 'User-Agent': userAgent },
  }).then((res) => res.text());

  console.log(`> downloaded html, length = ${html.length}`);

  // console.log(html);

  // 解析 HTML，提取所有图片 URL 和 alt
  const images = extractImages(args.url, html);
  console.log(`> extracted ${images.length} images from html`);

  // console.log(images);

  // 并发下载图片
  console.log('> downloading images...');

  const total = images.length;
  let count = 0;

  const paths = await parallel(args.concurrency, images, async (image) => {
    // 当前进度
    const progress = `(${++count}/${total})`;

    console.log(`> ${progress} downloading ${image.src}`);

    // 执行任务
    const savePath = await task(args, image).catch((err) => {
      console.error(`> ${progress} failed to process ${image.src}:`, err);
      return null;
    });

    return savePath;
  });

  console.log('> done');
  console.log('> saved images:', paths.filter(Boolean));
}

/**
 * 单个图片下载流程
 * @param args Args
 * @param image Image
 */
async function task(args: Args, image: Image) {
  // 下载图片
  const { buf, ext } = await downloadImage(image.src);

  // 确定图片名称，如果没有 alt 信息则使用 image-<时间戳>。
  const name = path.basename(`${image.alt || `image-${Date.now()}`}.${ext}`);
  // 完整的图片保存路径
  const savePath = path.join(args.folder, name);

  // 确保目标文件夹存在
  await fs.mkdir(args.folder, { recursive: true });

  // 写入文件
  await fs.writeFile(savePath, buf);

  return savePath;
}

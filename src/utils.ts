export type Image = {
  src: string;
  alt: string;
};

export const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/**
 * 提取 HTML 中的图片
 * @param html - HTML 字符串
 * @returns 图片数组
 */
export function extractImages(url: string, html: string): Image[] {
  const regex =
    /<img[^>]+src=["']([^"'>]+)["'][^>]*(?:alt=["']([^"'>]*)["'])?[^>]*>/gi;

  const matches = html.match(regex);

  if (!matches) {
    return [];
  }

  // 提取原始值
  const rawImages = matches.map((match) => {
    const srcMatch = match.match(/src=["']([^"'>]+)["']/i);
    const altMatch = match.match(/alt=["']([^"'>]*)["']/i);

    return {
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : '',
    };
  });

  // 处理 src 为相对路径的情况，比如：
  // //example.com/image.png
  // /image.png
  // ./image.png
  // ../image.png
  const images = rawImages.map((image) => {
    if (image.src.startsWith('/') || image.src.startsWith('.')) {
      const resolvedUrl = new URL(image.src, url);

      return {
        ...image,
        src: resolvedUrl.href,
      };
    }
    return image;
  });

  return images;
}

/**
 * 下载图片
 * @param src - 图片 URL
 * @returns 图片 buf、mime 格式、文件扩展名
 */
export async function downloadImage(src: string) {
  let buf: Buffer;
  let mime = '';

  if (src.startsWith('data:')) {
    // src 为内联 base64 图片，需去掉前缀，比如 data:image/png;base64,xxx 只保留后面的 xxx。
    const [prefix, base64] = src.split(',');
    mime = prefix.split(';')[0].substring('data:'.length);
    buf = Buffer.from(base64, 'base64');
  } else {
    // 非内联 base64 图片，从网络下载。
    const res = await fetch(src, {
      redirect: 'follow',
      headers: { accept: '*/*', 'User-Agent': userAgent },
    });

    // 从响应头中获取图片的 mime 格式，比如 image/png、image/jpeg、image/gif 等。
    const contentType = res.headers.get('content-type');
    mime = contentType?.split(';')[0] || '';

    // 从响应体中获取图片的二进制数据。
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    buf = Buffer.from(arrayBuffer);
  }

  // 取出 mime 斜线后面的部分作为文件扩展名，比如 png、jpeg、gif 等。
  let ext = mime.split('/')[1];

  // svg 的 mime 格式为 image/svg+xml，需要特殊处理。
  if (mime === 'image/svg+xml') {
    ext = 'svg';
  }

  return { buf, mime, ext };
}

/**
 * 并发执行任务
 * @param concurrency 并发数量
 * @param tasks 任务数组
 * @param executor 任务执行函数
 * @returns 任务结果数组
 */
export async function parallel<T, K>(
  concurrency: number,
  tasks: T[],
  executor: (task: T) => Promise<K>
) {
  if (concurrency < 1) {
    throw new Error('并发数量必须大于0');
  }

  if (tasks.length === 0) {
    return [];
  }

  return new Promise<K[]>(async (resolve, reject) => {
    const results: K[] = new Array(tasks.length);
    const errors: Error[] = [];

    const tasks_ = [...tasks];

    // 执行中的任务
    const promises: Promise<void>[] = [];

    let cursor = 0;

    // 当全部任务未完成且没有遇到任何错误时执行循环
    while (tasks_.length > 0 && errors.length === 0) {
      // 等待任意一个任务完成
      if (promises.length !== 0) {
        await Promise.race(promises);
      }

      // 取出一批任务（利用剩余并发数量）
      const batch = tasks_
        .splice(0, concurrency - promises.length)
        // 带上绝对索引，对应原始任务数组中的位置。
        .map((task, idx) => ({ task, index: cursor + idx }));

      // 异步执行每个任务
      for (const item of batch) {
        cursor += 1;

        const promise = executor(item.task)
          .then((result) => {
            // 将结果保存到结果数组中，利用 index 保证顺序一致。
            results[item.index] = result;
          })
          .catch((error) => {
            errors.push(error);
          })
          .finally(() => {
            // 从列表中移除该任务
            promises.splice(promises.indexOf(promise), 1);
          });

        promises.push(promise);
      }
    }

    // 等待所有任务完成
    if (promises.length > 0) {
      // 也可以用 Promise.all，因为 promises 的错误已经被 .catch 捕获了。
      await Promise.allSettled(promises);
    }

    // 抛出错误
    if (errors.length) {
      reject(new AggregateError(errors));
      return;
    }

    resolve(results);
  });
}

class AggregateError extends Error {
  readonly errors: Error[] = [];

  constructor(errors: Error[]) {
    super();
    const name = errors.find((e) => e.name)?.name ?? '';
    this.name = `AggregateError(${name}...)`;
    this.message = `AggregateError with ${errors.length} errors`;
    this.stack = errors.find((e) => e.stack)?.stack ?? this.stack;
    this.errors = errors;
  }
}

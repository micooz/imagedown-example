import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { download } from './download.js';

// 解析命令行参数
yargs(hideBin(process.argv))
  .command(
    '$0 <url> <folder>',
    '下载网页中的图片到指定文件夹',
    (yargs) => {
      return yargs
        .positional('url', {
          describe: '需要爬取图片的网页 URL',
          type: 'string',
          demandOption: true,
        })
        .positional('folder', {
          describe: '保存图片的本地文件夹路径',
          type: 'string',
          demandOption: true,
        })
        .option('concurrency', {
          alias: 'c',
          describe: '控制图片下载的并发数量',
          type: 'number',
          default: 1,
          coerce: (value) => {
            if (value < 1) {
              throw new Error('并发数量必须大于0');
            }
            return value;
          },
        });
    },
    async (args) => {
      await download(args).catch(console.error);
    }
  )
  .help()
  .alias('help', 'h')
  .showHelpOnFail(true)
  .strict()
  .parse();

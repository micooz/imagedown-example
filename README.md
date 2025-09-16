# imagedown-examples

图片下载工具案例，用于 Node.js 教学参考。

# 技能点

- ESM + TypeScript 打底
- Node.js CLI 程序的基本写法
- Node.js fs、path、buffer 模块的基本用法
- fetch、URL 标准 Web API 的用法
- http 请求、响应的处理方法
- Promise 异步编程技巧
- 手撕并发编程算法

# 用法

```bash
npx imagedown-examples --help

imagedown-examples <url> <folder>

下载网页中的图片到指定文件夹

Positionals:
  url     需要爬取图片的网页 URL                                        [string]
  folder  保存图片的本地文件夹路径                                      [string]

Options:
      --version      Show version number                               [boolean]
  -h, --help         Show help                                         [boolean]
  -c, --concurrency  控制图片下载的并发数量                [number] [default: 1]
```

样例命令：

```bash
npx imagedown-examples --concurrency 3 https://www.bing.com/images/ ./images
> downloading html...
> downloaded html, length = 758484
> extracted 47 images from html
> downloading images...
> (1/47) downloading https://r.bing.com/rp/f21jlSMmEDN43OaavcdaB-7Phq0.svg
> (2/47) downloading https://r.bing.com/rp/fdVZU4ttbw8NDRm6H3I5BW3_vCo.svg
> (3/47) downloading https://r.bing.com/rp/4L4QdyjTv0HYE2Ig2ol9eYoqxg8.svg
> (4/47) downloading https://r.bing.com/rp/Fsa_OI0AplCnVoXGca8ALOo0S0s.svg
> ...
> (47/47) downloading data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAANElEQVQokWMwTtv9nxzMMKpxhGv8/x+B0SQXIMuhY1waLwCxAKkaPwCxAT5NuDQmENIEwgA05eEwFjHcAQAAAABJRU5ErkJggg==
> done
> saved images: [
  'images/Cool Discord Profile Pics.jpeg',
  'images/OneRepublic Wallpapers (45 images) - WallpaperCat.jpeg',
  'images/Solve pure love jigsaw puzzle online with 80 pieces.jpeg',
  'images/Spider Fawn Library | Cinematic photography, Art photography, Photography inspiration.jpeg',
  'images/Cars Aesthetic Wallpapers · 280+ Backgrounds 🚗🚕🚙.jpeg',
  ...
]
```

# 开发

```bash
npm run watch
node bin/main.js --concurrency 3 https://www.bing.com/images/ ./images
```

// GET /api/video?v=<videoId>
// 校验 HttpOnly cookie 中的 HMAC token,通过后从 R2 bucket 流式返回视频内容。
// 视频原始 URL 不暴露给前端,F12 看到的只是 /api/video 这个代理端点。
// token 失效(24h 过期或被清)则返回 403,前端据此重新弹解锁窗。
// 支持 Range 请求,浏览器拖动进度条时可分段读取。

import { verify, getCookie, COOKIE_NAME } from '../_lib/auth';

interface R2ObjectMetadata {
  etag?: string;
  httpEtag?: string;
  writeHttpMetadata(headers: Headers): void;
  size: number;
  uploaded: Date;
}

interface R2ObjectBody extends R2ObjectMetadata {
  body: ReadableStream;
  range?: { offset: number; length: number };
}

type R2Range =
  | { offset: number; length: number }
  | { suffix: number };

interface R2Bucket {
  head(key: string): Promise<R2ObjectMetadata | null>;
  get(
    key: string,
    options?: { range?: R2Range },
  ): Promise<R2ObjectBody | null>;
}

interface Env {
  LOCKED_VIDEOS: R2Bucket;
  HMAC_SECRET: string;
}

// videoId 是单个 R2 文件名，不接受斜杠、反斜杠、点段或百分号，杜绝路径穿越。
const SAFE_VIDEO_ID = /^[a-zA-Z0-9_-]+\.mp4$/i;

function parseRange(rangeHeader: string, size: number): R2Range | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m) return null;
  const startRaw = m[1];
  const endRaw = m[2];
  if (!startRaw && !endRaw) return null;
  if (startRaw) {
    const offset = parseInt(startRaw, 10);
    if (Number.isNaN(offset) || offset < 0 || offset >= size) return null;
    const end = endRaw ? parseInt(endRaw, 10) : size - 1;
    if (Number.isNaN(end) || end < offset) return null;
    const clampedEnd = Math.min(end, size - 1);
    return { offset, length: clampedEnd - offset + 1 };
  }
  // suffix form: bytes=-N 取最后 N 个字节
  const suffix = parseInt(endRaw, 10);
  if (Number.isNaN(suffix) || suffix <= 0) return null;
  return { suffix: Math.min(suffix, size) };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.HMAC_SECRET || !env.LOCKED_VIDEOS) {
    return new Response('Server misconfigured', { status: 500 });
  }

  const token = getCookie(request, COOKIE_NAME);
  if (!token) return new Response('Forbidden', { status: 403 });
  if (!(await verify(token, env.HMAC_SECRET))) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const v = url.searchParams.get('v');
  if (!v || !SAFE_VIDEO_ID.test(v)) {
    return new Response('Not found', { status: 404 });
  }

  const key = `videos/${v}`;
  const rangeHeader = request.headers.get('Range');

  // 第一次拿元数据:用空 range 请求 size,或者直接拿一次;R2 get 不带 range 可拿完整对象
  // 这里分两种调用以支持 range:无 range 时直接拿完整,有 range 时传 range option
  if (!rangeHeader) {
    const obj = await env.LOCKED_VIDEOS.get(key);
    if (!obj) return new Response('Not found', { status: 404 });
    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Cache-Control', 'private, max-age=600');
    headers.set('Accept-Ranges', 'bytes');
    if (obj.size) headers.set('Content-Length', String(obj.size));
    obj.writeHttpMetadata(headers);
    return new Response(obj.body, { headers });
  }

  const metadata = await env.LOCKED_VIDEOS.head(key);
  if (!metadata) return new Response('Not found', { status: 404 });
  const size = metadata.size;

  const r = parseRange(rangeHeader, size);
  if (!r) {
    return new Response('Range not satisfiable', {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}` },
    });
  }

  const obj = await env.LOCKED_VIDEOS.get(key, { range: r });
  if (!obj) return new Response('Not found', { status: 404 });

  let start: number;
  let end: number;
  if ('offset' in r) {
    start = r.offset;
    end = r.offset + r.length - 1;
  } else {
    const suffix = r.suffix;
    start = size - suffix;
    end = size - 1;
  }

  const headers = new Headers();
  headers.set('Content-Type', 'video/mp4');
  headers.set('Cache-Control', 'private, max-age=600');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  obj.writeHttpMetadata(headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(obj.body, { status: 206, headers });
};

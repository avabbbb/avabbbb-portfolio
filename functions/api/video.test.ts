import { describe, expect, it, vi } from 'vitest';
import { COOKIE_NAME, sign } from '../_lib/auth';
import { onRequestGet } from './video';

const secret = 'a-test-signing-secret-that-is-long-enough';
const size = 100;

function stream(length: number): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(length));
      controller.close();
    },
  });
}

function createBucket() {
  const metadata = {
    size,
    uploaded: new Date(0),
    writeHttpMetadata: () => {},
  };
  return {
    head: vi.fn(async () => metadata),
    get: vi.fn(async (_key: string, options?: { range?: { offset?: number; length?: number; suffix?: number } }) => ({
      ...metadata,
      body: stream(options?.range?.length ?? options?.range?.suffix ?? size),
    })),
  };
}

async function createContext(url: string, bucket: ReturnType<typeof createBucket>, range?: string, cookieToken?: string) {
  const token = cookieToken ?? await sign({ purpose: 'locked-video', exp: Date.now() + 60_000 }, secret);
  const headers = new Headers({ Cookie: `${COOKIE_NAME}=${token}` });
  if (range) headers.set('Range', range);
  return {
    request: new Request(url, { headers }),
    env: { HMAC_SECRET: secret, LOCKED_VIDEOS: bucket },
    params: {},
    data: undefined,
    waitUntil: () => {},
    next: async () => new Response(),
  } as unknown as Parameters<typeof onRequestGet>[0];
}

describe('GET /api/video', () => {
  it('rejects malformed tokens and traversal-style video ids', async () => {
    const bucket = createBucket();
    const malformed = await onRequestGet(await createContext(
      'https://portfolio.test/api/video?v=safe.mp4',
      bucket,
      undefined,
      'not.valid-base64!!!',
    ));
    const traversal = await onRequestGet(await createContext(
      'https://portfolio.test/api/video?v=..%2Fsecret.mp4',
      bucket,
    ));

    expect(malformed.status).toBe(403);
    expect(traversal.status).toBe(404);
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it('clamps an oversized byte range to the object boundary', async () => {
    const bucket = createBucket();
    const response = await onRequestGet(await createContext(
      'https://portfolio.test/api/video?v=aigc-annual-1080p.mp4',
      bucket,
      'bytes=90-999',
    ));

    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('bytes 90-99/100');
    expect(response.headers.get('content-length')).toBe('10');
    expect(bucket.head).toHaveBeenCalledWith('videos/aigc-annual-1080p.mp4');
    expect(bucket.get).toHaveBeenCalledWith('videos/aigc-annual-1080p.mp4', {
      range: { offset: 90, length: 10 },
    });
  });

  it('returns 416 for a range that starts beyond the object', async () => {
    const bucket = createBucket();
    const response = await onRequestGet(await createContext(
      'https://portfolio.test/api/video?v=aigc-annual-1080p.mp4',
      bucket,
      'bytes=100-',
    ));

    expect(response.status).toBe(416);
    expect(response.headers.get('content-range')).toBe('bytes */100');
    expect(bucket.get).not.toHaveBeenCalled();
  });
});

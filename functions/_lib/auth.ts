// Pages Functions 共享工具:HMAC token 签发/校验 + cookie + JSON 响应。

const enc = new TextEncoder();
const dec = new TextDecoder();

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64u(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let s = '';
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// 签发 token:base64url(payload).base64url(hmac(payload))
export async function sign(payload: object, secret: string): Promise<string> {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return `${body}.${b64u(sig)}`;
}

// 校验 token 签名 + 过期时间
export async function verify(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [body, sig] = parts;
    const key = await getKey(secret);
    const ok = await crypto.subtle.verify('HMAC', key, b64uDecode(sig), enc.encode(body));
    if (!ok) return false;
    const payload = JSON.parse(dec.decode(b64uDecode(body)));
    return payload?.purpose === 'locked-video'
      && typeof payload.exp === 'number'
      && Number.isFinite(payload.exp)
      && payload.exp >= Date.now();
  } catch {
    return false;
  }
}

// 恒定时间比较解锁凭据，避免直接字符串比较泄露前缀匹配时序。
export async function secureEqual(input: string, expected: string): Promise<boolean> {
  const inputDigest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  const expectedDigest = await crypto.subtle.digest('SHA-256', enc.encode(expected));
  const a = new Uint8Array(inputDigest);
  const b = new Uint8Array(expectedDigest);
  let diff = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return diff === 0;
}

export function getCookie(req: Request, name: string): string | null {
  const c = req.headers.get('Cookie');
  if (!c) return null;
  for (const pair of c.split(';')) {
    const eq = pair.indexOf('=');
    const k = (eq === -1 ? pair : pair.slice(0, eq)).trim();
    const v = eq === -1 ? '' : pair.slice(eq + 1).trim();
    if (k === name) return v;
  }
  return null;
}

export function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

// token 有效期 24 小时
export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const COOKIE_NAME = 'lkf_unlock';

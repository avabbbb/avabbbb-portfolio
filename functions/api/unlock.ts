// POST /api/unlock
// 请求体: { "credential": "..." }
// 校验通过后下发 HttpOnly cookie(短期 HMAC token),前端无法读取,只能由浏览器在后续 /api/video 请求中自动携带。
// 解锁凭据通过 Cloudflare Secret 注入，不得与公开邮箱或任何前端资料复用。

import { sign, secureEqual, json, COOKIE_NAME, TOKEN_TTL_MS } from '../_lib/auth';

interface Env {
  UNLOCK_CREDENTIAL: string;
  HMAC_SECRET: string;
}

interface Body {
  credential?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.UNLOCK_CREDENTIAL || !env.HMAC_SECRET) {
    return json({ ok: false, error: 'server' }, 500);
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  const input = typeof body.credential === 'string' ? body.credential.trim() : '';
  const target = env.UNLOCK_CREDENTIAL.trim();
  if (!input || input.length > 256 || !(await secureEqual(input, target))) {
    return json({ ok: false, error: 'wrong' }, 403);
  }

  const token = await sign({ purpose: 'locked-video', exp: Date.now() + TOKEN_TTL_MS }, env.HMAC_SECRET);
  const cookie = `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TOKEN_TTL_MS / 1000}`;
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
};

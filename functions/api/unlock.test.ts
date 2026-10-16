import { describe, expect, it } from 'vitest';
import { verify } from '../_lib/auth';
import { onRequestPost } from './unlock';

const signingSecret = 'a-test-signing-secret-that-is-long-enough';
const credential = 'invite-only-credential';

function createContext(body: string, env: { HMAC_SECRET?: string; UNLOCK_CREDENTIAL?: string }) {
  return {
    request: new Request('https://portfolio.test/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
    env,
    params: {},
    data: undefined,
    waitUntil: () => {},
    next: async () => new Response(),
  } as unknown as Parameters<typeof onRequestPost>[0];
}

describe('POST /api/unlock', () => {
  it('rejects the public contact email as an unlock credential', async () => {
    const response = await onRequestPost(createContext(
      JSON.stringify({ credential: '921693422@qq.com' }),
      { HMAC_SECRET: signingSecret, UNLOCK_CREDENTIAL: credential },
    ));

    expect(response.status).toBe(403);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('issues a secure, purpose-limited cookie for the configured credential', async () => {
    const response = await onRequestPost(createContext(
      JSON.stringify({ credential }),
      { HMAC_SECRET: signingSecret, UNLOCK_CREDENTIAL: credential },
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    const token = /lkf_unlock=([^;]+)/.exec(cookie)?.[1] ?? '';
    await expect(verify(token, signingSecret)).resolves.toBe(true);
  });

  it('fails closed when required secrets or JSON are missing', async () => {
    const missingSecret = await onRequestPost(createContext(
      JSON.stringify({ credential }),
      { HMAC_SECRET: signingSecret },
    ));
    const malformed = await onRequestPost(createContext(
      '{',
      { HMAC_SECRET: signingSecret, UNLOCK_CREDENTIAL: credential },
    ));

    expect(missingSecret.status).toBe(500);
    expect(malformed.status).toBe(400);
  });
});

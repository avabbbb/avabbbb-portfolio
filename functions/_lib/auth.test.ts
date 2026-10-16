import { describe, expect, it } from 'vitest';
import { sign, verify } from './auth';

describe('locked-content auth tokens', () => {
  const secret = 'a-test-secret-that-is-long-enough';

  it('accepts only unexpired tokens scoped to locked video', async () => {
    const valid = await sign({ purpose: 'locked-video', exp: Date.now() + 60_000 }, secret);
    const expired = await sign({ purpose: 'locked-video', exp: Date.now() - 1 }, secret);
    const wrongPurpose = await sign({ purpose: 'other', exp: Date.now() + 60_000 }, secret);

    await expect(verify(valid, secret)).resolves.toBe(true);
    await expect(verify(expired, secret)).resolves.toBe(false);
    await expect(verify(wrongPurpose, secret)).resolves.toBe(false);
    await expect(verify('not.valid-base64!!!', secret)).resolves.toBe(false);
  });
});

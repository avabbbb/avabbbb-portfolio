import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 单测只跑 src/functions 下的 *.test.*；tests/e2e 由 Playwright 负责
    include: ['src/**/*.test.{ts,tsx}', 'functions/**/*.test.{ts,tsx}'],
  },
});

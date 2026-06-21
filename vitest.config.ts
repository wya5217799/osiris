import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

// 轻量配置：i18n / 纯函数走 node 环境，无需 jsdom。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': resolve(root, 'src') },
  },
});

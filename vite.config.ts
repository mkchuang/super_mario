import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages 部署於 /super_mario/ 子路徑（TASK-024）
  base: process.env.GITHUB_ACTIONS ? '/super_mario/' : '/',
  // assets/ 內容以根路徑提供（tilemaps/、sprites/、audio/），build 時原樣複製
  publicDir: 'assets',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
  },
});

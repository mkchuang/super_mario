# 技術棧定義

> **用途**：定義專案使用的技術棧，供 AI agent 理解技術約束
> **填寫時機**：`adf.design` 初始化專案時（2026-06-11）
> **引用者**：所有 agent（透過 CLAUDE.md 引用）

---

## 程式語言

| 語言 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.x（strict mode） | 主要語言，全部遊戲邏輯 |

## 框架與函式庫

| 名稱 | 版本 | 用途 |
|------|------|------|
| Phaser | 3.x 最新穩定版 | 遊戲框架：rendering、Arcade Physics、audio、input、tilemap |

## 建置工具

| 工具 | 版本 | 用途 |
|------|------|------|
| Vite | 最新穩定版 | dev server 與 production bundle |
| Vitest | 最新穩定版 | 邏輯層單元測試 |
| ESLint + Prettier | 最新穩定版 | Lint 與格式化 |
| Tiled Map Editor | 1.x | 關卡編輯（輸出 JSON，非 build 依賴） |

## 目標平台

- **執行環境**：桌面瀏覽器（Chrome / Firefox / Safari / Edge 最新版）
- **硬體約束**：一般桌機/筆電，目標穩定 60 FPS
- **部署形式**：純靜態網站（無後端）

## 外部依賴與服務

| 服務/API | 用途 | 備註 |
|----------|------|------|
| localStorage | 遊戲進度與最高分存檔 | 無後端、無帳號系統 |
| GitHub Pages | 部署 | GitHub Actions：push main 自動 build + deploy |
| Kenney.nl 素材包 | 美術素材（sprite/tileset/音效） | CC0 授權，自製僅補缺口 |

## 技術限制

- 不引入後端服務；所有功能必須可在純靜態網站下運作
- 不使用任天堂原版素材，僅用自製或 CC0/開源授權素材
- TypeScript strict mode；函數 `camelCase`、類別 `PascalCase`、常數 `SCREAMING_SNAKE_CASE`
- 遊戲物理/手感參數集中於 `src/config/`，不散落在各 entity 中

---
*此檔案為靜態技術棧定義，變更技術棧時請同步更新*

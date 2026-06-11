# 專案全貌 - Project Overview

> 此文件描述專案的靜態資訊，較少變動
> 最後更新：2026-06-11（由 adf.design 初始化）

## 🎯 專案簡介

### 專案目標
打造一款 **經典 Super Mario Bros. 風格的 2D side-scrolling 平台遊戲**，以瀏覽器為執行平台，重點在「遊戲本身可玩、手感扎實」。本專案同時作為 TypeScript + Phaser 遊戲開發的完整實踐，產出一個從標題畫面到通關流程完整的小遊戲。

### 核心功能
- **角色操控**：跑步、跳躍（可變高度跳）、加速衝刺，重現經典平台手感
- **物理與碰撞**：重力、tile-based 地形碰撞、踩踏敵人判定
- **敵人系統**：基本敵人（Goomba 型、Koopa 型）巡邏 AI 與踩踏/碰撞互動
- **Power-up 系統**：蘑菇（變大）、火花（攻擊能力）、無敵星，含受傷降級流程
- **關卡系統**：5 個 tilemap 關卡、旗桿過關、地下/地上場景切換
- **計分與 HUD**：金幣、分數、生命數、倒數計時
- **遊戲流程**：標題畫面 → 關卡選擇/順序進行 → 過關/死亡 → 結算
- **音效音樂**：BGM 與動作音效（跳躍、吃金幣、踩敵、死亡）

### 目標用戶
- 一般玩家：透過瀏覽器即開即玩，無需安裝
- 開發者本人：作為 Web 遊戲開發架構實踐與作品展示

### 專案範圍
- **包含**: 單人遊玩、鍵盤操作、桌面瀏覽器、5 個完整關卡、存檔進度（localStorage）
- **不包含**:
  - 多人連線、排行榜後端
  - 行動裝置觸控操作（後續 phase 再評估）
  - 關卡編輯器（列入 Phase 2 候選）
  - 任天堂原版素材（一律使用自製或開源授權素材，避免版權問題）

## 🏗️ 系統架構

### 整體架構
```
┌────────────────────────────────────────────────────┐
│                  Browser (桌面)                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Phaser 3 Game                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ Boot/   │→│ Title   │→│ Level Scene     │ │  │
│  │  │ Preload │ │ Scene   │ │ (gameplay 核心) │ │  │
│  │  └─────────┘ └─────────┘ └───────┬─────────┘ │  │
│  │                          ┌───────┴─────────┐ │  │
│  │                          │ HUD Scene(疊加) │ │  │
│  │                          └─────────────────┘ │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ 共用系統層                              │  │  │
│  │  │ Entities / Physics 規則 / Level Loader │  │  │
│  │  │ Audio / Input / GameState / Save       │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│  Assets: Tilemap(Tiled JSON) / Spritesheet / Audio │
└────────────────────────────────────────────────────┘
        靜態網站部署（GitHub Pages / 任一 static host）
```

### 核心模組

| 模組 | 功能 | 技術 | 狀態 |
|------|------|------|------|
| scenes | Boot/Preload/Title/Level/HUD/GameOver 場景流程 | Phaser Scene | ⚫ 未開始 |
| entities | Player、敵人、Power-up、可互動物件（磚塊/問號塊） | Phaser Sprite + 自訂類別 | ⚫ 未開始 |
| physics | 跳躍曲線、加速度、踩踏判定等遊戲手感參數與規則 | Phaser Arcade Physics | ⚫ 未開始 |
| levels | Tiled JSON 關卡載入、物件層解析、關卡資料定義 | Tiled + Phaser Tilemap | ⚫ 未開始 |
| state | 跨場景遊戲狀態（分數/生命/進度）、localStorage 存檔 | TypeScript | ⚫ 未開始 |
| audio | BGM / SFX 管理 | Phaser Audio (Web Audio) | ⚫ 未開始 |
| ui | HUD、選單、轉場畫面 | Phaser GameObjects | ⚫ 未開始 |

### 設計模式
- **Scene 為單位的狀態機**：遊戲流程由 Phaser Scene 切換驅動，HUD 以 overlay scene 疊加，與 gameplay 解耦
- **Entity 繼承 + 組合**：共用 `Entity` 基底（生命週期、物理掛載），行為差異以組合（如 `PatrolBehavior`）注入，避免深層繼承
- **Data-driven 關卡**：關卡內容全部來自 Tiled JSON，程式碼只負責解析與生成，新增關卡不改程式
- **集中式 GameState**：單一 state 模組管理跨場景資料，場景間不直接互相引用

### 通訊機制
- 場景內：Phaser EventEmitter（如 `player-died`、`coin-collected`）
- 跨場景：Phaser Registry / 自訂 GameState 模組
- 持久化：localStorage（關卡進度、最高分）

## 🔧 技術上下文

### 技術棧

| 類別 | 技術 | 版本 | 說明 |
|------|------|------|------|
| 語言 | TypeScript | 5.x（strict mode） | 全專案 |
| 遊戲框架 | Phaser | 3.x 最新穩定版 | rendering / physics / audio / input |
| 建置 | Vite | 最新穩定版 | dev server + bundle |
| 測試 | Vitest | 最新穩定版 | 邏輯層單元測試（state/levels/physics 參數） |
| 關卡工具 | Tiled Map Editor | 1.x | 關卡編輯，輸出 JSON |
| Lint/格式化 | ESLint + Prettier | 最新穩定版 | 程式碼品質 |

### 開發環境
- **作業系統**: macOS（開發）、目標為任一桌面瀏覽器
- **版本控制**: Git（依機能分次提交，每個功能單元完成並驗證後提交）
- **CI/CD**: GitHub Actions（build + 部署至 GitHub Pages）

### 主要相依性
```
phaser ^3.x
（dev）typescript, vite, vitest, eslint, prettier
```

### 開發工具
- **測試**: Vitest（純邏輯）；gameplay 以手動驗證為主
- **Lint**: ESLint（typescript-eslint）
- **格式化**: Prettier

## 📂 目錄結構（規劃）

```
super_mario/
├── src/
│   ├── main.ts             # Phaser Game 入口與設定
│   ├── scenes/             # Boot/Preload/Title/Level/HUD/GameOver
│   ├── entities/           # Player、敵人、power-up、互動物件
│   ├── systems/            # physics 參數、level loader、audio、input
│   ├── state/              # GameState、save/load
│   └── config/             # 常數（物理參數、關卡清單）
├── assets/
│   ├── tilemaps/           # Tiled JSON 關卡
│   ├── sprites/            # spritesheet（自製/開源授權）
│   └── audio/              # BGM / SFX
├── tests/                  # Vitest 單元測試
├── public/                 # 靜態資源
└── .project/               # ADF 配置（Memory/Design/Context）
```

## 🗺️ Phase Roadmap

| Phase | 目標 | 內容 | 狀態 |
|-------|------|------|------|
| **Phase 1** | 完整小遊戲（MVP+） | 專案骨架、玩家操控與物理手感、敵人、power-up、5 關卡、HUD/計分、音效、標題與結算畫面、localStorage 進度、GitHub Pages 部署 | ⚫ 未開始 |
| **Phase 2** | 內容與工具擴充 | 更多關卡與敵人種類、Boss 關、關卡編輯器評估、手把支援 | ⚫ 規劃中 |
| **Phase 3** | 平台與體驗強化 | 行動裝置觸控、PWA 離線遊玩、效能優化 | ⚫ 規劃中 |

> Phase 1 內部建議依「骨架與手感 → 敵人與互動 → 關卡與流程 → 音效與打磨」順序推進，細部拆解由 `adf.planner` + `adf.breakdown` 產出。

## 📊 品質指標

### 效能目標
- **幀率**: 桌面瀏覽器穩定 60 FPS
- **首次載入**: < 3 s（一般寬頻）
- **bundle 大小**: gzip 後 < 2 MB（不含音訊）

### 品質標準
- TypeScript strict mode，無 `any` 濫用
- 邏輯層（state/level 解析/物理參數計算）具備單元測試
- 每關卡可獨立載入測試

## 🔐 安全性考量

- 純前端靜態網站，無後端、無使用者資料收集
- localStorage 僅存遊戲進度，無敏感資料
- **素材授權**：不使用任天堂原版圖像/音訊，僅用自製或 CC0/開源授權素材

### 已知限制
- 僅支援桌面鍵盤操作（Phase 1）
- 無雲端存檔，清除瀏覽器資料即遺失進度

## ✅ 已定案決策（2026-06-11）

| 決策 | 內容 |
|------|------|
| 美術素材 | Kenney.nl 開源素材包（CC0），自製僅補缺口 |
| 部署 | GitHub Pages + GitHub Actions（push main 自動 build + deploy） |
| Phase 1 關卡數 | 5 關 |
| Git 策略 | 立即 git init，依機能分次提交（功能完成並驗證後提交） |

## ⚠️ 主要風險

| 風險 | 影響 | 緩解 |
|------|------|------|
| 平台跳躍「手感」調校耗時 | 遊戲體驗不佳 | 物理參數集中於 config，建立可快速迭代的測試關卡 |
| 5 關卡設計品質與時程 | 進度延遲或關卡單調 | 先完成 1 關垂直切片驗證機制，後續 4 關以既有機制組合設計 |
| Phaser Arcade Physics 精度限制（高速穿透） | 碰撞 bug | 限制最大速度、必要時改用 tile-based 自訂碰撞 |

---
*此文件為專案靜態資訊*
*由 `adf.design` 於 2026-06-11 生成*
*更新頻率：低（專案結構變更時）*

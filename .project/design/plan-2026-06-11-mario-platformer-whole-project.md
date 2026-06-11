# 架構設計方案 - Mario 平台遊戲 Whole-Project Implementation Plan

> **設計日期**: 2026-06-11
> **作者**: mk-chuang + Claude Code (claude-fable-5)
> **狀態**: approved（2026-06-11，validate-plan WARN 修正後經使用者確認進入 breakdown）
> **設計類型**: whole-project
> **任務規模**: L（全新專案、多模組、引入遊戲框架）
> **Baseline 來源**: `.project/memory/project.md`（adf.design 2026-06-11 產出）

## Planning Scope

本文件是 **whole-project implementation plan**，細化 `project.md` 的全專案 baseline：模組拆分、介面邊界、資料流、測試策略與跨 phase rollout。Phase 1（完整小遊戲）為 rollout 的第一段並做最細拆解；Phase 2/3 給出結構性規劃與依賴邊界，細部 plan 於進入該 phase 時再產出。

## 需求分析

### 硬約束（不可違反）

| # | 約束 | 來源 |
|---|------|------|
| H1 | 純前端靜態網站，無後端；所有功能在 static host 下可運作 | project.md / tech-stack.md |
| H2 | 不使用任天堂原版素材；僅 CC0/開源授權（Kenney.nl 為主） | 已定案決策 |
| H3 | TypeScript strict mode；命名遵循全域規範（camelCase / PascalCase / SCREAMING_SNAKE_CASE） | tech-stack.md |
| H4 | Phase 1 = 完整小遊戲：5 關、敵人、power-up、HUD、音效、標題/結算、localStorage 進度 | 已定案決策 |
| H5 | 物理/手感參數集中於 `src/config/`，不散落在 entity 中 | tech-stack.md |
| H6 | 部署：GitHub Actions → GitHub Pages，push main 自動 deploy | 已定案決策 |
| H7 | Git 依機能分次提交，commit 單一職責 | 已定案決策 / CLAUDE.md |

### 軟約束（可協商）

| # | 約束 | 目標 | 協商空間 |
|---|------|------|----------|
| S1 | 桌面瀏覽器穩定 60 FPS | 主流四瀏覽器 | 低階機器可降級特效 |
| S2 | bundle gzip < 2 MB（不含音訊） | 首載 < 3 s | 音訊可 lazy load |
| S3 | 邏輯層（state/save/level 解析/物理計算）單元測試覆蓋 | 核心純函數 100% | gameplay 視覺行為以手動驗證清單代替 |

## 架構方案

### 方案 A：Phaser 3.90 + Arcade Physics + Scene 狀態機（data-driven 關卡）

- **框架**：Phaser `3.90.0`（pin 版本；3.x 最後穩定版，2025-05 釋出，生態與文件最成熟）
- **物理**：內建 Arcade Physics（AABB、重力、velocity/acceleration），以 config 參數集中調校手感
- **場景**：Boot → Preload → Title → Level（gameplay）+ HUD（overlay）→ LevelComplete / GameOver
- **關卡**：Tiled JSON + Phaser Tilemap loader，物件層定義 spawn 點與觸發器，新增關卡零程式碼變更
- **手感補強**（Arcade Physics 之上的薄層）：可變跳躍高度（jump cutoff）、coyote time、jump buffer、最大下落速度 clamp

### 方案 B：Phaser 3 rendering + 自製 tile-based physics（fixed timestep + swept AABB）

- Phaser 只負責 rendering / audio / input / scene，物理層自製：fixed timestep、swept AABB 碰撞、tile 查詢
- 手感 100% 可控、無穿透問題，物理層可單元測試
- 代價：自製物理 + debug 工具約佔 Phase 1 30–40% 工作量，且與 Phaser body 整合需要 adapter 層

### 方案 C：升級 Phaser 4.1

- Phaser 4.0 於 2026-04-10 釋出（4.1.0 / 2026-04-30），渲染器重寫、效能更佳
- 僅 2 個月生態成熟度：第三方教學、已知問題修補、AI 輔助開發的參考資料皆不足，自主開發風險高

## 結構化評估

| 維度 | 權重 | 方案 A | 方案 B | 方案 C | 說明 |
|---|---:|---:|---:|---:|---|
| 開發速度（自主開發友善） | 35% | 9 | 5 | 6 | A 的文件/範例最豐富，AI 自主開發出錯率最低 |
| 手感可控性 | 25% | 7 | 9 | 7 | A 需薄層補強；B 完全可控 |
| 穩定性/成熟度 | 20% | 9 | 7 | 5 | C 剛釋出 2 個月 |
| 可測試性 | 10% | 6 | 9 | 6 | B 物理層純函數可測 |
| 長期維護 | 10% | 7 | 6 | 8 | C 是未來方向但不急 |
| **加權總分** | | **8.0** | **6.7** | **6.2** | |

## 推薦方案

**採用方案 A**（Phaser 3.90 + Arcade Physics + 手感補強薄層），理由：

1. Phase 1 目標是「完整可玩的小遊戲」，開發速度與穩定性權重最高
2. 經典 Mario 物理（等速跑動 + 拋物線跳躍）在 Arcade Physics 能力範圍內；穿透風險以「最大速度 clamp + 固定 physics fps」緩解
3. 手感補強（coyote time / jump buffer / jump cutoff）以獨立 `systems/movement.ts` 純函數實作，可單元測試，也保留替換空間

**推薦會改變的條件**：
- 若 S1 垂直切片驗收時跳躍手感無法通過調校（穿透、貼牆抖動無法解決）→ 切換方案 B，僅替換 physics 層（entity 介面已隔離）
- 若 Phase 3 啟動時 Phaser 4 生態成熟（>12 個月、主要外掛跟上）→ 評估升級（列入 Phase 3 候選）

詳見 `ADR-001`。

## 系統細部設計

### 場景狀態機

```
BootScene ──▶ PreloadScene ──▶ TitleScene ──▶ LevelScene ◀──┐
 (config)     (assets+進度條)    (開始/繼續)       │   ▲       │
                                          ┌──────┴───┴────┐  │
                                          │ HudScene(疊加) │  │
                                          └───────────────┘  │
                              LevelCompleteScene ────────────┘ (下一關)
                              GameOverScene ──▶ TitleScene
```

### 模組與介面邊界

| 模組 | 路徑 | 職責 | 依賴 | 禁止依賴 |
|------|------|------|------|----------|
| config | `src/config/` | 物理參數、遊戲常數、關卡清單 | 無 | 一切（純常數） |
| state | `src/state/` | GameState（跨場景資料）、SaveManager（localStorage） | config | Phaser、scenes |
| systems | `src/systems/` | movement（手感純函數）、level-loader、audio、input | config | scenes |
| entities | `src/entities/` | Player、敵人、power-up、互動磚塊 | config、systems、Phaser | scenes、state（經 event 通訊） |
| scenes | `src/scenes/` | 場景流程編排，組裝 entities/systems/state | 全部 | — |
| ui | `src/ui/` | HUD 元件、選單按鈕 | config、Phaser | entities |

### 核心介面定義（contract，供 breakdown/develop 消費）

```typescript
// src/state/types.ts
type PowerState = 'small' | 'super' | 'fire';

interface GameStateData {
  score: number;
  coins: number;
  lives: number;
  levelIndex: number;        // 0-based，對應 LEVEL_LIST
  powerState: PowerState;
}

interface SaveData {            // localStorage key: 'super-mario.save.v1'
  unlockedLevelIndex: number;
  highScore: number;
}

// src/config/levels.ts
interface LevelDefinition {
  key: string;                 // 'level-1' ... 'level-5'
  tilemapPath: string;         // 'assets/tilemaps/level-1.json'
  theme: 'overworld' | 'underground' | 'castle';
  musicKey: string;
  timeLimitSec: number;
}

// src/systems/movement.ts — 純函數，可單元測試
interface MovementInput { left: boolean; right: boolean; jumpPressed: boolean; jumpHeld: boolean; }
interface MovementBodyState { vx: number; vy: number; onGround: boolean; }
function stepHorizontal(body: MovementBodyState, input: MovementInput, dtMs: number): number;
function shouldJump(coyoteMsLeft: number, jumpBufferMsLeft: number): boolean;
function applyJumpCutoff(vy: number, jumpHeld: boolean): number;

// src/config/game.ts — 幾何常數
TILE_SIZE = 16;                  // pixels；256×240 邏輯解析度 = 16×15 tiles 可視範圍
                                 // Tiled 關卡、level-loader tile 查詢、碰撞皆以此為準

// src/config/physics.ts — 集中手感參數（初始值，調校時只動此檔）
// 單位：速度 pixels/s、加速度 pixels/s²（Arcade Physics 預設）、時間 ms
GRAVITY_Y = 1200;                // pixels/s²
RUN_SPEED_MAX = 200;             // pixels/s
RUN_ACCEL = 800;  RUN_DECEL = 1000;   // pixels/s²
JUMP_VELOCITY = -460;            // pixels/s
JUMP_CUTOFF_FACTOR = 0.45;       // 放開跳躍鍵時 vy 乘數（無因次）
COYOTE_TIME_MS = 80;  JUMP_BUFFER_MS = 100;   // ms
MAX_FALL_SPEED = 600;            // pixels/s；< TILE_SIZE × 60fps = 960，保證單幀位移不跨 tile
```

### 事件通訊（場景內 EventEmitter）

| 事件 | payload | 發出者 | 消費者 |
|------|---------|--------|--------|
| `coin-collected` | `{ value }` | entities | LevelScene→state、HudScene、audio |
| `enemy-stomped` | `{ score }` | Player | state、audio |
| `player-damaged` | — | 敵人/危險物 | Player（降級/死亡）、HudScene |
| `player-died` | — | Player | LevelScene（重生或 GameOver） |
| `power-up-collected` | `{ type }` | entities | Player、state、audio |
| `level-completed` | `{ timeLeft }` | 旗桿 trigger | LevelScene（結算、存檔） |

### Tiled 關卡資料約定

- Tile size：**16×16 px**（= `TILE_SIZE`），地圖高度固定 15 tiles（240 px），寬度依關卡長度
- Tile layers：`background`（裝飾）、`ground`（custom property `collides: true`）
- Object layers：`entities`（spawn 點，`type` ∈ goomba/koopa/coin/question-block/brick/mushroom-spawner…）、`triggers`（`type` ∈ flag/pit/checkpoint）
- 關卡解析器 `systems/level-loader.ts` 為純函數（Tiled JSON → 結構化 spawn 清單），可單元測試

### 資料流

```
鍵盤輸入 → input system → Player(movement 純函數) → Arcade Physics step
                                                        │
Tiled JSON → level-loader → entities 生成 → 碰撞/重疊判定 ┘
                                                        │
                                  EventEmitter 事件 ◀────┘
                                        │
            ┌───────────┬──────────────┼──────────┐
        GameState     HudScene       audio     LevelScene(流程)
            │
       SaveManager ⇄ localStorage
```

## 變更差異（Delta）

> 全新專案（greenfield），無既有程式碼模組；現有 ADF 配置不動。

### ADDED（新增）

| 檔案/模組 | 說明 | 風險 |
|-----------|------|------|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc` | 專案骨架與工具鏈（phaser@3.90.0 exact pin；vite 8.x / vitest 4.x，2026-06-11 npm 查證為 8.0.16 / 4.1.8，安裝後 lockfile pin） | 🟢 |
| `index.html`, `src/main.ts` | Phaser Game 入口（解析度 256×240 邏輯、整數倍縮放） | 🟢 |
| `src/config/{physics,game,levels}.ts` | 手感參數、常數、5 關清單 | 🟢 |
| `src/state/{game-state,save-manager,types}.ts` | 跨場景狀態 + localStorage 存檔 | 🟢 |
| `src/systems/movement.ts` | 手感純函數（coyote/buffer/cutoff） | 🟡 手感調校迭代多 |
| `src/systems/level-loader.ts` | Tiled JSON 解析 | 🟡 與 Tiled 輸出格式耦合 |
| `src/systems/{audio,input}.ts` | 音效管理、鍵位映射 | 🟢 |
| `src/scenes/{boot,preload,title,level,hud,level-complete,game-over}.ts` | 場景流程 | 🟡 Level scene 是組裝核心 |
| `src/entities/{entity,player,goomba,koopa,coin,question-block,brick,power-up,fireball}.ts` | 遊戲實體 | 🟡 碰撞互動組合多 |
| `src/ui/` | HUD 文字/圖示元件 | 🟢 |
| `assets/{sprites,tilemaps,audio}/`, `CREDITS.md` | Kenney 素材 + 授權聲明 | 🟡 素材缺口需自補 |
| `tests/{movement,level-loader,game-state,save-manager}.test.ts` | Vitest 單元測試 | 🟢 |
| `.github/workflows/deploy.yml` | CI：typecheck+lint+test+build → Pages deploy | 🟢 |

### MODIFIED（修改）

| 檔案/模組 | 變更內容 | 影響範圍 | 風險 |
|-----------|---------|---------|------|
| `.project/context/modules.md` | 隨各 stage 完成同步模組索引 | 文件 | 🟢 |
| `.project/memory/workspace.md` | 進度與決策回寫 | 文件 | 🟢 |

### REMOVED（移除）

無。

### UNCHANGED（與變更有依賴但確認不動）

- `.adf/`、`.claude/`、`.codex/`、`.opencode/`、`.agents/`、`.gemini` 相關 ADF 配置 — 開發流程工具，與遊戲程式碼無耦合
- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` — 除非工作約定變更

## 實施計劃

### Phase 1：完整小遊戲（本 plan 細拆，預計 8 個 stage）

| 階段 | 變更內容 | 風險等級 | 驗收方式 | 回滾方案 |
|---|---|---|---|---|
| S0 骨架 | 工具鏈 + 入口 + Boot/Preload + 空場景顯示測試 tilemap | 🟢 | `npm run dev` 顯示畫面；`typecheck/lint/test/build` 全綠 | git revert（每 stage 獨立 commit） |
| S1 玩家手感（垂直切片） | Player + movement 純函數 + 測試關卡 L0；跑/跳/coyote/buffer/cutoff | 🟡 | movement 單元測試通過；手動清單（量化）：① 離地 ≤ `COYOTE_TIME_MS`(80ms) 內按跳仍可起跳、超過則不可；② 落地前 ≤ `JUMP_BUFFER_MS`(100ms) 按跳，落地即起跳；③ 短按跳躍高度 ≤ 長按的 60%；④ 以 `MAX_FALL_SPEED`(600px/s) 連續下落 10 次不穿透 16px 地面；⑤ 貼牆水平推進無抖動 | 同上 |
| S2 地形互動 | 金幣、問號磚（頂出金幣/道具）、可破壞磚塊 | 🟡 | 手動清單 + level-loader 測試 | 同上 |
| S3 敵人 | Goomba 巡邏、Koopa + 龜殼、踩踏/受傷判定 | 🟡 | 踩踏得分、側面碰撞受傷、龜殼連鎖 | 同上 |
| S4 Power-up | 蘑菇/火花/星星、small↔super↔fire 狀態機、火球 | 🟡 | 升降級流程、無敵計時、火球殺敵 | 同上 |
| S5 遊戲流程 | Title/HUD/GameOver/LevelComplete、GameState、SaveManager、倒數計時、旗桿 | 🟡 | state/save 單元測試；完整一輪遊戲流程可走通 | 同上 |
| S6 關卡與音效 | 5 個正式關卡（overworld×2、underground×1、castle×2 建議）、BGM/SFX、轉場打磨 | 🟡 | 每關可獨立通關；音效對應事件表 | 同上 |
| S7 部署 | GitHub Actions workflow + Pages 上線 | 🟢 | CI 全綠；公開 URL 可玩 | revert workflow / Pages 回前一版 |

**Stage 依賴**：S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7。

**S5 並行邊界**（供 breakdown 拆依賴用）：
- 可在 S3 前先做並單元測試：`GameStateData` 的 score/coins/lives/levelIndex 結構、SaveManager 讀寫與 fallback、`save.v1` 格式
- 必須等 S4 完成才能驗證：`powerState` 狀態機遷移（small↔super↔fire、受傷降級、星星無敵）——依賴 Player 與 power-up entity 的實際行為
- HUD/Title/GameOver 場景流程依賴 S1 的 LevelScene 骨架即可開始，不依賴 S3/S4

## 實施任務（Task Backlog — Phase 1）

> ⚡ 此章節由 `adf.breakdown`（2026-06-11）生成
> 📊 總計：24 個 Task | P0: 22 個 | P1: 2 個 | P2: 0 個
> 狀態圖例：pending ⚪ / in_progress 🔵 / done ✅ / blocked 🔴

### 📊 Task 依賴關係

```
                    TASK-001 (工具鏈)
                   ╱    │    ╲        ╲
            TASK-002  TASK-003  TASK-004  TASK-023 (CI)
            (入口/Boot) (素材)   (config)
                   ╲    │    ╱   │   ╲
                    TASK-006   TASK-005  TASK-015 (GameState/Save)
                  (L0+loader) (movement)      │
                          ╲    ╱              │
                         TASK-007 (Player+LevelScene) ★垂直切片
                        ╱     │     ╲      ╲
                TASK-008  TASK-009  TASK-010  TASK-016 (HUD, 另依賴015)
                (磚塊)    (金幣)    (Goomba)
                                      │
                                  TASK-011 (Koopa)
                                      │
                                  TASK-012 (powerState+蘑菇)
                                    ╱   ╲
                            TASK-013    TASK-014
                            (火球)      (星星)
                                ╲        ╱
                              TASK-017 (流程串接, 依賴012,015,016)
                              ╱        │        ╲
                      TASK-018      TASK-021 (音效)
                      (L1,L2)
                      ╱      ╲
              TASK-019      TASK-020
              (L3 地下)     (L4,L5 城堡)
                      ╲      │      ╱
                       TASK-022 (打磨, P1)
                            │
                       TASK-024 (Pages 上線)
```

**關鍵路徑**：001 → 004 → 005/006 → 007 → 010 → 012 → 017 → 018 → 024
**可並行區段**：002∥003∥004（S0 內）；005∥006；008∥009∥010（S2/S3 起點）；013∥014；015 可在 004 後隨時做；018 後 019∥020∥021

---

### TASK-001: 專案工具鏈骨架

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S0 / P0 / M |
| 依賴 / 狀態 | 無 / ⚪ |

**檔案範圍**：`package.json`、`package-lock.json`、`tsconfig.json`、`vite.config.ts`、`eslint.config.js`、`.prettierrc`、`index.html`（新增）

**描述**：建立 Vite + TypeScript(5.x, strict) + Vitest + ESLint + Prettier 工具鏈；安裝 `phaser@3.90.0`（exact pin）；npm scripts：`dev` / `build` / `preview` / `typecheck` / `lint` / `test`。

**驗收標準**：
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` 全部通過（test 允許 0 案例）
- [ ] `package.json` 中 phaser 為 `"3.90.0"`（無 `^`）；tsconfig `strict: true`

### TASK-002: Phaser 入口與 Boot/Preload 場景

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S0 / P0 / M |
| 依賴 / 狀態 | TASK-001 / ⚪ |

**檔案範圍**：`src/main.ts`、`src/scenes/boot.ts`、`src/scenes/preload.ts`（新增）

**描述**：Phaser.Game 設定：256×240 邏輯解析度、`pixelArt: true`、Scale FIT + 整數倍縮放、Arcade Physics（gravity 由 config 注入）；Boot → Preload（含載入進度條）→ 暫時直接進入空 LevelScene 顯示底色與版本字樣。

**驗收標準**：
- [ ] `npm run dev` 開啟後畫面以整數倍縮放置中顯示，無模糊
- [ ] Preload 進度條可見；console 無錯誤

### TASK-003: Kenney 素材引入與授權聲明

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S0 / P0 / M |
| 依賴 / 狀態 | TASK-001 / ⚪ |

**檔案範圍**：`assets/sprites/`、`assets/tilemaps/tilesets/`、`assets/audio/`、`CREDITS.md`（新增）

**描述**：選定 Kenney 素材包（候選：Pixel Platformer / Platformer Pack Redux，以 16×16 tile 相容者優先），整理出：玩家 spritesheet（小/大/火力形態可用色版區分）、敵人×2、tileset（三種 theme 可用）、金幣/磚塊/問號磚、基礎 SFX。`CREDITS.md` 記錄來源與 CC0 授權。

**驗收標準**：
- [ ] tileset 為 16×16；Preload 能載入全部素材無 404
- [ ] `CREDITS.md` 列出每個素材包名稱、作者、授權、來源 URL

### TASK-004: config 模組（物理參數 / 幾何常數 / 關卡清單）

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S1 / P0 / S |
| 依賴 / 狀態 | TASK-001 / ⚪ |

**檔案範圍**：`src/config/physics.ts`、`src/config/game.ts`、`src/config/levels.ts`、`src/state/types.ts`（新增）

**描述**：依 plan「核心介面定義」落地：物理常數（含單位註解）、`TILE_SIZE = 16`、`LevelDefinition` 與 `LEVEL_LIST`（5 關，先指向佔位 tilemap path）、`GameStateData` / `SaveData` / `PowerState` 型別。

**驗收標準**：
- [ ] 常數值與 plan 一致；每個常數帶單位註解
- [ ] typecheck 通過；config 不 import 任何其他模組（零依賴驗證）

### TASK-005: movement 手感純函數 + 單元測試

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S1 / P0 / M |
| 依賴 / 狀態 | TASK-004 / ⚪ |

**檔案範圍**：`src/systems/movement.ts`、`tests/movement.test.ts`（新增）

**描述**：實作 `stepHorizontal`（加速/減速/方向反轉）、`shouldJump`（coyote + buffer）、`applyJumpCutoff`；全部為純函數，不 import Phaser。

**驗收標準**：
- [ ] 測試覆蓋：加速到 `RUN_SPEED_MAX` 封頂、減速到 0 不抖動、coyote 80ms 邊界（79ms 可跳/81ms 不可）、buffer 100ms 邊界、cutoff 後 vy = vy×0.45
- [ ] `npm run test` 通過

### TASK-006: 測試關卡 L0 + level-loader

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S1 / P0 / M |
| 依賴 / 狀態 | TASK-002, TASK-003, TASK-004 / ⚪ |

**檔案範圍**：`assets/tilemaps/level-0.json`、`src/systems/level-loader.ts`、`tests/level-loader.test.ts`（新增）

**描述**：以 Tiled 製作 L0（手感測試場：平台階梯、單格落差、長直道、深坑），遵守 plan 的 Tiled 約定（16×16、15 tiles 高、`background`/`ground` layer、`entities`/`triggers` object layer）；level-loader 將 Tiled JSON 解析為結構化 spawn 清單（純函數）。

**驗收標準**：
- [ ] loader 單元測試：collides tile 過濾、entities/type 解析、未知 type 警告不 crash
- [ ] L0 在遊戲中正確渲染、`ground` layer 有碰撞體

### TASK-007: Player + input + LevelScene 垂直切片 ★

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S1 / P0 / L |
| 依賴 / 狀態 | TASK-005, TASK-006 / ⚪ |

**檔案範圍**：`src/entities/entity.ts`、`src/entities/player.ts`、`src/systems/input.ts`、`src/scenes/level.ts`（新增）

**描述**：Entity 基底（sprite/body 生命週期）；Player 串接 input → movement 純函數 → Arcade body；攝影機跟隨（左右死區）；掉深坑觸發 `player-died`（暫以重生處理）。input 抽象鍵位映射（預設方向鍵+Z 跳/X 衝刺，集中於 input.ts 可改）。

**驗收標準**：
- [ ] S1 量化手動驗收清單 5 項全過（plan 實施計劃 S1 列）
- [ ] 物理參數調整只需動 `config/physics.ts` 即可生效

### TASK-008: 互動磚塊（問號磚 / 可破壞磚）

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S2 / P0 / M |
| 依賴 / 狀態 | TASK-007 / ⚪ |

**檔案範圍**：`src/entities/question-block.ts`、`src/entities/brick.ts`（新增）；`src/systems/level-loader.ts`、`src/scenes/level.ts`（修改）

**描述**：頂撞判定（從下方撞擊）；問號磚彈跳動畫 + 吐出內容物（金幣/道具，內容由 Tiled property 定義）後變空磚；磚塊：small 形態頂撞彈起、super 以上擊碎。

**驗收標準**：
- [ ] 從下方頂問號磚吐出內容並變空磚；側面/上方碰撞不觸發
- [ ] super 形態擊碎磚塊有碎片效果；small 形態只彈動

### TASK-009: 金幣與收集事件

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S2 / P0 / S |
| 依賴 / 狀態 | TASK-007 / ⚪ |

**檔案範圍**：`src/entities/coin.ts`（新增）；`src/scenes/level.ts`（修改）

**描述**：場景金幣（Tiled entities 層生成）overlap 收集，發 `coin-collected` 事件；100 金幣加一命的規則放 GameState（TASK-015 接上後生效）。

**驗收標準**：
- [ ] 碰觸金幣消失並發事件（console/暫時計數可見）；同一金幣不重複觸發

### TASK-010: Goomba 與踩踏/受傷判定

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S3 / P0 / L |
| 依賴 / 狀態 | TASK-007 / ⚪ |

**檔案範圍**：`src/entities/goomba.ts`、`src/entities/enemy.ts`（敵人基底，新增）；`src/scenes/level.ts`（修改）

**描述**：敵人基底（巡邏行為：直線走、碰牆/平台邊緣轉向，邊緣偵測由 Tiled property 控制）；Goomba 被踩（玩家 body 底部接觸 + 下落中）→ 壓扁消失 + 玩家小彈跳 + `enemy-stomped`；側面接觸 → `player-damaged`。

**驗收標準**：
- [ ] 踩踏判定：從上方下落觸發；水平接觸觸發受傷（含 1s 無敵閃爍）
- [ ] Goomba 不會走出平台（邊緣轉向開啟時）、碰牆轉向

### TASK-011: Koopa 與龜殼狀態機

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S3 / P0 / M |
| 依賴 / 狀態 | TASK-010 / ⚪ |

**檔案範圍**：`src/entities/koopa.ts`（新增）；`src/scenes/level.ts`（修改）

**描述**：Koopa 狀態機：walk → 被踩縮殼（靜止）→ 再踩/側碰踢出滑行殼 → 滑行殼撞敵連鎖消滅、撞玩家造成傷害；殼滑行一段時間後復原為 walk。

**驗收標準**：
- [ ] 狀態遷移完整可重現；滑行殼可連鎖殺敵且對玩家有傷害
- [ ] 縮殼靜止期間玩家可安全推殼

### TASK-012: powerState 狀態機與蘑菇

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S4 / P0 / L |
| 依賴 / 狀態 | TASK-008, TASK-010 / ⚪ |

**檔案範圍**：`src/entities/power-up.ts`、`src/entities/player.ts`（修改：small↔super 形態、受傷降級、體型/hitbox 切換）；`src/scenes/level.ts`（修改）

**描述**：蘑菇從問號磚吐出後落地移動；收集 → `power-up-collected` → small→super（體型變化動畫、hitbox 從 1 tile 變 2 tiles 高）；受傷：fire→super→small→死亡，降級附短暫無敵。

**驗收標準**：
- [ ] small/super 形態 hitbox 正確（super 進不了 1-tile 縫隙）
- [ ] 受傷降級鏈與無敵時間正確；small 受傷 → `player-died`

### TASK-013: 火花與火球

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S4 / P0 / M |
| 依賴 / 狀態 | TASK-012 / ⚪ |

**檔案範圍**：`src/entities/fireball.ts`（新增）；`src/entities/power-up.ts`、`src/entities/player.ts`（修改）

**描述**：火花道具（super 時收集 → fire 形態）；fire 形態按攻擊鍵發射彈跳火球（地面反彈、撞牆/敵人消失、同時最多 2 顆）；火球殺敵得分。

**驗收標準**：
- [ ] 火球反彈軌跡穩定、上限 2 顆、命中敵人雙方消失並得分
- [ ] small 時收集火花等效蘑菇（small→super）

### TASK-014: 無敵星

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S4 / P0 / S |
| 依賴 / 狀態 | TASK-012 / ⚪ |

**檔案範圍**：`src/entities/power-up.ts`、`src/entities/player.ts`（修改）

**描述**：星星彈跳移動；收集後 10s 無敵（閃爍效果）：接觸敵人即消滅對方、不受傷；計時結束恢復。

**驗收標準**：
- [ ] 無敵期間接觸消滅敵人且得分；倒數結束後恢復正常受傷判定

### TASK-015: GameState 與 SaveManager

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S5 / P0 / M |
| 依賴 / 狀態 | TASK-004（可早做，powerState 整合驗證需待 TASK-012）/ ⚪ |

**檔案範圍**：`src/state/game-state.ts`、`src/state/save-manager.ts`、`tests/game-state.test.ts`、`tests/save-manager.test.ts`（新增）

**描述**：GameState：score/coins/lives/levelIndex/powerState 的讀寫與規則（100 金幣 +1 命、分數累計）；SaveManager：`super-mario.save.v1` 讀寫、損壞資料 fallback 預設值。不 import Phaser。

**驗收標準**：
- [ ] 單元測試：金幣進位加命、存檔 round-trip、損壞 JSON / 缺欄位 fallback
- [ ] powerState 欄位僅存取介面，狀態機邏輯留在 Player（TASK-012）

### TASK-016: HUD Scene

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S5 / P0 / M |
| 依賴 / 狀態 | TASK-007, TASK-015 / ⚪ |

**檔案範圍**：`src/scenes/hud.ts`、`src/ui/`（新增）；`src/scenes/level.ts`（修改：啟動 HUD overlay）

**描述**：HUD overlay scene：分數、金幣數、生命、關卡名、倒數計時；訂閱遊戲事件即時更新；倒數歸零發 `player-died`。

**驗收標準**：
- [ ] 吃金幣/踩敵時 HUD 即時更新；計時歸零玩家死亡
- [ ] HUD 不隨攝影機捲動

### TASK-017: 遊戲流程串接（Title / 旗桿 / 結算 / GameOver）

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S5 / P0 / L |
| 依賴 / 狀態 | TASK-012, TASK-015, TASK-016 / ⚪ |

**檔案範圍**：`src/scenes/title.ts`、`src/scenes/level-complete.ts`、`src/scenes/game-over.ts`（新增）；`src/scenes/level.ts`、`src/systems/level-loader.ts`（修改：flag trigger）

**描述**：Title（開始/繼續，繼續讀存檔）；旗桿 trigger → `level-completed` → 結算（剩餘時間換分）→ 下一關或全破畫面；死亡 → 生命-1 重開本關或 GameOver → Title；過關時寫存檔（解鎖進度、高分）。

**驗收標準**：
- [ ] 完整一輪：Title → L0 過關 → 結算 → 下一關 → 死完 → GameOver → Title → 繼續可從解鎖進度開始
- [ ] 重新整理頁面後進度仍在（localStorage）

### TASK-018: 正式關卡 level-1 / level-2（overworld）

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S6 / P0 / L |
| 依賴 / 狀態 | TASK-008, TASK-009, TASK-011, TASK-013, TASK-014, TASK-017 / ⚪ |

**檔案範圍**：`assets/tilemaps/level-1.json`、`level-2.json`（新增）；`src/config/levels.ts`（修改：指向正式檔）

**描述**：L1 教學曲線（介紹跳躍/金幣/Goomba/問號磚/蘑菇）；L2 引入 Koopa/火花/更多垂直結構。每關長度約 200–250 tiles，難度遞進，結尾旗桿。

**驗收標準**：
- [ ] 兩關皆可從頭通關；無不可達區域、無卡死點；時限內可完成且留有餘裕
- [ ] L1 不需要進階技巧即可通關

### TASK-019: 關卡 level-3（underground）

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S6 / P0 / M |
| 依賴 / 狀態 | TASK-018 / ⚪ |

**檔案範圍**：`assets/tilemaps/level-3.json`（新增）；`src/config/levels.ts`（修改）

**描述**：地下 theme（深色 tileset、密集磚塊結構、星星藏點）；驗證 theme 切換（tileset/BGM key 由 LevelDefinition 驅動）。

**驗收標準**：
- [ ] theme 切換純資料驅動（不改場景程式碼）；可通關

### TASK-020: 關卡 level-4 / level-5（castle）

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S6 / P0 / L |
| 依賴 / 狀態 | TASK-018 / ⚪ |

**檔案範圍**：`assets/tilemaps/level-4.json`、`level-5.json`（新增）；`src/config/levels.ts`（修改）

**描述**：城堡 theme；L4 精準跳躍挑戰、L5 最終關（綜合全部機制 + 結尾全破畫面觸發）。

**驗收標準**：
- [ ] 兩關可通關；L5 過關進入全破畫面而非下一關

### TASK-021: 音效與 BGM

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S6 / P0 / M |
| 依賴 / 狀態 | TASK-017 / ⚪ |

**檔案範圍**：`src/systems/audio.ts`（新增）；各 scene（修改：接事件）；`assets/audio/`（補素材）

**描述**：audio system 訂閱事件表（plan 事件通訊節）播 SFX；LevelDefinition.musicKey 驅動 BGM；無敵星倒數變奏、時間告急加速；瀏覽器 autoplay 限制處理（首次輸入後解鎖 AudioContext）。

**驗收標準**：
- [ ] 事件表中每個事件有對應 SFX；BGM 隨關卡 theme 切換
- [ ] 首次互動前無 autoplay 報錯

### TASK-022: 整體打磨

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S6 / P1 / M |
| 依賴 / 狀態 | TASK-019, TASK-020, TASK-021 / ⚪ |

**檔案範圍**：跨 scenes/entities 微調（修改）

**描述**：場景轉場（淡入淡出）、死亡/過關動畫、攝影機微調、粒子效果（碎磚、踩敵）、全程 playtest 修小問題。

**驗收標準**：
- [ ] 全程 5 關連續遊玩無 console error、無視覺破綻
- [ ] 60 FPS（DevTools performance 抽查最重關卡）

### TASK-023: CI workflow

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S7 / P0 / S |
| 依賴 / 狀態 | TASK-001（建議 S0 後即建立）/ ⚪ |

**檔案範圍**：`.github/workflows/ci.yml`（新增）

**描述**：push/PR 觸發：`npm ci` → typecheck → lint → test → build；Node LTS。早建立讓每個 stage commit 都有 CI 保護。

**驗收標準**：
- [ ] push 後 GitHub Actions 全綠；任一步驟失敗會擋下

### TASK-024: GitHub Pages 部署上線

| 欄位 | 值 |
|------|-----|
| Stage / 優先級 / 複雜度 | S7 / P0 / S |
| 依賴 / 狀態 | TASK-022, TASK-023 / ⚪ |

**檔案範圍**：`.github/workflows/deploy.yml`、`vite.config.ts`（修改：`base` 路徑）（新增/修改）

**描述**：main 分支 CI 通過後自動 build + deploy 到 GitHub Pages；Vite `base` 設為 `/super_mario/`。

**驗收標準**：
- [ ] 公開 URL 載入遊戲，標題畫面 → 第一關 smoke test 通過
- [ ] push main 後自動重新部署

---

### Phase 2：內容與工具擴充（結構性規劃，進入時另出 plan）

- 依賴 Phase 1 的 data-driven 關卡架構與 entity 組合模式
- 候選：新敵人種類（採 behavior 組合擴充，不改 Entity 基底）、Boss 關（新增 boss scene 或 entity 狀態機）、關卡編輯器評估（Tiled 已可編輯，自製編輯器需求待驗證）、手把支援（input system 已抽象鍵位映射，擴充點在 `systems/input.ts`）

### Phase 3：平台與體驗強化（結構性規劃）

- 觸控操作（虛擬按鍵 overlay scene，複用 input 抽象）、PWA（service worker + manifest，純靜態架構相容）、效能優化（先量測再動手）、Phaser 4 升級評估（條件見推薦方案）

## 測試策略

| 層級 | 範圍 | 工具 | 時機 |
|------|------|------|------|
| 單元測試 | movement 純函數、level-loader、GameState、SaveManager | Vitest | 每 stage、CI |
| 型別/靜態 | 全專案 | `tsc --noEmit` + ESLint | 每 commit、CI |
| 建置驗證 | production bundle | `vite build` | CI |
| 手動 playtest | 每 stage 驗收清單（plan 內定義）；S6 起每關完整通關 | 瀏覽器 | stage 完成時 |
| 部署驗證 | Pages URL 實際載入遊玩 | 瀏覽器 | S7 |

手動驗收清單由各 stage 的 TASK（breakdown 產出）內具體化；自主開發時以 dev server + 截圖/錄製驗證。

## Rollout / Rollback

- **Rollout**：依 stage 順序推進；每個功能單元完成並驗證後 commit（單一職責）；S7 完成後 push main 即自動部署，之後每次 push main 都是一次 rollout
- **觀測**：CI 狀態（typecheck/lint/test/build）+ Pages 部署狀態 + 手動 smoke test（標題畫面載入、第一關可進入）
- **Rollback**：
  - 程式碼：`git revert` 對應 stage/feature commit（commit 單一職責保證可獨立 revert）
  - 部署：revert 後 push main 重新觸發 deploy；或 GitHub Pages 介面回滾至前一次 deployment
  - 存檔格式：`save.v1` key 帶版本，未來格式變更時新 key + 遷移函數，不破壞舊存檔

## 決策與 Open Questions

### 已決策（含本輪）

| 決策 | 選擇 | 理由 | 記錄 |
|------|------|------|------|
| 遊戲框架版本 | Phaser **3.90.0**（pin），不用 4.1 | 4.0 僅釋出 2 個月，生態未熟；自主開發需要最大參考資料量 | ADR-001 |
| 物理引擎 | Arcade Physics + 手感補強薄層 | 速度/穩定優先；補強層純函數可測、可替換 | ADR-001 |
| 邏輯解析度 | 256×240、整數倍縮放、pixelArt mode | 經典 NES 比例，pixel art 不模糊 | plan 內 |
| 關卡主題配置 | overworld×2 + underground×1 + castle×2 | 覆蓋三種 theme、首尾呼應 | plan 內（S6 可微調） |
| 存檔格式 | localStorage `super-mario.save.v1`，帶版本 key | 預留遷移路徑 | plan 內 |

### Open Questions（不阻塞開發，develop 階段就地決定）

- [ ] Kenney 具體素材包選擇（候選：Pixel Platformer / Platformer Pack Redux）——S0 下載時依實際內容定
- [ ] 鍵位預設（候選：方向鍵+Z/X 或 WASD+J/K）——S1 實作時定，input 已抽象可後改

---
*由 adf.planner 於 2026-06-11 產出；批准後交 adf.breakdown 拆解 TASK*

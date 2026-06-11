# 模組規格索引

> 此檔案由 `/analyze` 初始建立，由 `/planner` 和 `/update-memory` 漸進更新
> 最後更新：2026-06-11
> **容量指引**：每模組摘要限 10 行，詳細規格限 30 行。超過 100 個模組時建議按領域分段索引。

## 模組總覽

> 來源：`plan-2026-06-11-mario-platformer-whole-project.md`「模組與介面邊界」；Phase 1 已全數實作（2026-06-11）。

| 模組 | 目錄 | 行為摘要 | 分析深度 | 最後更新 |
|------|------|---------|---------|---------|
| config | `src/config/` | 物理手感參數（physics.ts）、TILE_SIZE/分數常數（game.ts）、5 關清單（levels.ts）、sprite frame/tint 映射（sprites.ts）；零依賴 | 📋 摘要 | 2026-06-11 |
| state | `src/state/` | GameState（分數/金幣進位/命/關卡推進）+ SaveManager（`save.v1`、fallback）；不依賴 Phaser，13 單元測試 | 📋 摘要 | 2026-06-11 |
| systems | `src/systems/` | movement 手感純函數（coyote/buffer/cutoff，14 測試）、level-loader（物件層解析，8 測試）、audio（程序生成 BGM）、input（鍵位抽象） | 📋 摘要 | 2026-06-11 |
| entities | `src/entities/` | Entity/Enemy 基底、Player（形態機）、Goomba、Koopa（殼狀態機）、Coin、QuestionBlock、Brick、PowerUp、Fireball；scene events 對外通訊 | 📋 摘要 | 2026-06-11 |
| scenes | `src/scenes/` | Boot/Preload/Title/Level（組裝核心）/HUD overlay/LevelComplete/GameOver | 📋 摘要 | 2026-06-11 |
| 關卡工具 | `scripts/` | design-levels.mjs（segment builder）→ gen-level.mjs（ASCII→Tiled JSON）→ lint-levels.mjs（可玩性檢查） | 📋 摘要 | 2026-06-11 |

> 分析深度：🗺️ 規劃（planner 產出，尚無代碼）| 📋 摘要（/analyze 產出）| 📖 詳細（/planner 深入分析後）

---

## 資料流拓撲

> 描述系統主要資料流路徑，由 /analyze 第二層掃描產出。
> 嵌入式影音系統應重點描述：影像幀/音訊幀的產出 → 處理 → 分發 → 輸出路徑。

### 影像資料流
```
[來源] → [處理] → [佇列] → [輸出端點]
例：ISP → Encoder(H.264) → stm_queue → RTSP/NDI/SRT/HLS
```

### 音訊資料流
```
[來源] → [處理] → [佇列] → [輸出端點]
```

### 佇列拓撲
| 佇列名稱 | 生產者 | 消費者 | 深度 | 丟幀策略 |
|----------|--------|--------|------|---------|
| [名稱] | [模組] | [模組] | [N 幀] | [丟舊/丟新/阻塞] |

---

## 線程架構

> 描述系統的線程模型，由 /analyze 第二層掃描產出。
> 重點：獨立 thread 的職責、排程策略、同步機制、CPU 親和性。

| 線程名稱 | 入口函數 | 職責 | 排程策略 | CPU 親和性 | 同步機制 |
|----------|---------|------|---------|-----------|---------|
| [名稱] | [函數] | [一句話] | [SCHED_RR/FIFO/OTHER] | [CPU N] | [barrier/mutex/cond/queue] |

### 線程啟動順序
```
[啟動順序圖或 barrier 同步描述]
```

### 關鍵同步點
- [描述 thread 間的關鍵同步邏輯，如 barrier 統一啟動、mutex 保護的共享資源]

---

## 模組詳細規格

### [模組名] — [一句話描述]

**行為摘要**：[模組做什麼，2-3 句話]

**關鍵介面**：
- `function_name()` — [說明]

**依賴**：
- 上游：[提供資料給本模組的模組]
- 下游：[本模組提供資料的模組]
- 共享資源：[共享的 buffer、queue、IPC]

**約束**：
- [記憶體/即時性/併發/硬體依賴]

**最後分析**：2026-06-11 by [/analyze | /planner]

---
*此檔案為漸進式累積，不需要一次填完所有模組*
*被 /planner 觸及的模組會自動補充詳細規格*

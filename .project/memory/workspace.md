# 工作記憶 - Workspace Memory

> 此文件記錄動態工作狀態，頻繁更新
> 最後更新：2026-06-11（adf.design 初始化專案定義）
>
> **模式說明**：
> - **團隊模式**：使用 `workspace-team.md` + `workspace-<用戶>.md`
> - **單人模式**：使用此文件 `workspace.md`
> - 模式由 `.project/team.yaml` 存在與否決定

## 📊 系統狀態總覽

| 文件 | 狀態 | 大小 | 最後更新 |
|------|------|------|----------|
| project.md | ✅ 已初始化 | ~200 行 | 2026-06-11 |
| workspace.md | ✅ 已初始化 | - | 2026-06-11 |
| current.md | ✅ 指向 whole-project plan（draft） | - | 2026-06-11 |

### 維護提醒
- 當前文件大小：[行數]
- 上次歸檔：無
- 建議：超過 500 行時執行 `/archive-memory`

### 快速操作
```bash
# 常用指令
/load-memory      # 載入記憶總覽
/update-memory    # 更新此文件
/archive-memory   # 歸檔歷史記錄
/design           # 專案定義
/planner             # 架構設計
/develop          # 開發實施
```

---

## 🏗️ 當前架構方案

| 項目 | 內容 |
|------|------|
| **採用方案** | Phaser 3.90 + Arcade Physics + 手感補強薄層、Scene 狀態機、data-driven Tiled 關卡 |
| **設計文件** | `.project/design/plan-2026-06-11-mario-platformer-whole-project.md`（current.md 已指向，狀態 draft 待批准） |
| **選定原因** | 自主開發優先開發速度與框架成熟度；Phaser 4 僅釋出 2 個月不採用 |
| **關鍵決策** | ADR-001（Phaser 3.90 pin + Arcade Physics）；256×240 邏輯解析度；save.v1 帶版本存檔 |
| **最後更新** | 2026-06-11 |

---

## 🎯 當前工作重點

### 本週主要任務
- [x] 完成專案定義（adf.design，2026-06-11）：經典 2D 平台遊戲、TypeScript + Phaser 3、Phase 1 = 完整小遊戲
- [x] 未決問題全部定案（2026-06-11）：Kenney.nl 素材、GitHub Pages + Actions、5 關、git init 依機能分次提交
- [x] adf.planner 產出 whole-project implementation plan + ADR-001（2026-06-11）
- [x] validate-plan WARN-1~7 修正 + adf.breakdown 24 TASK（2026-06-11）
- [x] **Phase 1 自主開發完成（2026-06-11）**：TASK-001~024 全數實作並驗收
- [ ] 確認 GitHub Pages 部署上線（TASK-024 最後驗證）

### 開發中的關鍵決策與偏差記錄
| 決策/偏差 | 原因 |
|------|------|
| 素材改用 1-Bit Platformer Pack（非 Pixel Platformer） | Pixel Platformer 是 18×18，與 TILE_SIZE=16 衝突；plan 已預載「16×16 相容者優先」規則 |
| 關卡以 ASCII + 產生器（scripts/design-levels.mjs → gen-level.mjs）製作 | 自主開發無法操作 Tiled GUI；輸出仍為 Tiled 相容 JSON，未脫離 data-driven 架構 |
| BGM 程序生成 chiptune（Web Audio 自作曲） | CC0 loop 下載源不可靠；單色像素風適配；零授權風險 |
| 旗桿以「門」視覺替代 | 素材包無旗桿；trigger type 仍為 flag，機制不變 |
| jump cutoff bug 修正 | 原設計每幀重複套用；改一次性截斷（fix commit 3a0e9fd） |
| 關卡通關驗證以 lint + 門可達 e2e 取代人工通關 | 自主環境無人工 playtest；風險：真人手感體驗未驗證，留待使用者試玩回饋 |

### 當前技術挑戰
1. **挑戰 1**: [問題描述]
   - 狀態：[進行中/已解決]
   - 方向：[解決方向]

2. **挑戰 2**: [問題描述]
   - 狀態：[進行中/已解決]
   - 方向：[解決方向]

### 短期目標（本月）
- 目標 1：待補充
- 目標 2：待補充

### 待解決問題
- [ ] 問題 1：待補充
- [ ] 問題 2：待補充

---

## 📊 模組開發狀態

*最後更新：待更新*

| 模組 | 功能 | 開發狀態 | 驗證狀態 | 說明 |
|------|------|----------|----------|------|
| config | 物理參數/常數/關卡清單/sprite 映射 | 🟢 已完成 | 🟢 驗證通過 | 零依賴確認 |
| state | GameState + SaveManager | 🟢 已完成 | 🟢 13 單元測試 | save.v1 round-trip/fallback |
| systems | movement/level-loader/audio/input | 🟢 已完成 | 🟢 22 單元測試 + e2e | movement 純函數、BGM 程序生成 |
| entities | Player/Goomba/Koopa/power-up/磚塊/火球 | 🟢 已完成 | 🟢 Playwright 行為驗證 | 形態機/殼鏈/踩踏全過 |
| scenes | Boot/Preload/Title/Level/HUD/結算/GameOver | 🟢 已完成 | 🟢 全流程 e2e | 5 關連續通關 + 全破 |
| 關卡內容 | L0 + L1~L5（builder + lint） | 🟢 已完成 | 🟢 lint + in-game | 真人手感待玩家回饋 |
| CI/CD | Actions CI + Pages deploy | 🟢 已完成 | 🟡 Pages 上線確認中 | configure-pages 自動啟用 |

### 狀態圖例
- ⚫ **未開始**: 尚未開始開發/測試
- 🟡 **進行中**: 正在進行
- 🟢 **已完成**: 開發完成/測試通過
- 🔴 **受阻**: 遇到阻礙/測試失敗
- 🟣 **需重構**: 功能可用但需要改進

### 🚨 問題與阻塞
1. **[問題名稱]**
   - 阻塞：待補充
   - 負責人：待補充
   - 預計解決：待補充

---

## 📈 進度追蹤

### 專案里程碑
- [x] **M1**: 專案初始化
- [ ] **M2**: 核心功能開發
- [ ] **M3**: 測試和優化
- [ ] **M4**: 部署上線

### 最近完成

#### 本週
- ✅ [完成項目 1]：待補充
- ✅ [完成項目 2]：待補充

#### 上週
- ✅ [完成項目 1]：待補充

### 版本規劃
- **v0.1.0**: 基礎功能（目標：待補充）
- **v0.2.0**: 核心功能（目標：待補充）
- **v1.0.0**: 正式版本（目標：待補充）

---

## 📝 會話記錄

### 最近重要決策

| 日期 | 決策 | 原因 | ADR |
|------|------|------|-----|
| [日期] | [決策內容] | [原因] | [ADR-XXX] |

### 待確認事項
- [ ] [待確認 1]
- [ ] [待確認 2]

### 討論備註
[最近討論的重要內容...]

---

## 📝 Code Review 記錄

### 最近審查

| 日期 | 範圍 | 結果 | 說明 |
|------|------|------|------|
| [日期] | [審查範圍] | [通過/需修改] | [說明] |

### 審查統計
- 總審查次數：0
- 通過審查：0
- 需修復：0

---

## 📚 歷史歸檔索引

| 歸檔文件 | 時間範圍 | 說明 |
|----------|----------|------|
| [無歸檔記錄] | - | - |

---
*使用 `/update-memory` 更新此文件*
*使用 `/archive-memory` 歸檔歷史記錄*
*更新頻率：高（每次會話結束時）*

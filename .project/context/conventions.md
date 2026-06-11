# 編碼規範

> **用途**：定義專案的編碼風格和慣例，供 AI agent 生成符合規範的代碼
> **填寫時機**：`adf.design` / `adf.planner` 初始化（2026-06-11）
> **引用者**：developer、code-reviewer agent

---

## 命名規範

| 對象 | 風格 | 範例 |
|------|------|------|
| 檔案名 | kebab-case | `level-loader.ts`、`question-block.ts` |
| 函數/方法 | camelCase | `stepHorizontal()`、`applyJumpCutoff()` |
| 類別/介面/型別 | PascalCase | `GameState`、`LevelDefinition` |
| 常數 | SCREAMING_SNAKE_CASE | `TILE_SIZE`、`JUMP_VELOCITY` |
| 變數 | camelCase | `coyoteMsLeft` |
| Phaser asset key / 事件名 | kebab-case 字串 | `'level-1'`、`'coin-collected'` |

> 與 tech-stack.md「技術限制」一致；衝突時以 tech-stack.md 為準。

## 目錄結構

```
src/
├── config/     # 常數與參數（物理、遊戲、關卡清單），不依賴任何模組
├── state/      # GameState、SaveManager（不依賴 Phaser、scenes）
├── systems/    # movement 純函數、level-loader、audio、input
├── entities/   # Player、敵人、power-up、互動磚塊
├── scenes/     # 場景流程編排（唯一可以組裝所有模組的層）
└── ui/         # HUD 元件
tests/          # Vitest 單元測試（*.test.ts）
assets/         # tilemaps / sprites / audio（CC0 素材，授權記於 CREDITS.md）
```

依賴方向詳見 current plan「模組與介面邊界」表；禁止反向依賴（如 state → Phaser）。

## 代碼風格

- **縮排**：2 空格
- **行寬上限**：100 字元
- **括號風格**：K&R（同行開括號）
- **引號**：單引號；以 Prettier 為準，不手動爭論格式
- **TypeScript**：strict mode；禁止 `any`（不得已時用 `unknown` + narrowing）

## 註解規範

- **函數註解**：exported API 用 JSDoc；模組內部函數命名自明即可
- **行內註解**：只寫程式碼無法表達的約束（單位、物理意義、Phaser 行為陷阱），不寫「這行在做什麼」
- **TODO 格式**：`// TODO(mk-chuang): 說明`

## 錯誤處理

- 資源載入失敗（tilemap/sprite/audio）：顯式 throw 並停在 Preload，不允許半載入進入 gameplay
- localStorage 讀取失敗或格式不符：fallback 到預設 SaveData，不 crash
- 不 swallow error；`console.warn` 用於可恢復降級，`console.error` 用於不可恢復路徑

## 測試規範

- **測試框架**：Vitest
- **測試檔案位置**：`tests/` 目錄，`<module>.test.ts`
- **命名規則**：`describe(模組)` + `it('情境_預期結果')`
- **覆蓋率要求**：邏輯層純函數（movement、level-loader、game-state、save-manager）必須有測試；Phaser 相依的視覺/物理行為以 stage 驗收清單手動驗證

## 版本控制

- **分支策略**：trunk-based（main），必要時短生命 `feature/...` 分支
- **Commit 訊息**：`類型(範圍): 中文簡短描述`（feat / fix / docs / refactor / test / chore / perf），單一職責，功能完成並驗證後提交
- **AI 協作 footer**：`Co-authored-by: <Agent Name> (<model-or-runtime>)`

---
*此檔案為靜態編碼規範，團隊共識變更時請同步更新*

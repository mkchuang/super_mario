# ADR-001: 採用 Phaser 3.90 + Arcade Physics 作為遊戲框架與物理引擎

> **狀態**: accepted
> **日期**: 2026-06-11
> **關聯設計**: `plan-2026-06-11-mario-platformer-whole-project.md`

## 背景

super_mario 是經典 2D 平台遊戲，需要 rendering、tilemap、物理碰撞、audio、input 等完整遊戲基礎設施。專案以 AI 自主開發（goal 模式）推進，框架的文件成熟度與參考資料量直接影響開發成功率。決策時間點：Phaser 4.0 於 2026-04-10 剛釋出（4.1.0 / 2026-04-30）；Phaser 3.x 最後穩定版為 3.90.0（2025-05-23）。

## 方案比較

| 方案 | 優點 | 缺點 |
|------|------|------|
| A. Phaser 3.90 + Arcade Physics（+手感補強薄層） | 文件/範例/社群最成熟；AI 參考資料最充足；Arcade Physics 足以覆蓋 Mario 物理 | AABB 高速穿透風險；手感需薄層補強（coyote/buffer/cutoff） |
| B. Phaser 3 rendering + 自製 tile-based physics | 手感完全可控、物理可單元測試、無穿透 | 佔 Phase 1 約 30–40% 工作量；需自建 debug 工具與 adapter 層 |
| C. Phaser 4.1 | 渲染器重寫、效能佳、長期方向 | 釋出僅 2 個月，生態/教學/已知問題修補不足，自主開發風險高 |

## 決策

採用 **方案 A**：`phaser@3.90.0`（pin 版本）+ Arcade Physics，手感補強以 `src/systems/movement.ts` 純函數薄層實作（coyote time、jump buffer、jump cutoff），物理參數集中於 `src/config/physics.ts`。

## 理由

1. Phase 1 目標為完整可玩的小遊戲，開發速度與穩定性權重最高（加權評估 A=8.0、B=6.7、C=6.2，詳見 plan）
2. 經典 Mario 物理在 Arcade Physics 能力範圍內；穿透風險以 `MAX_FALL_SPEED` clamp + 固定 physics fps 緩解
3. 補強薄層為純函數：可單元測試，且物理層被模組邊界隔離，保留替換為方案 B 的空間

## 影響

- entities 不得直接操作 Phaser body 的跳躍邏輯，必須經由 movement 純函數（保證可替換性）
- 重新評估觸發條件：
  - S1 垂直切片手感驗收無法通過調校 → 切換方案 B（僅替換 physics 層）
  - Phase 3 時 Phaser 4 生態成熟（>12 個月）→ 評估升級（屆時另立 ADR）

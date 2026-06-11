# Super Mario

經典 Super Mario Bros. 風格的 2D side-scrolling 平台遊戲。TypeScript + Phaser 3，純前端、瀏覽器即開即玩。

**▶ 立即遊玩：<https://mkchuang.github.io/super_mario/>**

## 操作

| 動作 | 按鍵 |
|------|------|
| 移動 | ← → 或 A / D |
| 跳躍 | Z / J / Space（按越久跳越高） |
| 攻擊（火力形態） | X / K |
| 選單 | ↑ ↓ + Z / Enter |

## 特色

- 5 個關卡（草原 ×2、地下、城堡 ×2），手感調校：coyote time、jump buffer、可變跳躍高度
- 敵人（Goomba、Koopa 龜殼連鎖）、power-up（蘑菇/火花/無敵星）、互動磚塊
- 程序生成 chiptune BGM、localStorage 進度存檔
- 素材：Kenney CC0（見 [CREDITS.md](CREDITS.md)）

## 開發

```bash
npm install
npm run dev        # 開發伺服器
npm run test       # 單元測試（Vitest）
npm run typecheck  # TS strict 檢查
npm run lint       # ESLint
npm run levels     # 重新生成關卡（設計 → 編譯 → lint）
npm run build      # production build
```

關卡以 ASCII 定義（`scripts/levels/*.txt`），經 `scripts/gen-level.mjs` 編譯為 Tiled 相容 JSON；
新增關卡只需改 `scripts/design-levels.mjs` 與 `src/config/levels.ts`，不動場景程式碼。

架構與設計文件：`.project/design/`（plan + ADR）。

## License

程式碼 MIT；素材授權見 [CREDITS.md](CREDITS.md)。

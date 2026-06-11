# 素材授權聲明 / Asset Credits

本專案不使用任天堂原版素材；以下素材皆為 CC0（公眾領域）授權。

## 圖像

| 素材 | 來源 | 作者 | 授權 | 用途 |
|------|------|------|------|------|
| 1-Bit Platformer Pack | https://kenney.nl/assets/1-bit-platformer-pack | Kenney (kenney.nl) | CC0 1.0 | `assets/sprites/tilesheet.png`（透明背景）、`tilesheet-opaque.png`：角色、敵人、tile、道具（16×16，遊戲內以 tint 上色） |

## 音效

| 素材 | 來源 | 作者 | 授權 | 用途 |
|------|------|------|------|------|
| Digital Audio | https://kenney.nl/assets/digital-audio | Kenney (kenney.nl) | CC0 1.0 | `assets/audio/sfx-*.ogg`（跳躍、金幣、踩踏、power-up、受傷、死亡、過關等） |

### SFX 對應表（原始檔 → 遊戲內 key）

| 遊戲 key | 原始檔 |
|----------|--------|
| sfx-jump | phaseJump1.ogg |
| sfx-coin | threeTone1.ogg |
| sfx-stomp | lowDown.ogg |
| sfx-power-up | powerUp4.ogg |
| sfx-power-up-spawn | powerUp1.ogg |
| sfx-damage | phaserDown1.ogg |
| sfx-die | lowThreeTone.ogg |
| sfx-level-complete | zapThreeToneUp.ogg |
| sfx-brick-break | spaceTrash1.ogg |
| sfx-fireball | laser4.ogg |
| sfx-star | powerUp6.ogg |
| sfx-bump | pepSound1.ogg |
| sfx-one-up | highUp.ogg |

## BGM

BGM 為**程序生成 chiptune**（`src/systems/audio.ts`，Web Audio square/triangle 振盪器即時合成，
本專案自作曲），無外部音樂資產、無授權限制。三個 theme 各一首 16 步循環。

## 視覺替代說明

1-bit 素材包以單色 + 遊戲內 tint 呈現：玩家形態以顏色區分（small=白 / super=黃 / fire=橘紅）；
無敵星以鑽石寶石圖示替代；關卡終點以「門」替代旗桿（觸發機制不變，Tiled type 仍為 `flag`）。

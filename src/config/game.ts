// 幾何與遊戲常數。零依賴（不 import 任何模組）。

/** tile 邊長（pixels）；Tiled 關卡、level-loader、碰撞皆以此為準 */
export const TILE_SIZE = 16;

/** 邏輯解析度（pixels）：256×240 = 16×15 tiles 可視範圍（NES 比例） */
export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;

/** 初始生命數 */
export const INITIAL_LIVES = 3;

/** 每收集 100 金幣加一命 */
export const COINS_PER_LIFE = 100;

/** 無敵星持續時間（ms） */
export const STAR_DURATION_MS = 10_000;

/** 受傷後的短暫無敵時間（ms） */
export const DAMAGE_INVULN_MS = 1_000;

/** localStorage 存檔 key（帶版本，格式變更時換新 key + 遷移） */
export const SAVE_KEY = 'super-mario.save.v1';

/** 攝影機前瞻：鏡頭向移動方向偏移的距離（pixels），讓前方場景可見 */
export const CAMERA_LOOKAHEAD_PX = 56;

/** 攝影機水平跟隨速度（lerp 0–1；越大越跟手） */
export const CAMERA_LERP_X = 0.18;

/** 前瞻方向承諾時間（ms）：持續同向移動超過此時間才轉移前瞻方向，避免回頭即甩鏡頭 */
export const CAMERA_TURN_COMMIT_MS = 400;

/** 前瞻偏移過渡速度（pixels/s）：方向轉移時鏡頭緩慢滑過去 */
export const CAMERA_OFFSET_SPEED = 160;

/** 分數規則 */
export const SCORE_COIN = 200;
export const SCORE_STOMP = 100;
export const SCORE_POWER_UP = 1000;
export const SCORE_TIME_BONUS_PER_SEC = 50;

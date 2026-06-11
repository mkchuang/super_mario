import Phaser from 'phaser';
import { SHEET_KEY, THEME_STYLE } from '../config/sprites';
import { TEST_LEVEL, type LevelDefinition } from '../config/levels';
import { parseLevel, type ParsedLevel } from '../systems/level-loader';

/**
 * Gameplay 場景：載入 tilemap、建立碰撞層。
 * TASK-006：tilemap 渲染與 ground 碰撞；TASK-007 加入 Player。
 */
export class LevelScene extends Phaser.Scene {
  private levelDef: LevelDefinition = TEST_LEVEL;
  private parsed!: ParsedLevel;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super('level');
  }

  init(data: { level?: LevelDefinition }): void {
    this.levelDef = data.level ?? TEST_LEVEL;
  }

  create(): void {
    const style = THEME_STYLE[this.levelDef.theme];
    this.cameras.main.setBackgroundColor(style.bgColor);

    const map = this.make.tilemap({ key: this.levelDef.key });
    const tileset = map.addTilesetImage('tilesheet', SHEET_KEY);
    if (!tileset) throw new Error(`tileset 載入失敗：${this.levelDef.key}`);

    const ground = map.createLayer('ground', tileset, 0, 0);
    if (!ground) throw new Error(`ground layer 建立失敗：${this.levelDef.key}`);
    this.groundLayer = ground;
    this.groundLayer.setTint(style.groundTint);
    this.groundLayer.setCollisionByProperty({ collides: true });

    this.parsed = parseLevel(this.cache.tilemap.get(this.levelDef.key).data);

    this.physics.world.setBounds(0, 0, this.parsed.widthPx, this.parsed.heightPx);
    this.cameras.main.setBounds(0, 0, this.parsed.widthPx, this.parsed.heightPx);
  }

  /** 給後續 task 取用：碰撞層 */
  get terrain(): Phaser.Tilemaps.TilemapLayer {
    return this.groundLayer;
  }

  /** 給後續 task 取用：解析後的關卡資料 */
  get levelData(): ParsedLevel {
    return this.parsed;
  }
}

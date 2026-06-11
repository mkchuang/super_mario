import Phaser from 'phaser';
import { SHEET_KEY, THEME_STYLE } from '../config/sprites';
import { TEST_LEVEL, type LevelDefinition } from '../config/levels';
import { parseLevel, findPlayerSpawn, type ParsedLevel } from '../systems/level-loader';
import { InputSystem } from '../systems/input';
import { Player } from '../entities/player';

/**
 * Gameplay 場景：tilemap、碰撞層、Player 與攝影機。
 */
export class LevelScene extends Phaser.Scene {
  private levelDef: LevelDefinition = TEST_LEVEL;
  private parsed!: ParsedLevel;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private player!: Player;
  private inputSystem!: InputSystem;

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

    // world bounds：左右與上緣封閉，下緣開放（掉出 = 死亡）
    this.physics.world.setBounds(0, 0, this.parsed.widthPx, this.parsed.heightPx);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.parsed.widthPx, this.parsed.heightPx);

    this.inputSystem = new InputSystem(this);
    const spawn = findPlayerSpawn(this.parsed);
    this.player = new Player(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player, this.groundLayer);

    // 攝影機跟隨：水平死區讓視野穩定
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(48, 64);
  }

  update(_time: number, dtMs: number): void {
    this.player.handleInput(this.inputSystem, dtMs);

    // 掉出關卡底部：death（TASK-017 接 GameState；目前重生）
    if (this.player.y > this.parsed.heightPx + 32) {
      this.events.emit('player-died');
      const spawn = findPlayerSpawn(this.parsed);
      this.player.setPosition(spawn.x, spawn.y);
      this.player.arcade.setVelocity(0, 0);
    }
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

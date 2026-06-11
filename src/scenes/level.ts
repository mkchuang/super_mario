import Phaser from 'phaser';
import { SHEET_KEY, THEME_STYLE } from '../config/sprites';
import { TEST_LEVEL, type LevelDefinition } from '../config/levels';
import { parseLevel, findPlayerSpawn, type ParsedLevel, type SpawnDef } from '../systems/level-loader';
import { InputSystem } from '../systems/input';
import { Player } from '../entities/player';
import { Coin } from '../entities/coin';
import { QuestionBlock, type BlockContent } from '../entities/question-block';
import { Brick } from '../entities/brick';

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

    this.spawnEntities();

    // 攝影機跟隨：水平死區讓視野穩定
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(48, 64);
  }

  private spawnEntities(): void {
    const coins = this.physics.add.group({ allowGravity: false, immovable: true });
    const blocks = this.physics.add.group({ allowGravity: false, immovable: true });

    for (const s of this.parsed.spawns) {
      this.spawnEntity(s, coins, blocks);
    }

    this.physics.add.overlap(this.player, coins, (_p, c) => (c as Coin).collect());
    this.physics.add.collider(this.player, blocks, (p, b) => {
      // 只有「從下方頂撞」觸發互動
      const player = p as Player;
      if (!player.arcade.touching.up) return;
      if (b instanceof QuestionBlock) b.hit();
      else if (b instanceof Brick) b.hit(player.powerState);
    });

    // power-up 實體生成於 TASK-012
    this.events.on('power-up-spawn', (e: { type: BlockContent; x: number; y: number }) => {
      console.warn(`power-up-spawn 尚未實作（TASK-012）：${e.type}`);
    });
  }

  private spawnEntity(
    s: SpawnDef,
    coins: Phaser.Physics.Arcade.Group,
    blocks: Phaser.Physics.Arcade.Group,
  ): void {
    switch (s.type) {
      case 'coin':
        coins.add(new Coin(this, s.x, s.y));
        break;
      case 'question-block':
        blocks.add(new QuestionBlock(this, s.x, s.y, (s.props.content as BlockContent) ?? 'coin'));
        break;
      case 'brick':
        blocks.add(new Brick(this, s.x, s.y));
        break;
      case 'player-spawn':
        break; // 已於 create 處理
      default:
        // goomba / koopa 於 TASK-010/011 實作
        break;
    }
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

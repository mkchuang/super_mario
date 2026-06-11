import Phaser from 'phaser';
import { SHEET_KEY, THEME_STYLE } from '../config/sprites';
import { TEST_LEVEL, type LevelDefinition } from '../config/levels';
import { parseLevel, findPlayerSpawn, type ParsedLevel, type SpawnDef } from '../systems/level-loader';
import { InputSystem } from '../systems/input';
import { Player } from '../entities/player';
import { Coin } from '../entities/coin';
import { QuestionBlock, type BlockContent } from '../entities/question-block';
import { Brick } from '../entities/brick';
import { Enemy } from '../entities/enemy';
import { Goomba } from '../entities/goomba';
import { Koopa } from '../entities/koopa';

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
    const enemies = this.physics.add.group();

    for (const s of this.parsed.spawns) {
      this.spawnEntity(s, coins, blocks, enemies);
    }

    this.physics.add.overlap(this.player, coins, (_p, c) => (c as Coin).collect());
    this.physics.add.collider(this.player, blocks, (p, b) => {
      // 只有「從下方頂撞」觸發互動
      const player = p as Player;
      if (!player.arcade.touching.up) return;
      if (b instanceof QuestionBlock) b.hit();
      else if (b instanceof Brick) b.hit(player.powerState);
    });

    this.physics.add.collider(enemies, this.groundLayer);
    this.physics.add.collider(enemies, blocks);
    // 敵人互撞：滑行龜殼消滅對方
    this.physics.add.collider(enemies, enemies, (a, b) => {
      const ea = a as Enemy;
      const eb = b as Enemy;
      if (ea instanceof Koopa && ea.isSliding) eb.defeat();
      else if (eb instanceof Koopa && eb.isSliding) ea.defeat();
    });

    this.physics.add.collider(this.player, enemies, (p, e) => {
      const player = p as Player;
      const enemy = e as Enemy;
      if (enemy.isDead) return;
      // 踩踏：玩家底部高於敵人中心且正在接觸下方
      const stomp = player.arcade.touching.down && player.arcade.bottom <= enemy.arcade.top + 8;
      if (stomp) {
        enemy.onStomp(player);
        return;
      }
      // 靜止龜殼側碰 → 踢出，不受傷
      if (enemy instanceof Koopa && enemy.isIdleShell) {
        enemy.kick(player.x);
        return;
      }
      player.takeDamage();
    });

    // power-up 實體生成於 TASK-012
    this.events.on('power-up-spawn', (e: { type: BlockContent; x: number; y: number }) => {
      console.warn(`power-up-spawn 尚未實作（TASK-012）：${e.type}`);
    });

    this.events.on('player-died', () => this.respawn());
  }

  private respawn(): void {
    const spawn = findPlayerSpawn(this.parsed);
    this.player.setPosition(spawn.x, spawn.y);
    this.player.arcade.setVelocity(0, 0);
    this.player.powerState = 'small';
  }

  private spawnEntity(
    s: SpawnDef,
    coins: Phaser.Physics.Arcade.Group,
    blocks: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
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
      case 'goomba': {
        const goomba = new Goomba(this, s.x, s.y);
        goomba.edgeTurn = s.props.edgeTurn === true;
        goomba.bindTerrain(this.groundLayer);
        enemies.add(goomba);
        break;
      }
      case 'koopa': {
        const koopa = new Koopa(this, s.x, s.y);
        koopa.bindTerrain(this.groundLayer);
        enemies.add(koopa);
        break;
      }
      case 'player-spawn':
        break; // 已於 create 處理
      default:
        break;
    }
  }

  update(_time: number, dtMs: number): void {
    this.player.handleInput(this.inputSystem, dtMs);

    // 掉出關卡底部：death（TASK-017 接 GameState；目前由 player-died 監聽重生）
    if (this.player.y > this.parsed.heightPx + 32) {
      this.events.emit('player-died');
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

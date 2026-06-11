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
import { PowerUp, type PowerUpType } from '../entities/power-up';
import { Fireball } from '../entities/fireball';
import { GameState } from '../state/game-state';
import { AudioSystem } from '../systems/audio';
import { FRAME, TINT } from '../config/sprites';
import { SCORE_STOMP } from '../config/game';
import type { PowerState } from '../state/types';

/**
 * Gameplay 場景：tilemap、碰撞層、Player 與攝影機。
 */
export class LevelScene extends Phaser.Scene {
  private levelDef: LevelDefinition = TEST_LEVEL;
  private parsed!: ParsedLevel;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private player!: Player;
  private inputSystem!: InputSystem;
  private fireballs!: Phaser.Physics.Arcade.Group;
  private gameState!: GameState;
  private audio!: AudioSystem;
  private timeLeftSec = 0;
  private timeAccumMs = 0;
  private ending = false;

  constructor() {
    super('level');
  }

  init(data: { level?: LevelDefinition }): void {
    this.levelDef = data.level ?? TEST_LEVEL;
    this.ending = false;
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
    this.spawnTriggers();

    // 攝影機跟隨：水平死區讓視野穩定
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(48, 64);

    this.bindGameState();

    // HUD overlay
    this.scene.launch('hud', {
      displayName: this.levelDef.displayName,
      timeLimitSec: this.levelDef.timeLimitSec,
    });

    // BGM（依 theme，data-driven）
    this.audio = new AudioSystem(this);
    this.audio.playBgm(this.levelDef.musicKey);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('hud');
      this.audio.stopBgm();
    });
  }

  private bindGameState(): void {
    // 直接以 level 場景啟動（dev）時 registry 沒有 GameState → 建立預設
    this.gameState =
      (this.registry.get('gameState') as GameState | undefined) ?? new GameState();
    this.registry.set('gameState', this.gameState);
    this.gameState.setPowerState(this.player.powerState);

    this.timeLeftSec = this.levelDef.timeLimitSec;
    this.timeAccumMs = 0;

    this.events.on('coin-collected', (e: { value: number }) => {
      if (this.gameState.addCoin(e.value)) this.sound.play('sfx-one-up', { volume: 0.6 });
      this.refreshHud();
    });
    this.events.on('enemy-stomped', (e: { score: number }) => {
      this.gameState.addScore(e.score);
      this.refreshHud();
    });
    this.events.on('power-up-collected', (e: { score: number }) => {
      this.gameState.addScore(e.score);
      this.refreshHud();
    });
    this.events.on('brick-broken', () => {
      this.gameState.addScore(SCORE_STOMP / 2);
      this.refreshHud();
    });
    this.events.on('player-power-changed', (e: { powerState: PowerState }) => {
      this.gameState.setPowerState(e.powerState);
    });

    this.refreshHud();
    this.events.emit('time-tick', { left: this.timeLeftSec });
  }

  private refreshHud(): void {
    this.events.emit('hud-refresh', this.gameState.snapshot);
  }

  /** 終點門（flag trigger） */
  private spawnTriggers(): void {
    for (const t of this.parsed.triggers) {
      if (t.type !== 'flag') continue;
      this.add.image(t.x, t.y, 'tilesheet', FRAME.DOOR_EXIT).setTint(TINT.COIN);
      const zone = this.add.zone(t.x, t.y, 16, 16);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => this.completeLevel());
    }
  }

  private completeLevel(): void {
    if (this.ending) return;
    this.ending = true;
    this.sound.play('sfx-level-complete', { volume: 0.6 });
    this.events.emit('level-completed', { timeLeft: this.timeLeftSec });
    this.player.arcade.setVelocity(0, 0);
    this.tweens.add({ targets: this.player, alpha: 0, duration: 400 });
    this.time.delayedCall(700, () => {
      this.scene.start('level-complete', { timeLeft: this.timeLeftSec });
    });
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
      // 無敵星：接觸即消滅
      if (player.isStarActive) {
        enemy.defeat();
        return;
      }
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

    // power-up：問號磚吐出 → 實體生成
    const powerUps = this.physics.add.group();
    this.physics.add.collider(powerUps, this.groundLayer);
    this.physics.add.collider(powerUps, blocks);
    this.physics.add.overlap(this.player, powerUps, (p, pu) => {
      const powerUp = pu as PowerUp;
      if (!powerUp.collectable) return;
      (p as Player).applyPowerUp(powerUp.powerUpType);
      powerUp.destroy();
    });
    this.events.on('power-up-spawn', (e: { type: PowerUpType; x: number; y: number }) => {
      powerUps.add(new PowerUp(this, e.x, e.y, e.type));
    });

    // 火球（fire 形態，同時上限 2 顆）
    this.fireballs = this.physics.add.group();
    this.physics.add.collider(this.fireballs, this.groundLayer);
    this.physics.add.collider(this.fireballs, blocks);
    this.physics.add.overlap(this.fireballs, enemies, (f, e) => {
      const enemy = e as Enemy;
      if (enemy.isDead) return;
      enemy.defeat();
      (f as Fireball).pop();
    });

    this.events.on('player-died', () => this.onPlayerDied());
  }

  /** 死亡：扣命 → 重開本關或 GameOver */
  private onPlayerDied(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.arcade.enable = false;
    this.tweens.add({ targets: this.player, alpha: 0, angle: 180, duration: 500 });
    const livesLeft = this.gameState.loseLife();
    this.refreshHud();
    this.time.delayedCall(900, () => {
      if (livesLeft > 0) this.scene.restart({ level: this.levelDef });
      else this.scene.start('game-over');
    });
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
    if (this.ending) return;
    this.player.handleInput(this.inputSystem, dtMs);

    // 攻擊：fire 形態發射火球
    if (
      this.inputSystem.attackPressed &&
      this.player.powerState === 'fire' &&
      this.fireballs.countActive(true) < 2
    ) {
      this.fireballs.add(
        new Fireball(this, this.player.x + this.player.facing * 10, this.player.y, this.player.facing),
      );
    }

    // 倒數計時：歸零死亡
    this.timeAccumMs += dtMs;
    while (this.timeAccumMs >= 1000) {
      this.timeAccumMs -= 1000;
      this.timeLeftSec -= 1;
      this.events.emit('time-tick', { left: this.timeLeftSec });
      if (this.timeLeftSec === 60) this.audio.setHurry(true);
      if (this.timeLeftSec <= 0) {
        this.events.emit('player-died');
        return;
      }
    }

    // 掉出關卡底部：死亡
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

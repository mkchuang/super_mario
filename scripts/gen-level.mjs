// 關卡產生器：把 ASCII 關卡定義（scripts/levels/*.txt）編譯成 Tiled 相容 JSON
// 輸出至 assets/tilemaps/。輸出格式與 Tiled 1.x 一致，之後可改用 Tiled 直接編輯。
//
// 圖例（與 README of legend 同步）：
//   #  ground（碰撞 tile）
//   =  平台 tile（碰撞，同 ground 不同視覺可後續擴充）
//   B  brick（entities 物件，type=brick）
//   ?  question block（content=coin）
//   M  question block（content=mushroom）
//   F  question block（content=fire-flower）
//   S  question block（content=star）
//   o  coin（entities 物件）
//   g  goomba spawn    k  koopa spawn
//   P  player spawn    D  door / flag（triggers，type=flag）
//   .  空白
//
// 用法：node scripts/gen-level.mjs [name...]（無參數時編譯 scripts/levels/ 全部）

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = join(__dirname, 'levels');
const OUT_DIR = join(__dirname, '..', 'assets', 'tilemaps');

const TILE = 16;
const HEIGHT = 15;
// 與 src/config/sprites.ts FRAME 對齊（gid = frame + firstgid(1)）
const GID = { GROUND: 12 };

const ENTITY_CHARS = {
  B: { type: 'brick' },
  '?': { type: 'question-block', content: 'coin' },
  M: { type: 'question-block', content: 'mushroom' },
  F: { type: 'question-block', content: 'fire-flower' },
  S: { type: 'question-block', content: 'star' },
  o: { type: 'coin' },
  g: { type: 'goomba' },
  G: { type: 'goomba', edgeTurn: true },
  k: { type: 'koopa' },
  P: { type: 'player-spawn' },
};

function compile(name) {
  const text = readFileSync(join(LEVELS_DIR, `${name}.txt`), 'utf8');
  const rows = text.split('\n').filter((r) => r.length > 0 && !r.startsWith('//'));
  if (rows.length !== HEIGHT) {
    throw new Error(`${name}: 需要 ${HEIGHT} 列，實際 ${rows.length}`);
  }
  const width = Math.max(...rows.map((r) => r.length));

  const ground = [];
  const entities = [];
  const triggers = [];
  let objId = 1;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x] ?? '.';
      if (ch === '#' || ch === '=') {
        ground.push(GID.GROUND);
        continue;
      }
      ground.push(0);
      if (ch === '.' || ch === ' ') continue;

      const def = ENTITY_CHARS[ch];
      const base = { id: objId++, x: x * TILE, y: y * TILE, width: TILE, height: TILE };
      if (def) {
        const properties = [];
        if (def.content) properties.push({ name: 'content', type: 'string', value: def.content });
        if (def.edgeTurn) properties.push({ name: 'edgeTurn', type: 'bool', value: true });
        entities.push({ ...base, name: def.type, type: def.type, properties });
      } else if (ch === 'D') {
        triggers.push({ ...base, name: 'flag', type: 'flag', properties: [] });
      } else {
        throw new Error(`${name}: 未知字元 '${ch}' at (${x},${y})`);
      }
    }
  }

  const map = {
    type: 'map',
    version: '1.10',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width,
    height: HEIGHT,
    tilewidth: TILE,
    tileheight: TILE,
    nextobjectid: objId,
    layers: [
      {
        id: 1,
        name: 'ground',
        type: 'tilelayer',
        width,
        height: HEIGHT,
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        data: ground,
      },
      {
        id: 2,
        name: 'entities',
        type: 'objectgroup',
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        objects: entities,
      },
      {
        id: 3,
        name: 'triggers',
        type: 'objectgroup',
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        objects: triggers,
      },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: 'tilesheet',
        tilewidth: TILE,
        tileheight: TILE,
        tilecount: 400,
        columns: 20,
        image: '../sprites/tilesheet.png',
        imagewidth: 320,
        imageheight: 320,
        margin: 0,
        spacing: 0,
        tiles: [
          { id: GID.GROUND - 1, properties: [{ name: 'collides', type: 'bool', value: true }] },
        ],
      },
    ],
  };

  writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(map));
  console.log(`${name}: ${width}×${HEIGHT} tiles, ${entities.length} entities, ${triggers.length} triggers`);
}

const names = process.argv.slice(2);
const targets = names.length
  ? names
  : readdirSync(LEVELS_DIR)
      .filter((f) => f.endsWith('.txt'))
      .map((f) => basename(f, '.txt'));
targets.forEach(compile);

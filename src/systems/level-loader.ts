// Tiled JSON 物件層解析（純函數，不 import Phaser）。
// tile layer 的渲染與碰撞由 Phaser Tilemap API 處理；此模組負責 entities/triggers。

/** Tiled JSON 的最小結構（只宣告會用到的欄位） */
export interface TiledProperty {
  name: string;
  value: string | number | boolean;
}

export interface TiledObject {
  id: number;
  name: string;
  type?: string;
  /** Tiled 物件座標為左上角（rect object） */
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: TiledProperty[];
}

export interface TiledLayer {
  name: string;
  type: string;
  objects?: TiledObject[];
}

export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
}

export interface SpawnDef {
  type: string;
  /** 中心點座標（pixels） */
  x: number;
  y: number;
  props: Record<string, string | number | boolean>;
}

export interface ParsedLevel {
  widthPx: number;
  heightPx: number;
  spawns: SpawnDef[];
  triggers: SpawnDef[];
}

export const KNOWN_ENTITY_TYPES = [
  'player-spawn',
  'goomba',
  'koopa',
  'coin',
  'question-block',
  'brick',
] as const;

export const KNOWN_TRIGGER_TYPES = ['flag', 'checkpoint'] as const;

function toSpawn(obj: TiledObject): SpawnDef {
  const props: SpawnDef['props'] = {};
  for (const p of obj.properties ?? []) props[p.name] = p.value;
  return {
    type: obj.type ?? obj.name,
    x: obj.x + obj.width / 2,
    y: obj.y + obj.height / 2,
    props,
  };
}

function parseObjectLayer(map: TiledMap, layerName: string, known: readonly string[]): SpawnDef[] {
  const layer = map.layers.find((l) => l.type === 'objectgroup' && l.name === layerName);
  if (!layer) {
    console.warn(`level-loader: 找不到物件層 '${layerName}'`);
    return [];
  }
  const result: SpawnDef[] = [];
  for (const obj of layer.objects ?? []) {
    const spawn = toSpawn(obj);
    if (!known.includes(spawn.type)) {
      console.warn(`level-loader: 未知 type '${spawn.type}'（id=${obj.id}），略過`);
      continue;
    }
    result.push(spawn);
  }
  return result;
}

/** 解析關卡的物件層；tile layer 交給 Phaser Tilemap 處理 */
export function parseLevel(map: TiledMap): ParsedLevel {
  return {
    widthPx: map.width * map.tilewidth,
    heightPx: map.height * map.tileheight,
    spawns: parseObjectLayer(map, 'entities', KNOWN_ENTITY_TYPES),
    triggers: parseObjectLayer(map, 'triggers', KNOWN_TRIGGER_TYPES),
  };
}

/** 取得玩家出生點；缺少時 fallback 到左上安全位置並警告 */
export function findPlayerSpawn(level: ParsedLevel): { x: number; y: number } {
  const spawn = level.spawns.find((s) => s.type === 'player-spawn');
  if (!spawn) {
    console.warn('level-loader: 關卡缺少 player-spawn，使用預設出生點');
    return { x: 24, y: 24 };
  }
  return { x: spawn.x, y: spawn.y };
}

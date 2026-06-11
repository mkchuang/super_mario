import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseLevel,
  findPlayerSpawn,
  type TiledMap,
} from '../src/systems/level-loader';

const makeMap = (overrides: Partial<TiledMap> = {}): TiledMap => ({
  width: 10,
  height: 15,
  tilewidth: 16,
  tileheight: 16,
  layers: [
    { name: 'ground', type: 'tilelayer' },
    {
      name: 'entities',
      type: 'objectgroup',
      objects: [
        { id: 1, name: 'player-spawn', type: 'player-spawn', x: 16, y: 192, width: 16, height: 16 },
        {
          id: 2,
          name: 'question-block',
          type: 'question-block',
          x: 48,
          y: 128,
          width: 16,
          height: 16,
          properties: [{ name: 'content', value: 'mushroom' }],
        },
        { id: 3, name: 'goomba', type: 'goomba', x: 96, y: 192, width: 16, height: 16 },
      ],
    },
    {
      name: 'triggers',
      type: 'objectgroup',
      objects: [{ id: 4, name: 'flag', type: 'flag', x: 144, y: 192, width: 16, height: 16 }],
    },
  ],
  ...overrides,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('level-loader.parseLevel', () => {
  it('計算關卡像素尺寸', () => {
    const level = parseLevel(makeMap());
    expect(level.widthPx).toBe(160);
    expect(level.heightPx).toBe(240);
  });

  it('解析 entities_物件座標轉為中心點', () => {
    const level = parseLevel(makeMap());
    const spawn = level.spawns.find((s) => s.type === 'player-spawn');
    expect(spawn).toEqual({ type: 'player-spawn', x: 24, y: 200, props: {} });
  });

  it('解析 properties_攤平為 props 物件', () => {
    const level = parseLevel(makeMap());
    const block = level.spawns.find((s) => s.type === 'question-block');
    expect(block?.props).toEqual({ content: 'mushroom' });
  });

  it('解析 triggers_flag 進 triggers 清單', () => {
    const level = parseLevel(makeMap());
    expect(level.triggers).toHaveLength(1);
    expect(level.triggers[0]?.type).toBe('flag');
  });

  it('未知 type_警告並略過不 crash', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const map = makeMap();
    map.layers[1]!.objects!.push({
      id: 99,
      name: 'ufo',
      type: 'ufo',
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    });
    const level = parseLevel(map);
    expect(level.spawns.find((s) => s.type === 'ufo')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ufo'));
  });

  it('缺少物件層_回傳空陣列並警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const level = parseLevel(makeMap({ layers: [{ name: 'ground', type: 'tilelayer' }] }));
    expect(level.spawns).toEqual([]);
    expect(level.triggers).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe('level-loader.findPlayerSpawn', () => {
  it('回傳 player-spawn 中心點', () => {
    expect(findPlayerSpawn(parseLevel(makeMap()))).toEqual({ x: 24, y: 200 });
  });

  it('缺少 player-spawn_使用預設並警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const level = parseLevel(makeMap({ layers: [] }));
    expect(findPlayerSpawn(level)).toEqual({ x: 24, y: 24 });
    expect(warn).toHaveBeenCalled();
  });
});

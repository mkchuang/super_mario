// 正式關卡設計：以 segment builder 組裝 ASCII 關卡（輸出 scripts/levels/*.txt）
// 跳躍能力（physics.ts 推導）：跳高 ~5 tiles、水平跨距 ~8 tiles（滿速）
// 設計守則：坑寬 ≤4、平台高低差 ≤4、第一關不需進階技巧

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = (n) => join(__dirname, 'levels', `${n}.txt`);
const H = 15;

class LevelBuilder {
  constructor(comment) {
    this.comment = comment;
    this.grid = []; // grid[col] = 15 chars
    this.x = 0;
  }
  col() {
    const c = Array(H).fill('.');
    this.grid.push(c);
    return c;
  }
  /** 平地 n 格（rows 13-14 鋪地） */
  flat(n) {
    for (let i = 0; i < n; i++) {
      const c = this.col();
      c[13] = '#';
      c[14] = '#';
    }
    return this;
  }
  /** 坑 n 格（≤4 安全） */
  pit(n) {
    if (n > 4) throw new Error(`pit ${n} > 4`);
    for (let i = 0; i < n; i++) this.col();
    return this;
  }
  /** 在當前游標前 offset 格、第 row 列放字元（不影響地形游標） */
  put(row, ch, offset = 0) {
    const col = this.grid[this.grid.length - 1 - offset];
    if (!col) throw new Error('put 超出範圍');
    if (col[row] !== '.') throw new Error(`put 重疊 row=${row}`);
    col[row] = ch;
    return this;
  }
  /** 浮空平台：從目前位置往回 len 格，在 row 列鋪 '='（碰撞 tile） */
  platformBack(row, len) {
    for (let i = 0; i < len; i++) {
      const col = this.grid[this.grid.length - 1 - i];
      if (!col) throw new Error('platformBack 超出範圍');
      col[row] = '=';
    }
    return this;
  }
  /** 階梯（上升 h 格、每階 1 格寬，落在地面上） */
  stairsUp(h) {
    for (let s = 1; s <= h; s++) {
      const c = this.col();
      c[13] = '#';
      c[14] = '#';
      for (let r = 12; r > 12 - s; r--) c[r] = '#';
    }
    return this;
  }
  stairsDown(h) {
    for (let s = h; s >= 1; s--) {
      const c = this.col();
      c[13] = '#';
      c[14] = '#';
      for (let r = 12; r > 12 - s; r--) c[r] = '#';
    }
    return this;
  }
  /** 天花板（underground 風格）：整關蓋好後對 col 範圍 row 0 鋪 '#' */
  ceiling(fromCol, toCol) {
    for (let i = fromCol; i <= toCol && i < this.grid.length; i++) {
      this.grid[i][0] = '#';
    }
    return this;
  }
  toString() {
    const rows = [];
    for (let r = 0; r < H; r++) rows.push(this.grid.map((c) => c[r]).join(''));
    return `// ${this.comment}\n${rows.join('\n')}\n`;
  }
}

/* ---------- L1 教學（overworld，~200 tiles）---------- */
const l1 = new LevelBuilder('L1 教學：跳躍/金幣/goomba/問號磚/蘑菇');
l1.flat(16).put(12, 'P', 14);
l1.flat(6).put(8, '?', 2).put(8, 'M', 1); // 第一組磚：金幣+蘑菇
l1.flat(10).put(12, 'o', 6).put(12, 'o', 5).put(12, 'o', 4);
l1.flat(8).put(12, 'g', 3); // 第一隻 goomba
l1.pit(2).flat(12).put(12, 'o', 8).put(12, 'o', 7); // 第一個小坑
l1.flat(8).put(8, '?', 4).put(8, 'B', 3).put(8, '?', 2);
l1.flat(10).put(12, 'g', 5).put(12, 'g', 3);
l1.pit(3).flat(14); // 坑後平台區
l1.flat(0);
// 浮空平台練習（不致死，下方有地）
l1.flat(12).platformBack(9, 4).put(8, 'o', 1).put(8, 'o', 2);
l1.flat(10).put(8, 'F', 5); // 火花
l1.pit(3).flat(10).put(12, 'k', 4); // koopa
l1.flat(8).put(8, 'B', 4).put(8, 'S', 3).put(8, 'B', 2); // 星星藏在磚間
l1.stairsUp(4).flat(4).pit(4).flat(6); // 階梯+大坑（跳遠教學）
l1.stairsDown(2).flat(16).put(12, 'g', 8).put(12, 'o', 5).put(12, 'o', 4);
l1.stairsUp(3).flat(10).put(12, 'D', 4); // 終點高台
writeFileSync(OUT('level-1'), l1.toString());

/* ---------- L2 進階（overworld，~210 tiles）---------- */
const l2 = new LevelBuilder('L2 進階：垂直結構/koopa/殼連鎖');
l2.flat(12).put(12, 'P', 10);
l2.flat(8).put(8, '?', 4).put(8, '?', 2);
l2.pit(3).flat(10).put(12, 'g', 5).put(12, 'g', 3);
l2.flat(12).platformBack(10, 4).put(9, 'o', 1).put(9, 'o', 2).put(9, 'o', 3);
l2.flat(12).platformBack(8, 4).put(7, 'M', 2); // 高台蘑菇
l2.pit(4).flat(8).put(12, 'k', 4);
l2.flat(12).put(12, 'g', 6).put(12, 'g', 4).put(12, 'g', 2); // 殼連鎖靶場
l2.stairsUp(3).pit(3).stairsDown(3); // 階梯夾坑
l2.flat(10).put(8, 'B', 6).put(8, 'F', 5).put(8, 'B', 4);
l2.flat(12).platformBack(9, 3);
l2.flat(12).platformBack(6, 3).put(5, 'o', 1).put(5, 'o', 2); // 二段平台
l2.pit(4).flat(10).put(12, 'k', 5).put(12, 'g', 3);
l2.flat(8).put(8, 'S', 4);
l2.stairsUp(5).flat(4).pit(4).flat(8); // 高階梯跳遠
l2.flat(10).put(12, 'G', 5);
l2.stairsUp(2).flat(10).put(12, 'D', 4);
writeFileSync(OUT('level-2'), l2.toString());

/* ---------- L3 地下（underground，~200 tiles）---------- */
const l3 = new LevelBuilder('L3 地下：密集磚陣/星星藏點');
l3.flat(12).put(12, 'P', 10);
l3.flat(10).put(8, 'B', 6).put(8, 'B', 5).put(8, '?', 4).put(8, 'B', 3).put(8, 'B', 2);
l3.flat(8).put(12, 'g', 4).put(12, 'g', 2);
l3.flat(12).platformBack(9, 5).put(8, 'o', 2).put(8, 'o', 3).put(8, 'o', 4);
l3.pit(3).flat(10).put(8, 'M', 5);
l3.flat(10).put(12, 'k', 5);
l3.flat(12).platformBack(10, 4).platformBack(6, 3); // 雙層
l3.put(5, 'o', 1).put(5, 'o', 2);
l3.pit(4).flat(8).put(12, 'g', 4).put(12, 'g', 2);
l3.flat(10).put(8, 'B', 6).put(8, 'S', 5).put(8, 'B', 4); // 星星磚陣
l3.flat(8).put(12, 'G', 4);
l3.flat(12).platformBack(9, 4).put(8, 'F', 2);
l3.pit(3).stairsUp(4).flat(4).stairsDown(4); // 金字塔
l3.flat(10).put(12, 'k', 5).put(12, 'g', 3);
l3.flat(10).put(8, 'B', 6).put(8, 'B', 5).put(8, '?', 4).put(8, 'B', 3); // 磚陣走廊
l3.flat(12).platformBack(10, 4).put(9, 'o', 2).put(9, 'o', 3);
l3.pit(3).flat(8).put(12, 'g', 4);
l3.flat(10).put(8, 'o', 5, ).put(7, 'o', 4).put(8, 'o', 3); // 弧形金幣
l3.stairsUp(2).flat(10).put(12, 'D', 4);
const l3str = l3; // 天花板：全長 row0
l3.ceiling(0, l3.grid.length - 1);
writeFileSync(OUT('level-3'), l3.toString());

/* ---------- L4 城堡（castle，~210 tiles）---------- */
const l4 = new LevelBuilder('L4 城堡：精準跳躍');
l4.flat(10).put(12, 'P', 8);
l4.pit(2).flat(4).pit(2).flat(6); // 連續小坑
l4.flat(6).put(12, 'g', 3);
l4.pit(3).flat(3).pit(3).flat(6).put(8, 'M', 3); // 短平台連跳
l4.flat(12).platformBack(9, 3);
l4.flat(10).platformBack(7, 3).put(6, 'o', 1).put(6, 'o', 2); // 高低交錯
l4.pit(4).flat(6).put(12, 'k', 3);
l4.flat(8).put(8, 'B', 4).put(8, 'F', 3).put(8, 'B', 2);
l4.pit(2).flat(3).pit(2).flat(3).pit(2).flat(8); // 節奏跳
l4.flat(8).put(12, 'g', 4).put(12, 'g', 2);
l4.stairsUp(4).pit(4).stairsDown(2); // 高臺跳遠
l4.flat(8).put(8, 'S', 4);
l4.flat(12).platformBack(10, 3).platformBack(7, 2);
l4.pit(3).flat(6).put(12, 'G', 3).pit(3).flat(8).put(12, 'k', 4);
l4.stairsUp(3).flat(10).put(12, 'D', 4);
writeFileSync(OUT('level-4'), l4.toString());

/* ---------- L5 最終（castle，~240 tiles）---------- */
const l5 = new LevelBuilder('L5 最終：綜合全部機制');
l5.flat(12).put(12, 'P', 10);
l5.flat(8).put(8, '?', 4).put(8, 'M', 3).put(8, '?', 2);
l5.pit(3).flat(8).put(12, 'g', 4).put(12, 'g', 2);
l5.flat(12).platformBack(9, 4).put(8, 'o', 2).put(8, 'o', 3);
l5.pit(4).flat(8).put(12, 'k', 4);
l5.flat(10).put(8, 'B', 5).put(8, 'F', 4).put(8, 'B', 3);
l5.pit(2).flat(3).pit(2).flat(3).pit(2).flat(6); // 節奏跳
l5.flat(10).put(12, 'g', 6).put(12, 'g', 4).put(12, 'g', 2);
l5.stairsUp(5).flat(3).pit(4).flat(6).stairsDown(3); // 高塔跳遠
l5.flat(10).put(12, 'k', 5).put(12, 'k', 2); // 雙龜
l5.flat(8).put(8, 'S', 4);
l5.flat(12).platformBack(10, 4).platformBack(7, 3).put(6, 'o', 1).put(6, 'o', 2);
l5.pit(3).flat(4).pit(3).flat(8).put(12, 'G', 4);
l5.flat(10).put(8, 'B', 6).put(8, '?', 5).put(8, 'B', 4);
l5.pit(4).flat(6).put(12, 'g', 3).pit(4).flat(8).put(12, 'k', 4); // 終盤考驗
l5.stairsUp(4).flat(6).put(12, 'o', 3).put(11, 'o', 3); // 慶祝金幣
l5.flat(10).put(12, 'D', 4);
writeFileSync(OUT('level-5'), l5.toString());

console.log('L1-L5 已輸出');

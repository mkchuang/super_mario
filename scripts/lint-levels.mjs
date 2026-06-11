// 關卡可玩性 lint：坑寬、實體支撐、P/D 唯一性
// 用法：node scripts/lint-levels.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = join(__dirname, 'levels');
const MAX_PIT = 4;
const SOLID = new Set(['#', '=']);
const NEED_SUPPORT = new Set(['o', 'g', 'G', 'k', 'P', 'D']);

let failed = false;

for (const file of readdirSync(LEVELS_DIR).filter((f) => f.endsWith('.txt'))) {
  const name = basename(file, '.txt');
  const rows = readFileSync(join(LEVELS_DIR, file), 'utf8')
    .split('\n')
    .filter((r) => r.length > 0 && !r.startsWith('//'));
  const width = Math.max(...rows.map((r) => r.length));
  const at = (x, y) => rows[y]?.[x] ?? '.';
  const errors = [];

  // P / D 唯一
  const count = (ch) => rows.join('').split(ch).length - 1;
  if (count('P') !== 1) errors.push(`P 數量 ${count('P')} ≠ 1`);
  if (count('D') !== 1) errors.push(`D 數量 ${count('D')} ≠ 1`);

  // 坑寬：整欄無 solid 的連續欄數
  let run = 0;
  for (let x = 0; x < width; x++) {
    let solid = false;
    for (let y = 0; y < 15; y++) if (SOLID.has(at(x, y))) solid = true;
    run = solid ? 0 : run + 1;
    if (run > MAX_PIT) {
      errors.push(`col ${x}: 坑寬 ${run} > ${MAX_PIT}`);
      run = 0; // 只報一次
    }
  }

  // 實體支撐：同欄下方需有 solid
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < width; x++) {
      const ch = at(x, y);
      if (!NEED_SUPPORT.has(ch)) continue;
      let supported = false;
      for (let yy = y + 1; yy < 15; yy++) if (SOLID.has(at(x, yy))) supported = true;
      if (!supported) errors.push(`'${ch}' at (${x},${y}) 下方無支撐`);
    }
  }

  if (errors.length) {
    failed = true;
    console.error(`✗ ${name}:`);
    errors.forEach((e) => console.error(`   ${e}`));
  } else {
    console.log(`✓ ${name} (${width}×15)`);
  }
}

process.exit(failed ? 1 : 0);

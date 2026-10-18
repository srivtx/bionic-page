#!/usr/bin/env node
/**
 * Generate the extension icons with zero dependencies.
 *
 * Draws the brand mark directly into RGBA pixel buffers and encodes them as
 * PNG (zlib + CRC32 are in the Node standard library). The motif is three
 * "words" where the leading part is bold white and the rest is the accent
 * colour — the product's idea rendered as an icon. Each pixel is averaged
 * from 6×6 samples, so the tile corners and the rounded line ends are smooth.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "..", "assets", "icons");

const INK = [0x14, 0x16, 0x1a];
const HEAD = [0xff, 0xff, 0xff];
const TAIL = [0x8b, 0x8c, 0xf7];

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// The mark on a 24-unit tile, shared with the wordmark's inline SVG in the
// popup, options and welcome pages: three lines of text, each a faded indigo
// capsule with its leading part in white on top.
const GRID = 24;
const TILE_RADIUS = 0.22 * GRID;
const STROKE = 1.8;
const ROWS_FULL = [
  { y: 7.56, head: 9.3, tail: 15.7 },
  { y: 12, head: 10.5, tail: 18.3 },
  { y: 16.44, head: 9.3, tail: 15.7 },
];
// Below 48px three lines blur together, so the small icons keep two.
const ROWS_SMALL = [
  { y: 9.78, head: 10.5, tail: 18.3 },
  { y: 14.22, head: 9.3, tail: 15.7 },
];
const START = 5.7;

function insideTile(px, py) {
  const r = TILE_RADIUS;
  const cx = Math.min(Math.max(px, r), GRID - r);
  const cy = Math.min(Math.max(py, r), GRID - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

/** Inside a horizontal capsule from x0 to x1 on line y. */
function inCapsule(px, py, x0, x1, y, half) {
  const cx = Math.min(Math.max(px, x0), x1);
  return (px - cx) ** 2 + (py - y) ** 2 <= half * half;
}

/** Colour of one point of the mark, in grid units; null outside the tile. */
function shade(px, py, rows, half) {
  if (!insideTile(px, py)) return null;
  for (const row of rows) {
    if (inCapsule(px, py, START, row.head, row.y, half)) return HEAD;
  }
  for (const row of rows) {
    if (inCapsule(px, py, START, row.tail, row.y, half)) return TAIL;
  }
  return INK;
}

function draw(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const unit = GRID / size;
  const rows = size >= 48 ? ROWS_FULL : ROWS_SMALL;
  // Thin strokes vanish at toolbar size, so the smallest icons draw them bolder.
  const half = (STROKE * (size <= 16 ? 1.35 : size <= 32 ? 1.15 : 1)) / 2;
  const samples = 6;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let covered = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const color = shade((x + (sx + 0.5) / samples) * unit, (y + (sy + 0.5) / samples) * unit, rows, half);
          if (!color) continue;
          covered += 1;
          r += color[0];
          g += color[1];
          b += color[2];
        }
      }
      if (covered === 0) continue;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / covered);
      rgba[i + 1] = Math.round(g / covered);
      rgba[i + 2] = Math.round(b / covered);
      rgba[i + 3] = Math.round((255 * covered) / (samples * samples));
    }
  }
  return rgba;
}

mkdirSync(OUT, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const png = encodePng(size, size, draw(size));
  const file = join(OUT, `icon${size}.png`);
  writeFileSync(file, png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}

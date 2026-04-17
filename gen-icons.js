const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++)
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t   = Buffer.from(type)
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcVal = crc32(Buffer.concat([t, data]))
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crcVal)
  return Buffer.concat([len, t, data, crc])
}

const GLYPHS = {
  A: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  P: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
}

function createIcon(size) {
  const bg = [59, 130, 246]
  const fg = [255, 255, 255]

  const pixels = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => [...bg, 255])
  )

  const scale  = Math.max(1, Math.floor(size / 24))
  const gW     = 5 * scale
  const gH     = 7 * scale
  const gap    = Math.floor(scale * 1.5)
  const totalW = gW * 2 + gap
  const startX = Math.floor((size - totalW) / 2)
  const startY = Math.floor((size - gH) / 2)

  function drawGlyph(glyph, ox, oy) {
    for (let gy = 0; gy < 7; gy++)
      for (let gx = 0; gx < 5; gx++) {
        if (!glyph[gy][gx]) continue
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++) {
            const px = ox + gx * scale + sx
            const py = oy + gy * scale + sy
            if (px >= 0 && px < size && py >= 0 && py < size)
              pixels[py][px] = [...fg, 255]
          }
      }
  }

  drawGlyph(GLYPHS.A, startX, startY)
  drawGlyph(GLYPHS.P, startX + gW + gap, startY)

  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i]   = pixels[y][x][0]
      raw[i+1] = pixels[y][x][1]
      raw[i+2] = pixels[y][x][2]
      raw[i+3] = pixels[y][x][3]
    }
  }

  const sig  = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const dir = path.join(__dirname, 'agentpulse/public/icons')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'icon-192x192.png'), createIcon(192))
fs.writeFileSync(path.join(dir, 'icon-512x512.png'), createIcon(512))
console.log('Icons generated OK')

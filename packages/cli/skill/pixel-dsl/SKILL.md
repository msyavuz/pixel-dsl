---
name: pixel-dsl
description: >-
  Author and render Pixel-DSL (.pix) sprites — a deterministic, LLM-friendly DSL
  for pixel art. Use when the user wants to create, edit, or render a sprite,
  icon, logo, tile, avatar, or any pixel-art image; when working with .pix files;
  or when they ask to "draw" or "make a sprite" with pixel-dsl. Covers the full
  grammar (palettes, sprites, cell grids, shape ops), the `pixel-dsl` CLI, and
  the @pixel-dsl/core library.
---

# Pixel-DSL

Pixel-DSL compiles a small text language to byte-identical PNG sprites. The same
source always renders the same pixels. The grammar is tiny on purpose — compose
sprites from **shape ops**, not raw cell grids.

Requires the CLI: `npm install -g @pixel-dsl/cli` (or run ad-hoc with
`npx @pixel-dsl/cli ...`). Check with `pixel-dsl --version`.

## Golden workflow: write → render → look → refine

Pixel art is visual. Do **not** trust the source in your head — render it and
actually view the PNG, then iterate. This is the single most important habit.

1. Write a `.pix` file.
2. Render it upscaled so it's visible, to a temp path:
   ```bash
   pixel-dsl build sprite.pix -o /tmp/preview.png --scale 24
   ```
3. **View `/tmp/preview.png`** (open/read the image) and check it against intent.
4. Fix coordinates/colors and repeat until it looks right.

Render to `/tmp` while iterating; write the PNG to its real destination only once
it looks correct.

## CLI

```bash
pixel-dsl build <input.pix> -o <output.png> [options]
```

| Flag | Meaning | Default |
|---|---|---|
| `-o, --output <path>` | output PNG (required) | — |
| `-s, --scale <n>` | nearest-neighbor upscale, positive integer | `1` |
| `--sprite <name>` | which sprite to render when a file has several | first |
| `-w, --watch` | rebuild on file change | off |

Exit codes: `0` ok, `1` compile/render error (diagnostic on stderr), `2` bad flag.

Diagnostics are stable and parseable — read them and self-correct:
```
foo.pix:3:11: error[palette.invalid_hex]: Invalid hex color `#abcde`.
  hint: Hex colors must have exactly 3, 4, 6, or 8 hex digits.
```

## Language

A program is any number of `palette` and `sprite` declarations, in any order.
`// ...` is a line comment.

### Palette

```pix
palette nes {
  black k #000000   // LONG  SHORT  #HEX
  white w #ffffff
  red   r #ff3030
}
```

- `SHORT` is the one-or-more-char token used in cells/ops (e.g. `k`).
- `#HEX` accepts `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa` (5- or 7-digit = error).
- Duplicate `SHORT` or `LONG` in one palette is an error.

### Sprite

```pix
sprite NAME WxH [palette=PNAME] {
  <body>
}
```

`palette=` is optional and defaults to the first declared palette. The body is
**either** a cell grid **or** shape ops — never both (mixing is an error).

### Body, option A: cell grid

Whitespace-separated cells; the count must equal `W*H`. Each cell is a palette
`SHORT`, an inline `#hex`, or `.` (transparent). An optional `/` between cells is
treated as a row separator and ignored.

```pix
sprite hero 4x4 palette=nes {
  k k k k
  k w w k
  k w r k
  k k k k
}
```

### Body, option B: shape ops (preferred)

Ops paint in order onto a fully transparent base; later ops overwrite earlier
ones; out-of-bounds coords are silently clipped. `V` is a value: `SHORT`, `#hex`,
or `.`.

| Op | Effect |
|---|---|
| `fill V` | set every pixel to V |
| `rect x0,y0 x1,y1 V` | filled rectangle, **inclusive** of both corners |
| `pixel x,y V` | single pixel |
| `line x0,y0 x1,y1 V` | 1px Bresenham line, any angle |
| `circle cx,cy r V` | filled disc of radius `r` |
| `flip h` / `flip v` | reflect the whole canvas (h: x→W-1-x, v: y→H-1-y) |

```pix
sprite hero 4x4 palette=nes {
  fill k
  rect 1,1 2,2 w
  pixel 2,2 r
}
```

Coordinates are 0-indexed; `(0,0)` is top-left, x→right, y→down.

## Key rules that trip people up

- **`flip` re-orients, it does not symmetrize.** It moves everything drawn so far
  to the mirrored side and leaves the original blank. For a symmetric sprite,
  draw both halves explicitly — centered `circle`/`rect` shapes are already
  symmetric. Use `flip` only to turn a *finished* drawing around.
- **`.` erases.** As an op value, `.` paints transparency, so `circle 8,8 4 .`
  punches a hole. Carve rings/holes by drawing a solid shape then a smaller `.`.
- **Order matters.** Later ops win. Background `fill` first, details last.
- **Transparency is the default.** The base is clear and output is RGBA, so
  `fill .` is optional — unpainted pixels stay see-through.
- **Alpha works in hex.** `#00000000` is clear; partial alpha tints what's below
  (`rect 0,0 15,15 #00000080` = 50% black wash).
- **Prefer ops over grids.** A 64×40 sprite is ~2560 fragile cell tokens vs ~70
  ops. Ops are far more reliable to write and edit.

## Worked example: a ring (carve with `.`)

```pix
sprite ring 16x16 {
  circle 8,8 7 #2a9d8f   // solid disc
  circle 8,8 4 .         // punch a transparent hole → a ring
}
```

```bash
pixel-dsl build ring.pix -o /tmp/ring.png --scale 16   # then view /tmp/ring.png
```

## Library (@pixel-dsl/core)

To compile sprites programmatically (Node or browser): `npm install @pixel-dsl/core`.

```ts
import { parse, render } from "@pixel-dsl/core";

const { ast, errors } = parse(source);
if (ast && errors.length === 0) {
  const png = render(ast, { scale: 16, spriteName: "hero" }); // Uint8Array PNG
}
```

`render(program, { scale?, spriteName? })` returns PNG bytes; `renderPixels(...)`
returns `{ width, height, data }` (raw RGBA). `scale` must be a positive integer.

## More

Full docs, grammar reference, and an example gallery: https://pixel-dsl.com

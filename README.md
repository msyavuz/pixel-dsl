<p align="center">
  <img src="docs/public/logo.png" alt="Pixel-DSL logo" width="128" height="128" style="image-rendering: pixelated;">
</p>

<h1 align="center">Pixel-DSL</h1>

A deterministic, LLM-friendly domain-specific language for pixel-art sprites. The same source always compiles to byte-identical PNG output, and the grammar is small enough to drop into an LLM system prompt.

> The logo itself is a Pixel-DSL sprite — see [`examples/logo.pix`](examples/logo.pix).

```pix
palette nes {
  black k #000000
  white w #ffffff
  red   r #ff3030
}

sprite flag 16x12 palette=nes {
  fill k
  circle 8,5 3 w
  pixel 7,5 k
  pixel 9,5 k
  rect 6,7 9,7 w
  line 4,9 11,11 w
  flip h
}
```

## Why

- **Deterministic** — identical source → identical pixels, every time.
- **LLM-friendly** — compact shape ops (`fill`, `rect`, `line`, `circle`, `pixel`, `flip`) compose reliably where raw cell grids drift on token alignment.
- **Minimal stack** — one TypeScript codebase, runs in Node (CLI) and the browser (playground).

## Packages

| Package | Description |
|---|---|
| [`@pixel-dsl/core`](packages/core) | Parser + deterministic PNG renderer |
| [`@pixel-dsl/cli`](packages/cli) | `pixel-dsl` command-line compiler |

## Install

```bash
npm install -g @pixel-dsl/cli
pixel-dsl build hero.pix -o hero.png --scale 16
```

Or use the renderer programmatically:

```bash
npm install @pixel-dsl/core
```

```ts
import { parse, render } from "@pixel-dsl/core";

const { ast, errors } = parse(source);
if (ast) {
  const png = render(ast, { scale: 16 }); // Uint8Array of PNG bytes
}
```

## Development

This is a pnpm monorepo.

```bash
pnpm install
pnpm build       # build all packages
pnpm test        # run the test suites
pnpm typecheck
pnpm lint && pnpm format
pnpm dev:playground   # local playground
pnpm dev:docs         # local docs site
```

## Documentation

Full grammar, shape-op reference, and CLI usage live in the [docs](docs/). See [`docs/guide/grammar.md`](docs/guide/grammar.md) for the complete language surface.

## License

ISC — see [LICENSE](LICENSE).

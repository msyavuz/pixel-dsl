# @pixel-dsl/cli

Command-line compiler for [Pixel-DSL](https://github.com/msyavuz/pixel-dsl). Turns `.pix` sources into PNG sprites.

## Install

```bash
npm install -g @pixel-dsl/cli
```

## Usage

```bash
pixel-dsl build <input.pix> -o <output.png> [options]
```

### Options

| Flag | Description | Default |
|---|---|---|
| `-o, --output <path>` | output PNG path (required) | — |
| `-s, --scale <n>` | nearest-neighbor upscale factor (positive integer) | `1` |
| `--sprite <name>` | sprite to render when the file declares multiple | first sprite |
| `-w, --watch` | rebuild whenever the input file changes (runs until interrupted) | off |

### Examples

```bash
pixel-dsl build hero.pix -o hero.png --scale 16
pixel-dsl build sheet.pix --sprite enemy -o enemy.png --scale 4
pixel-dsl build hero.pix -o hero.png --scale 16 --watch
```

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success — PNG written |
| `1` | Compile/render error — diagnostic on stderr |
| `2` | Bad CLI flag |

### Diagnostic format

```
<file>:<line>:<col>: <severity>[<code>]: <message>
  hint: <optional hint>
```

This format is stable and safe to parse from scripts.

## Claude Code skill

The package bundles a [Claude Code](https://claude.com/claude-code) skill that
teaches Claude the grammar, shape ops, and CLI so it can author sprites for you.
Install it into `~/.claude/skills`:

```bash
pixel-dsl skill install          # → ~/.claude/skills/pixel-dsl/SKILL.md
pixel-dsl skill install --force  # overwrite an existing copy
pixel-dsl skill install --dir ./.claude/skills   # project-local instead
pixel-dsl skill print            # write the skill to stdout
```

Then ask Claude to "make a pixel-art sprite with pixel-dsl" and it'll use the skill.

## License

ISC

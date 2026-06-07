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

## Agent skill

The package bundles a skill that teaches a coding agent the grammar, shape ops,
and CLI so it can author sprites for you. Install it for a specific target:

```bash
pixel-dsl skill install                  # claude  → ~/.claude/skills/pixel-dsl/SKILL.md
pixel-dsl skill install agents           # agents  → ~/.codex/AGENTS.md (managed block)
pixel-dsl skill install --force          # overwrite an existing Claude copy
pixel-dsl skill install --dir ./.claude/skills   # project-local Claude install
pixel-dsl skill install agents --dir .   # AGENTS.md in the current project
pixel-dsl skill print [target]           # write the rendered skill to stdout
```

Targets:

- **`claude`** ([Claude Code](https://claude.com/claude-code), default) — copies
  `SKILL.md` (frontmatter + body); refuses to overwrite without `--force`.
- **`agents`** ([AGENTS.md](https://agents.md), read by Codex and others) —
  upserts a delimited, re-runnable managed block, leaving the rest of a shared
  `AGENTS.md` untouched.

Then ask your agent to "make a pixel-art sprite with pixel-dsl" and it'll use the skill.

## License

ISC

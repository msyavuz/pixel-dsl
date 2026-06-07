# @pixel-dsl/cli

## 0.3.0

### Minor Changes

- [#11](https://github.com/msyavuz/pixel-dsl/pull/11) [`033a29e`](https://github.com/msyavuz/pixel-dsl/commit/033a29eb1e9147d388fd69adbe682208b78f1c04) Thanks [@msyavuz](https://github.com/msyavuz)! - Generalize `pixel-dsl skill install` to multiple agentic tools via a target argument. `skill install` (or `skill install claude`) keeps copying the Claude Code skill into `~/.claude/skills/pixel-dsl/SKILL.md`, while `skill install agents` upserts a delimited, re-runnable managed block (no frontmatter) into a global `AGENTS.md` (`~/.codex/AGENTS.md`, or `--dir .` for a project) without clobbering existing content. `skill print [target]` renders the bundled skill for either target.

## 0.2.0

### Minor Changes

- [#7](https://github.com/msyavuz/pixel-dsl/pull/7) [`02c0d28`](https://github.com/msyavuz/pixel-dsl/commit/02c0d28be763e9b2fa8ad886c7a4ba0bba9deb98) Thanks [@msyavuz](https://github.com/msyavuz)! - Bundle a Claude Code skill and add a `pixel-dsl skill` command. `pixel-dsl skill install` copies the skill into `~/.claude/skills/pixel-dsl/` (with `--dir` and `--force`), and `pixel-dsl skill print` writes it to stdout — so Claude Code can author `.pix` sprites using the full grammar, shape ops, and CLI.

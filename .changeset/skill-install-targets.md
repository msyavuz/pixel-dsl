---
"@pixel-dsl/cli": minor
---

Generalize `pixel-dsl skill install` to multiple agentic tools via a target argument. `skill install` (or `skill install claude`) keeps copying the Claude Code skill into `~/.claude/skills/pixel-dsl/SKILL.md`, while `skill install agents` upserts a delimited, re-runnable managed block (no frontmatter) into a global `AGENTS.md` (`~/.codex/AGENTS.md`, or `--dir .` for a project) without clobbering existing content. `skill print [target]` renders the bundled skill for either target.

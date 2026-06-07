<!-- Keep it tight: every section gets a real answer, one line per box. -->

## What & why
<!-- One or two sentences: what changes, and why. -->

## Type of change
- [ ] Feature
- [ ] Bug fix
- [ ] Docs
- [ ] Refactor / chore
- [ ] Breaking change (grammar, CLI flags, or output bytes)

## Affected packages
- [ ] core (parser/renderer)
- [ ] cli
- [ ] lsp
- [ ] docs
- [ ] playground

## Checklist
- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint && pnpm format` clean
- [ ] Determinism preserved (same source → byte-identical PNG), or snapshot changes are intentional and reviewed
- [ ] Grammar / shape-op changes reflected in `docs/guide/`
- [ ] Examples re-rendered if a sprite or op changed (`scripts/render-examples.sh`)

## Screenshots / output
<!-- Visual changes: drop before/after PNGs. Delete if N/A. -->

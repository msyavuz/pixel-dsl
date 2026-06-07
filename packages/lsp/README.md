# @pixel-dsl/lsp

Language server for [Pixel-DSL](https://github.com/msyavuz/pixel-dsl). It reuses the `@pixel-dsl/core` parser to provide:

- **Diagnostics** — parse, lex, and semantic (render-time) errors as you type, with `line:col` ranges and hints. Catches unknown palette shorts, cell-count mismatches, bad `flip` axes, and more.
- **Hover** — documentation for keywords and shape ops (`palette`, `sprite`, `fill`, `rect`, `pixel`, `line`, `circle`, `flip`).
- **Completion** — op keywords plus the palette shorts declared in the current document.
- **Format** — full-document format via `@pixel-dsl/core` `formatSource` (preserves `//` comments).

## Install

```bash
npm install -g @pixel-dsl/lsp
```

This exposes the `pixel-dsl-lsp` binary, which speaks the Language Server Protocol over stdio.

## Editor setup

Point your editor's LSP client at `pixel-dsl-lsp --stdio` for `.pix` files.

### Neovim (nvim-lspconfig style)

```lua
vim.lsp.start({
  name = "pixel-dsl",
  cmd = { "pixel-dsl-lsp", "--stdio" },
  filetypes = { "pix" },
  root_dir = vim.fn.getcwd(),
})
```

### Generic

Any client that launches a stdio language server works — run `pixel-dsl-lsp --stdio` and associate it with the `pix` language id.

## License

ISC

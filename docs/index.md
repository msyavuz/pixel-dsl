---
layout: home
hero:
  name: "Pixel-DSL"
  tagline: "A deterministic, LLM-friendly DSL for pixel art sprites."
  image:
    src: /logo.png
    alt: Pixel-DSL logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Grammar reference
      link: /guide/grammar
features:
  - title: Deterministic
    details: Same source compiles to the same pixels every time. Diffable, version-controllable sprites.
  - title: LLM-friendly
    details: Compact grammar that fits in a system prompt. Shape ops (rect, line, circle, fill, pixel) let an LLM describe a sprite without enumerating cells.
  - title: Minimal stack
    details: One TypeScript codebase, runs in Node (CLI) or the browser (playground). ISC licensed.
---

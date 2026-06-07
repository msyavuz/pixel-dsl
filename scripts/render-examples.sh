#!/usr/bin/env bash
# Render every examples/*.pix sprite to a PNG for the docs gallery.
# Uses the globally-installed `pixel-dsl` CLI. Output lands in docs/public/sprites/
# and is served at /sprites/<name>.png by VitePress.
#
# Scales are picked so each PNG is display-ready (~190-290px) and shown 1:1.
#
# Usage: scripts/render-examples.sh
set -euo pipefail

cd "$(dirname "$0")/.."
out="docs/public/sprites"
rm -rf "$out"
mkdir -p "$out"

# name:scale
renders=(
  "flag-ops:12"
  "heart:12"
  "coin:12"
  "potion:12"
  "mushroom:10"
  "tree:6"
  "cat:6"
  "spider:6"
  "pirate-skull:6"
  "kraken:3"
  "pirate-galleon:3"
)

for entry in "${renders[@]}"; do
  name="${entry%%:*}"
  scale="${entry##*:}"
  pixel-dsl build "examples/${name}.pix" -o "${out}/${name}.png" -s "${scale}"
  echo "rendered ${name} (scale ${scale}) -> ${out}/${name}.png"
done

# Project logo (used by the docs favicon/nav/hero, the README, and the
# playground favicon) — also a Pixel-DSL sprite, rendered from examples/logo.pix.
pixel-dsl build examples/logo.pix -o docs/public/logo.png -s 16
pixel-dsl build examples/logo.pix -o docs/public/favicon.png -s 2
cp docs/public/logo.png apps/playground/public/logo.png
echo "rendered logo -> docs/public/{logo,favicon}.png + apps/playground/public/logo.png"

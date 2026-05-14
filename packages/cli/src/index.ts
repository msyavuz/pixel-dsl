#!/usr/bin/env node
import { Command } from "commander";
import { runBuild } from "./build.js";

const program = new Command();

program
	.name("pixel-dsl")
	.description("Compile Pixel-DSL sources to PNG sprites.")
	.version("0.0.0");

program
	.command("build")
	.description("Compile a .pix file to a PNG.")
	.argument("<input>", "input .pix file")
	.requiredOption("-o, --output <path>", "output PNG path")
	.option("-s, --scale <n>", "upscale factor (positive integer)", "1")
	.option("--sprite <name>", "sprite name to render (defaults to first)")
	.action(
		(
			input: string,
			opts: { output: string; scale: string; sprite?: string },
		) => {
			const scale = Number.parseInt(opts.scale, 10);
			if (!Number.isInteger(scale) || scale < 1) {
				process.stderr.write(
					`error: --scale must be a positive integer (got ${opts.scale})\n`,
				);
				process.exit(2);
			}
			const { ok } = runBuild({
				input,
				output: opts.output,
				scale,
				sprite: opts.sprite,
			});
			process.exit(ok ? 0 : 1);
		},
	);

program.parse();

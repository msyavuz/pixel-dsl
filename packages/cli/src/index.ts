#!/usr/bin/env node
import { readFileSync, watch } from "node:fs";
import { Command } from "commander";
import { type BuildArgs, runBuild } from "./build.js";
import { defaultSkillsDir, installSkill, readBundledSkill } from "./skill.js";

const pkg = JSON.parse(
	readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

const program = new Command();

program
	.name("pixel-dsl")
	.description("Compile Pixel-DSL sources to PNG sprites.")
	.version(pkg.version);

program
	.command("build")
	.description("Compile a .pix file to a PNG.")
	.argument("<input>", "input .pix file")
	.requiredOption("-o, --output <path>", "output PNG path")
	.option("-s, --scale <n>", "upscale factor (positive integer)", "1")
	.option("--sprite <name>", "sprite name to render (defaults to first)")
	.option("-w, --watch", "rebuild whenever the input file changes")
	.action(
		(
			input: string,
			opts: {
				output: string;
				scale: string;
				sprite?: string;
				watch?: boolean;
			},
		) => {
			const scale = Number.parseInt(opts.scale, 10);
			if (!Number.isInteger(scale) || scale < 1) {
				process.stderr.write(
					`error: --scale must be a positive integer (got ${opts.scale})\n`,
				);
				process.exit(2);
			}
			const args: BuildArgs = {
				input,
				output: opts.output,
				scale,
				sprite: opts.sprite,
			};
			if (opts.watch) {
				runWatch(args);
				return;
			}
			const { ok } = runBuild(args);
			process.exit(ok ? 0 : 1);
		},
	);

const skill = program
	.command("skill")
	.description("Manage the Pixel-DSL skill for Claude Code.");

skill
	.command("install")
	.description("Install the Pixel-DSL skill so Claude Code can author sprites.")
	.option(
		"--dir <path>",
		`skills directory to install into (default: ${defaultSkillsDir()})`,
	)
	.option("-f, --force", "overwrite an existing install")
	.action((opts: { dir?: string; force?: boolean }) => {
		const res = installSkill({ dir: opts.dir, force: opts.force });
		if (!res.installed && res.reason === "exists") {
			process.stderr.write(
				`pixel-dsl: skill already installed at ${res.dest} (use --force to overwrite)\n`,
			);
			process.exit(0);
		}
		process.stdout.write(`pixel-dsl: installed skill -> ${res.dest}\n`);
		process.exit(0);
	});

skill
	.command("print")
	.description("Print the bundled skill to stdout.")
	.action(() => {
		process.stdout.write(readBundledSkill());
		process.exit(0);
	});

function runWatch(args: BuildArgs): void {
	const rebuild = () => {
		try {
			const { ok } = runBuild(args);
			if (ok) process.stderr.write(`pixel-dsl: wrote ${args.output}\n`);
		} catch (e) {
			process.stderr.write(`pixel-dsl: ${(e as Error).message}\n`);
		}
	};
	rebuild();
	let timer: ReturnType<typeof setTimeout> | null = null;
	watch(args.input, () => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(rebuild, 50);
	});
	process.stderr.write(`pixel-dsl: watching ${args.input} (ctrl-c to stop)\n`);
}

program.parse();

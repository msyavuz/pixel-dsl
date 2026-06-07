#!/usr/bin/env node
import { readFileSync, watch } from "node:fs";
import { Command } from "commander";
import { type BuildArgs, runBuild } from "./build.js";
import {
	installSkill,
	readBundledSkill,
	resolveTarget,
	TARGETS,
} from "./skill.js";

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

const targetList = Object.values(TARGETS)
	.map((t) => `${t.id} (${t.label})`)
	.join(", ");

const skill = program
	.command("skill")
	.description("Manage the Pixel-DSL skill for coding agents.");

skill
	.command("install")
	.description(
		"Install the Pixel-DSL skill so a coding agent can author sprites.",
	)
	.argument("[target]", `agentic tool to install for: ${targetList}`, "claude")
	.option(
		"--dir <path>",
		"base directory to install into (default: the target's home location)",
	)
	.option(
		"-f, --force",
		"overwrite an existing install (file-mode targets only)",
	)
	.action((targetId: string, opts: { dir?: string; force?: boolean }) => {
		const target = resolveTarget(targetId);
		if (!target) {
			process.stderr.write(
				`pixel-dsl: unknown target '${targetId}' (expected one of: ${Object.keys(TARGETS).join(", ")})\n`,
			);
			process.exit(2);
		}
		const res = installSkill({
			target: target.id,
			dir: opts.dir,
			force: opts.force,
		});
		if (!res.installed && res.reason === "exists") {
			process.stderr.write(
				`pixel-dsl: skill already installed at ${res.dest} (use --force to overwrite)\n`,
			);
			process.exit(0);
		}
		process.stdout.write(
			`pixel-dsl: ${res.action} ${target.label} skill -> ${res.dest}\n`,
		);
		process.exit(0);
	});

skill
	.command("print")
	.description("Print the bundled skill (rendered for a target) to stdout.")
	.argument("[target]", `target to render for: ${targetList}`, "claude")
	.action((targetId: string) => {
		const target = resolveTarget(targetId);
		if (!target) {
			process.stderr.write(
				`pixel-dsl: unknown target '${targetId}' (expected one of: ${Object.keys(TARGETS).join(", ")})\n`,
			);
			process.exit(2);
		}
		process.stdout.write(target.render(readBundledSkill()));
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

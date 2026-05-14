import { readFileSync, writeFileSync } from "node:fs";
import { type Diagnostic, parse, RenderError, render } from "@pixel-dsl/core";
import { formatDiagnostics } from "./format.js";

export interface CompileOpts {
	scale?: number;
	spriteName?: string;
}

export interface CompileResult {
	bytes?: Uint8Array;
	errors: Diagnostic[];
}

export function compile(source: string, opts: CompileOpts = {}): CompileResult {
	const { ast, errors } = parse(source);
	if (!ast || errors.length > 0) {
		return { errors };
	}
	try {
		const bytes = render(ast, {
			scale: opts.scale,
			spriteName: opts.spriteName,
		});
		return { bytes, errors: [] };
	} catch (e) {
		if (e instanceof RenderError) {
			return { errors: [e.diagnostic] };
		}
		throw e;
	}
}

export interface BuildArgs {
	input: string;
	output: string;
	scale?: number;
	sprite?: string;
}

export interface BuildOutcome {
	ok: boolean;
	errors: Diagnostic[];
}

export function runBuild(args: BuildArgs): BuildOutcome {
	const source = readFileSync(args.input, "utf8");
	const { bytes, errors } = compile(source, {
		scale: args.scale,
		spriteName: args.sprite,
	});
	if (!bytes) {
		process.stderr.write(`${formatDiagnostics(errors, args.input)}\n`);
		return { ok: false, errors };
	}
	writeFileSync(args.output, Buffer.from(bytes));
	return { ok: true, errors: [] };
}

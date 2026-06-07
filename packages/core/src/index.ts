import type { Program } from "./ast.js";
import {
	type Diagnostic,
	lexingErrorToDiagnostic,
	parsingErrorToDiagnostic,
} from "./errors.js";
import { parserInstance } from "./parser.js";
import { PixelLexer } from "./tokens.js";
import { astBuilder } from "./visitor.js";

export function parse(source: string): {
	ast: Program | null;
	errors: Diagnostic[];
} {
	const lex = PixelLexer.tokenize(source);
	const errors: Diagnostic[] = lex.errors.map(lexingErrorToDiagnostic);

	parserInstance.input = lex.tokens;
	const cst = parserInstance.program();
	const lastTok = lex.tokens[lex.tokens.length - 1];
	errors.push(
		...parserInstance.errors.map((e) => parsingErrorToDiagnostic(e, lastTok)),
	);

	if (parserInstance.errors.length > 0) {
		return { ast: null, errors };
	}

	try {
		const ast = astBuilder.visit(cst) as Program;
		return { ast, errors };
	} catch {
		return { ast: null, errors };
	}
}

export type * from "./ast.js";
export type { Diagnostic } from "./errors.js";
export { formatSource } from "./format-source.js";
export {
	parseHex,
	type ResolvedPalette,
	type Rgba,
	resolvePalette,
	resolveProgramPalettes,
} from "./palette.js";
export {
	RenderError,
	type RenderedImage,
	type RenderOpts,
	render,
	renderPixels,
} from "./render.js";

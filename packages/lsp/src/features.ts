import {
	type Diagnostic as CoreDiagnostic,
	formatSource,
	parse,
	RenderError,
	renderPixels,
} from "@pixel-dsl/core";
import {
	type CompletionItem,
	CompletionItemKind,
	type Diagnostic,
	DiagnosticSeverity,
	type Hover,
	type Position,
	type Range,
	type TextEdit,
} from "vscode-languageserver";

/** Markdown docs for every keyword, shown on hover and in completion. */
export const KEYWORD_DOCS: Record<string, string> = {
	palette:
		"`palette NAME { LONG SHORT #HEX ... }` — declare a named color table.",
	sprite:
		"`sprite NAME WxH [palette=NAME] { ... }` — declare a sprite as a cell grid **or** a sequence of shape ops.",
	fill: "`fill V` — set every pixel to value `V`.",
	rect: "`rect x0,y0 x1,y1 V` — filled rectangle, inclusive of both corners.",
	pixel: "`pixel x,y V` — set a single pixel.",
	line: "`line x0,y0 x1,y1 V` — Bresenham line, 1px thick.",
	circle: "`circle cx,cy r V` — filled disc of radius `r`.",
	flip: "`flip h` / `flip v` — mirror everything drawn so far, left↔right (`h`) or top↔bottom (`v`).",
};

const TOP_KEYWORDS = ["palette", "sprite"];
const OP_KEYWORDS = ["fill", "rect", "pixel", "line", "circle", "flip"];

function lineOf(text: string, line: number): string {
	return text.split(/\r?\n/)[line] ?? "";
}

/** Core locations are 1-based points; widen to the token for a useful range. */
function toRange(text: string, loc: { line: number; col: number }): Range {
	const line = Math.max(0, loc.line - 1);
	const character = Math.max(0, loc.col - 1);
	const rest = lineOf(text, line).slice(character);
	const match = rest.match(/^\S+/);
	const length = match ? match[0].length : 1;
	return {
		start: { line, character },
		end: { line, character: character + length },
	};
}

function severityOf(s: CoreDiagnostic["severity"]): DiagnosticSeverity {
	return s === "warning"
		? DiagnosticSeverity.Warning
		: DiagnosticSeverity.Error;
}

function toDiagnostic(text: string, d: CoreDiagnostic): Diagnostic {
	return {
		range: toRange(text, d.loc),
		severity: severityOf(d.severity),
		code: d.code,
		source: "pixel-dsl",
		message: d.hint ? `${d.message}\n${d.hint}` : d.message,
	};
}

const keyOf = (d: Diagnostic) =>
	`${d.code}:${d.range.start.line}:${d.range.start.character}`;

/**
 * Parse diagnostics plus semantic (render-time) diagnostics. Each sprite is
 * rendered so errors like unknown palette refs, cell-count mismatches, and bad
 * flip axes surface without running the CLI.
 */
export function computeDiagnostics(text: string): Diagnostic[] {
	const { ast, errors } = parse(text);
	const out = errors.map((e) => toDiagnostic(text, e));
	if (!ast) return out;

	const seen = new Set(out.map(keyOf));
	for (const sprite of ast.sprites) {
		try {
			renderPixels(ast, { spriteName: sprite.name });
		} catch (e) {
			if (!(e instanceof RenderError)) throw e;
			const diag = toDiagnostic(text, e.diagnostic);
			if (!seen.has(keyOf(diag))) {
				seen.add(keyOf(diag));
				out.push(diag);
			}
		}
	}
	return out;
}

function wordAt(
	text: string,
	pos: Position,
): { word: string; start: number } | null {
	const lineText = lineOf(text, pos.line);
	const before = lineText
		.slice(0, pos.character)
		.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
	const after = lineText.slice(pos.character).match(/^[a-zA-Z0-9_]*/);
	const word = (before?.[0] ?? "") + (after?.[0] ?? "");
	if (!word) return null;
	return { word, start: pos.character - (before?.[0].length ?? 0) };
}

/** Hover docs for keywords under the cursor. */
export function computeHover(text: string, pos: Position): Hover | null {
	const found = wordAt(text, pos);
	if (!found) return null;
	const doc = KEYWORD_DOCS[found.word];
	if (!doc) return null;
	return { contents: { kind: "markdown", value: doc } };
}

interface ShortEntry {
	short: string;
	long: string;
	hex: string;
}

function paletteShorts(text: string): ShortEntry[] {
	const { ast } = parse(text);
	if (!ast) return [];
	const out: ShortEntry[] = [];
	for (const palette of ast.palettes) {
		for (const entry of palette.entries) {
			out.push({ short: entry.short, long: entry.long, hex: entry.hex });
		}
	}
	return out;
}

/** Completion: every keyword plus the palette shorts declared in the document. */
export function computeCompletions(
	text: string,
	_pos: Position,
): CompletionItem[] {
	const items: CompletionItem[] = [];
	for (const kw of [...TOP_KEYWORDS, ...OP_KEYWORDS]) {
		items.push({
			label: kw,
			kind: CompletionItemKind.Keyword,
			documentation: { kind: "markdown", value: KEYWORD_DOCS[kw] },
		});
	}
	for (const entry of paletteShorts(text)) {
		items.push({
			label: entry.short,
			kind: CompletionItemKind.Color,
			detail: `${entry.long} ${entry.hex}`,
			documentation: `Palette color \`${entry.short}\` → ${entry.hex}`,
		});
	}
	return items;
}

/** Full-document format via @pixel-dsl/core formatSource. */
export function formatDocument(text: string): TextEdit[] | null {
	const formatted = formatSource(text);
	if (formatted === null || formatted === text) return null;
	const lines = text.split(/\r?\n/);
	const endLine = Math.max(0, lines.length - 1);
	const endChar = lines[endLine]?.length ?? 0;
	return [
		{
			range: {
				start: { line: 0, character: 0 },
				end: { line: endLine, character: endChar },
			},
			newText: formatted,
		},
	];
}

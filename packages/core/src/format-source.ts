import type {
	Cell,
	OpValue,
	PaletteDecl,
	PaletteEntry,
	Program,
	SpriteDecl,
	SpriteOp,
} from "./ast.js";
import { parse } from "./index.js";

const INDENT = "  ";

function formatValue(v: OpValue | Cell): string {
	switch (v.type) {
		case "PaletteRef":
			return v.name;
		case "HexValue":
			return v.hex;
		case "TransparentCell":
			return ".";
	}
}

function formatOp(op: SpriteOp): string {
	switch (op.type) {
		case "FillOp":
			return `fill ${formatValue(op.value)}`;
		case "RectOp":
			return `rect ${op.x0},${op.y0} ${op.x1},${op.y1} ${formatValue(op.value)}`;
		case "PixelOp":
			return `pixel ${op.x},${op.y} ${formatValue(op.value)}`;
		case "LineOp":
			return `line ${op.x0},${op.y0} ${op.x1},${op.y1} ${formatValue(op.value)}`;
		case "CircleOp":
			return `circle ${op.cx},${op.cy} ${op.r} ${formatValue(op.value)}`;
		case "FlipOp":
			return `flip ${op.axis}`;
	}
}

function normalizeSpaces(s: string): string {
	return s.trim().replace(/\s+/g, " ");
}

function opLineMatches(op: SpriteOp, code: string): boolean {
	return normalizeSpaces(code) === normalizeSpaces(formatOp(op));
}

function paletteEntryLineMatches(entry: PaletteEntry, code: string): boolean {
	return (
		normalizeSpaces(code) ===
		normalizeSpaces(`${entry.long} ${entry.short} ${entry.hex}`)
	);
}

function splitTrailingComment(line: string): {
	code: string;
	trailing?: string;
} {
	const idx = line.indexOf("//");
	if (idx === -1) return { code: line };
	return {
		code: line.slice(0, idx),
		trailing: line.slice(idx).trimEnd(),
	};
}

function isCommentOnlyLine(line: string): boolean {
	return /^\s*\/\//.test(line);
}

function sourceLines(source: string): string[] {
	return source.split(/\r?\n/);
}

/** Lines inside the `{ ... }` block starting at a declaration line (1-based). */
function extractBraceBodyLines(
	source: string,
	declStartLine: number,
): string[] {
	const lines = sourceLines(source);
	let depth = 0;
	const body: string[] = [];
	let started = false;

	for (let i = declStartLine - 1; i < lines.length; i++) {
		const line = lines[i];
		for (const ch of line) {
			if (ch === "{") {
				depth++;
				started = true;
			} else if (ch === "}") {
				depth--;
			}
		}
		// Skip the declaration line that contains the opening `{`.
		if (started && depth > 0 && i > declStartLine - 1) {
			body.push(line);
		}
		if (started && depth === 0) {
			break;
		}
	}
	return body;
}

/** 1-based line number of the closing `}` for a declaration block. */
function findBlockEndLine(source: string, declStartLine: number): number {
	const lines = sourceLines(source);
	let depth = 0;
	let started = false;

	for (let i = declStartLine - 1; i < lines.length; i++) {
		for (const ch of lines[i]) {
			if (ch === "{") {
				depth++;
				started = true;
			} else if (ch === "}") {
				depth--;
			}
		}
		if (started && depth === 0) {
			return i + 1;
		}
	}
	return lines.length;
}

function preserveCommentLine(line: string, indent = INDENT): string {
	const m = line.match(/^(\s*)\/\/(.*)$/);
	if (!m) return line.trimEnd();
	return `${indent}//${m[2]}`;
}

interface CommentedItem {
	leadingComments: string[];
	trailingComment?: string;
}

interface ExtractedItems {
	items: CommentedItem[];
	tailComments: string[];
}

function extractCommentedItems(
	bodyLines: string[],
	matchLine: (index: number, code: string) => boolean,
	count: number,
): ExtractedItems | null {
	const items: CommentedItem[] = Array.from({ length: count }, () => ({
		leadingComments: [],
	}));
	let itemIdx = 0;
	const pendingComments: string[] = [];
	const tailComments: string[] = [];

	for (const line of bodyLines) {
		if (!line.trim()) continue;

		if (isCommentOnlyLine(line)) {
			if (itemIdx >= count) {
				tailComments.push(preserveCommentLine(line));
			} else {
				pendingComments.push(preserveCommentLine(line));
			}
			continue;
		}

		if (itemIdx >= count) return null;

		const { code, trailing } = splitTrailingComment(line);
		if (!matchLine(itemIdx, code)) return null;

		items[itemIdx].leadingComments = pendingComments.splice(0);
		items[itemIdx].trailingComment = trailing;
		itemIdx++;
	}

	if (itemIdx !== count) return null;

	return { items, tailComments };
}

function emitCommentedLines(
	lines: string[],
	items: CommentedItem[],
	tailComments: string[],
	formatLine: (index: number) => string,
): void {
	for (let i = 0; i < items.length; i++) {
		for (const c of items[i].leadingComments) {
			lines.push(c);
		}
		let line = formatLine(i);
		if (items[i].trailingComment) {
			line += ` ${items[i].trailingComment}`;
		}
		lines.push(line);
	}
	for (const c of tailComments) {
		lines.push(c);
	}
}

function formatPalettePlain(p: PaletteDecl): string {
	const maxLong = Math.max(...p.entries.map((e) => e.long.length), 0);
	const lines = p.entries.map((e) => {
		const padded = e.long.padEnd(maxLong);
		return `${INDENT}${padded} ${e.short} ${e.hex}`;
	});
	return `palette ${p.name} {\n${lines.join("\n")}\n}`;
}

function formatPaletteWithComments(
	p: PaletteDecl,
	source: string,
): string | null {
	const bodyLines = extractBraceBodyLines(source, p.loc.line);
	const hasComments = bodyLines.some(isCommentOnlyLine);
	if (!hasComments) return formatPalettePlain(p);

	const maxLong = Math.max(...p.entries.map((e) => e.long.length), 0);
	const parsed = extractCommentedItems(
		bodyLines,
		(i, code) => paletteEntryLineMatches(p.entries[i], code),
		p.entries.length,
	);
	if (!parsed) return null;

	const lines: string[] = [];
	emitCommentedLines(lines, parsed.items, parsed.tailComments, (i) => {
		const e = p.entries[i];
		const padded = e.long.padEnd(maxLong);
		return `${INDENT}${padded} ${e.short} ${e.hex}`;
	});

	return `palette ${p.name} {\n${lines.join("\n")}\n}`;
}

function formatOpsBody(sprite: SpriteDecl, source: string): string | null {
	const bodyLines = extractBraceBodyLines(source, sprite.loc.line);
	const parsed = extractCommentedItems(
		bodyLines,
		(i, code) => opLineMatches(sprite.ops[i], code),
		sprite.ops.length,
	);
	if (!parsed) return null;

	const lines: string[] = [];
	emitCommentedLines(
		lines,
		parsed.items,
		parsed.tailComments,
		(i) => `${INDENT}${formatOp(sprite.ops[i])}`,
	);

	return lines.join("\n");
}

function formatGridBodyPlain(sprite: SpriteDecl): string {
	const cells = sprite.cells.map(formatValue);
	const rows: string[] = [];
	for (let i = 0; i < cells.length; i += sprite.width) {
		rows.push(`${INDENT}${cells.slice(i, i + sprite.width).join(" ")}`);
	}
	return rows.join(" /\n");
}

function formatGridBodyWithComments(
	sprite: SpriteDecl,
	source: string,
): string | null {
	const bodyLines = extractBraceBodyLines(source, sprite.loc.line);
	const gridRows: string[] = [];
	for (let i = 0; i < sprite.cells.length; i += sprite.width) {
		gridRows.push(
			`${INDENT}${sprite.cells
				.slice(i, i + sprite.width)
				.map(formatValue)
				.join(" ")}`,
		);
	}

	const lines: string[] = [];
	let cellRow = 0;

	for (const line of bodyLines) {
		if (!line.trim()) continue;
		if (isCommentOnlyLine(line)) {
			lines.push(preserveCommentLine(line));
			continue;
		}
		if (cellRow >= gridRows.length) return null;
		lines.push(gridRows[cellRow]);
		cellRow++;
	}

	if (cellRow !== gridRows.length) return null;

	return lines.join(" /\n");
}

function formatSpriteBodyPlain(sprite: SpriteDecl): string {
	if (sprite.ops.length > 0) {
		return sprite.ops.map((op) => `${INDENT}${formatOp(op)}`).join("\n");
	}
	return formatGridBodyPlain(sprite);
}

function formatSpriteBodyWithComments(
	sprite: SpriteDecl,
	source: string,
): string | null {
	if (sprite.ops.length > 0) {
		return formatOpsBody(sprite, source);
	}
	const bodyLines = extractBraceBodyLines(source, sprite.loc.line);
	if (!bodyLines.some(isCommentOnlyLine)) {
		return formatGridBodyPlain(sprite);
	}
	return formatGridBodyWithComments(sprite, source);
}

function formatSpritePlain(s: SpriteDecl): string {
	const dims = `${s.width}x${s.height}`;
	const header = s.palette
		? `sprite ${s.name} ${dims} palette=${s.palette}`
		: `sprite ${s.name} ${dims}`;
	return `${header} {\n${formatSpriteBodyPlain(s)}\n}`;
}

function formatSpriteWithComments(
	s: SpriteDecl,
	source: string,
): string | null {
	const dims = `${s.width}x${s.height}`;
	const header = s.palette
		? `sprite ${s.name} ${dims} palette=${s.palette}`
		: `sprite ${s.name} ${dims}`;
	const body = formatSpriteBodyWithComments(s, source);
	if (body === null) return null;
	return `${header} {\n${body}\n}`;
}

type OrderedDecl =
	| { kind: "palette"; decl: PaletteDecl; line: number }
	| { kind: "sprite"; decl: SpriteDecl; line: number };

function orderDeclarations(program: Program): OrderedDecl[] {
	const items: OrderedDecl[] = [
		...program.palettes.map((decl) => ({
			kind: "palette" as const,
			decl,
			line: decl.loc.line,
		})),
		...program.sprites.map((decl) => ({
			kind: "sprite" as const,
			decl,
			line: decl.loc.line,
		})),
	];
	items.sort((a, b) => a.line - b.line);
	return items;
}

function trimBlankEdges(lines: string[]): string[] {
	let start = 0;
	let end = lines.length;
	while (start < end && !lines[start].trim()) start++;
	while (end > start && !lines[end - 1].trim()) end--;
	return lines.slice(start, end);
}

function extractPrefix(source: string, firstDeclLine: number): string {
	if (firstDeclLine <= 1) return "";
	// Trailing blank lines are omitted; `parts.join("\n\n")` supplies the gap
	// before the first declaration.
	return trimBlankEdges(sourceLines(source).slice(0, firstDeclLine - 1)).join(
		"\n",
	);
}

function extractBetweenBlocks(
	source: string,
	prevEndLine: number,
	nextStartLine: number,
): string {
	if (nextStartLine <= prevEndLine + 1) return "";
	return trimBlankEdges(
		sourceLines(source).slice(prevEndLine, nextStartLine - 1),
	).join("\n");
}

function formatProgramPlain(program: Program): string {
	const blocks: string[] = [];
	for (const p of program.palettes) {
		blocks.push(formatPalettePlain(p));
	}
	for (const s of program.sprites) {
		blocks.push(formatSpritePlain(s));
	}
	return `${blocks.join("\n\n")}\n`;
}

function formatProgramPreservingComments(
	program: Program,
	source: string,
): string | null {
	const ordered = orderDeclarations(program);
	if (ordered.length === 0) {
		return source.trimEnd() ? `${source.trimEnd()}\n` : "\n";
	}

	const parts: string[] = [];
	const prefix = extractPrefix(source, ordered[0].line);
	if (prefix) {
		parts.push(prefix);
	}

	let prevEndLine = 0;

	for (const item of ordered) {
		const startLine = item.line;

		if (prevEndLine > 0) {
			const between = extractBetweenBlocks(source, prevEndLine, startLine);
			if (between) {
				parts.push(between);
			}
		}

		const block =
			item.kind === "palette"
				? formatPaletteWithComments(item.decl, source)
				: formatSpriteWithComments(item.decl, source);
		if (block === null) return null;

		parts.push(block);
		prevEndLine = findBlockEndLine(source, startLine);
	}

	return `${parts.join("\n\n")}\n`;
}

function commentText(line: string): string | null {
	const idx = line.indexOf("//");
	if (idx === -1) return null;
	return line
		.slice(idx)
		.replace(/^\s*\/\/\s?/, "")
		.trimEnd();
}

function allCommentsPreserved(source: string, output: string): boolean {
	const outLines = sourceLines(output);
	for (const line of sourceLines(source)) {
		const text = commentText(line);
		if (text === null) continue;
		const found = outLines.some((outLine) => commentText(outLine) === text);
		if (!found) return false;
	}
	return true;
}

/**
 * Pretty-print a .pix source file. Preserves `//` line comments by re-attaching
 * them to the declarations they preceded in the original source.
 * Returns null when the source does not parse.
 * When comments cannot be safely preserved, returns the original source unchanged.
 */
export function formatSource(source: string): string | null {
	const { ast, errors } = parse(source);
	if (!ast || errors.length > 0) return null;

	if (!source.includes("//")) {
		return formatProgramPlain(ast);
	}

	const preserved = formatProgramPreservingComments(ast, source);
	if (preserved === null || !allCommentsPreserved(source, preserved)) {
		return source;
	}
	return preserved;
}

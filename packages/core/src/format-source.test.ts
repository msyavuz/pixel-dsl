import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatSource } from "./format-source.js";

const heartPix = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../../examples/heart.pix"),
	"utf8",
);

function commentTexts(source: string): string[] {
	return source
		.split(/\r?\n/)
		.map((line) => {
			const idx = line.indexOf("//");
			if (idx === -1) return null;
			return line
				.slice(idx)
				.replace(/^\s*\/\/\s?/, "")
				.trimEnd();
		})
		.filter((t): t is string => t !== null);
}

function expectFormatted(source: string): string {
	const out = formatSource(source);
	if (out === null) throw new Error("expected format to succeed");
	return out;
}

describe("formatSource", () => {
	it("formats a palette and shape-op sprite", () => {
		const raw =
			"palette p{black k #000000}sprite s 2x2 palette=p{fill k rect 0,0 1,1 k}";
		const out = formatSource(raw);
		expect(out).toContain("palette p {\n");
		expect(out).toContain("  black k #000000\n");
		expect(out).toContain("sprite s 2x2 palette=p {\n");
		expect(out).toContain("  fill k\n");
		expect(out).toContain("  rect 0,0 1,1 k\n");
	});

	it("formats a cell grid with row separators", () => {
		const raw = "sprite g 2x2 { k k / k . }";
		const out = formatSource(raw);
		expect(out).toBe("sprite g 2x2 {\n  k k /\n  k .\n}\n");
	});

	it("returns null on parse errors", () => {
		expect(formatSource("palette p {")).toBeNull();
	});

	it("aligns palette long names", () => {
		const raw = "palette p { red r #f00 black k #000 }";
		const out = expectFormatted(raw);
		expect(out).toContain("red   r #f00");
		expect(out).toContain("black k #000");
	});

	it("preserves top-level comments", () => {
		const raw = `// header note
// second line
palette p {
  red r #f00
}

sprite s 2x2 palette=p {
  fill r
}`;
		const out = expectFormatted(raw);
		expect(out).toContain("// header note");
		expect(out).toContain("// second line");
	});

	it("preserves leading and grouped comments in sprite ops", () => {
		const raw = `palette p { red r #f00 }
sprite s 4x4 palette=p {
  fill .
  // section a
  rect 0,0 1,1 r
  // section b
  pixel 2,2 r
}`;
		const out = expectFormatted(raw);
		expect(out).toContain("// section a");
		expect(out).toContain("// section b");
		expect(out).toContain("  rect 0,0 1,1 r");
	});

	it("preserves trailing comments on op lines", () => {
		const raw = `sprite s 2x2 {
  fill r // background
  pixel 1,1 r
}`;
		const out = expectFormatted(raw);
		expect(out).toContain("fill r // background");
	});

	it("preserves comments in palette blocks", () => {
		const raw = `palette p {
  // primary
  red r #f00
  // shadow
  black k #000
}`;
		const out = expectFormatted(raw);
		expect(out).not.toBe(raw);
		expect(out).toContain("// primary");
		expect(out).toContain("// shadow");
		expect(out).toContain("red   r #f00");
	});

	it("preserves all comments in heart.pix", () => {
		const out = expectFormatted(heartPix);
		for (const text of commentTexts(heartPix)) {
			expect(out).toContain(text);
		}
	});

	it("formats heart.pix without dropping comments", () => {
		const out = expectFormatted(heartPix);
		expect(formatSource(out)).toBe(out);
		for (const text of commentTexts(heartPix)) {
			expect(out).toContain(text);
		}
	});

	it("is idempotent and does not accumulate blank lines before declarations", () => {
		const raw = `// header
// second line



palette p {
  red r #f00
}`;
		const once = expectFormatted(raw);
		const twice = expectFormatted(once);
		const thrice = expectFormatted(twice);
		expect(twice).toBe(once);
		expect(thrice).toBe(once);
		expect(once).toMatch(
			/\/\/ second line\n\npalette p \{\n {2}red r #f00\n\}\n$/,
		);
	});

	it("preserves comments in cell grid sprites", () => {
		const raw = `sprite g 2x2 {
  // row 1
  k k /
  // row 2
  k .
}`;
		const out = expectFormatted(raw);
		expect(out).toContain("// row 1");
		expect(out).toContain("// row 2");
	});
});

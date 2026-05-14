import type { Diagnostic } from "@pixel-dsl/core";
import { describe, expect, it } from "vitest";
import { formatDiagnostic, formatDiagnostics } from "./format.js";

const sample: Diagnostic = {
	code: "palette.invalid_hex",
	severity: "error",
	message: "Invalid hex color `#abcde`.",
	loc: { line: 3, col: 11 },
	hint: "Hex colors must have exactly 3, 4, 6, or 8 hex digits.",
};

describe("formatDiagnostic", () => {
	it("formats a diagnostic without a file path", () => {
		expect(formatDiagnostic(sample)).toBe(
			[
				"3:11: error[palette.invalid_hex]: Invalid hex color `#abcde`.",
				"  hint: Hex colors must have exactly 3, 4, 6, or 8 hex digits.",
			].join("\n"),
		);
	});

	it("formats a diagnostic with a file path", () => {
		expect(formatDiagnostic(sample, "foo.pix")).toBe(
			[
				"foo.pix:3:11: error[palette.invalid_hex]: Invalid hex color `#abcde`.",
				"  hint: Hex colors must have exactly 3, 4, 6, or 8 hex digits.",
			].join("\n"),
		);
	});

	it("omits the hint line when no hint is present", () => {
		const noHint: Diagnostic = { ...sample, hint: undefined };
		expect(formatDiagnostic(noHint, "foo.pix")).toBe(
			"foo.pix:3:11: error[palette.invalid_hex]: Invalid hex color `#abcde`.",
		);
	});
});

describe("formatDiagnostics", () => {
	it("joins multiple diagnostics with newlines", () => {
		const second: Diagnostic = {
			code: "lex.unknown_char",
			severity: "error",
			message: "Unexpected char",
			loc: { line: 5, col: 2 },
		};
		const out = formatDiagnostics([sample, second], "foo.pix");
		expect(out.split("\n")).toHaveLength(3); // 2 lines for first (with hint) + 1 for second
	});
});

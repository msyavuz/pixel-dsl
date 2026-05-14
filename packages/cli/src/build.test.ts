import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { compile, runBuild } from "./build.js";

const FIXTURES = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"fixtures",
);

describe("compile", () => {
	it("returns bytes for valid source", () => {
		const { bytes, errors } = compile(
			"palette p { a a #000 } sprite x 1x1 palette=p { a }",
		);
		expect(errors).toEqual([]);
		expect(bytes).toBeInstanceOf(Uint8Array);
		if (!bytes) throw new Error("expected bytes");
		expect(bytes.length).toBeGreaterThan(0);
	});

	it("returns errors for invalid source (parse failure)", () => {
		const { bytes, errors } = compile("palette nes {");
		expect(bytes).toBeUndefined();
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].severity).toBe("error");
	});

	it("returns a diagnostic when the renderer rejects the AST", () => {
		const { bytes, errors } = compile(
			"palette p { a a #000 } sprite x 1x1 palette=p { a }",
			{ spriteName: "nope" },
		);
		expect(bytes).toBeUndefined();
		expect(errors[0].code).toBe("render.unknown_sprite");
	});

	it("threads the scale option through to the renderer", () => {
		const small = compile("sprite x 1x1 { #ff0000 }").bytes;
		const large = compile("sprite x 1x1 { #ff0000 }", { scale: 8 }).bytes;
		if (!small || !large) throw new Error("expected bytes");
		expect(large.length).toBeGreaterThan(small.length);
	});
});

describe("runBuild", () => {
	let tmp: string;

	beforeEach(() => {
		tmp = mkdtempSync(join(tmpdir(), "pixel-dsl-cli-"));
	});

	afterEach(() => {
		rmSync(tmp, { recursive: true, force: true });
	});

	it("writes a PNG file on success", () => {
		const out = join(tmp, "check.png");
		const result = runBuild({
			input: join(FIXTURES, "check-2x2.pix"),
			output: out,
		});
		expect(result.ok).toBe(true);
		expect(readFileSync(out).subarray(0, 8)).toEqual(
			Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG magic
		);
	});

	it("returns ok=false and does not write output on compile failure", () => {
		const bad = join(tmp, "bad.pix");
		writeFileSync(bad, "palette nes {");
		const out = join(tmp, "bad.png");
		const result = runBuild({ input: bad, output: out });
		expect(result.ok).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(() => readFileSync(out)).toThrow();
	});
});

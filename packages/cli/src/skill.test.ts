import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bundledSkillPath, installSkill, readBundledSkill } from "./skill.js";

describe("bundled skill", () => {
	it("exists and has the expected frontmatter name", () => {
		expect(existsSync(bundledSkillPath())).toBe(true);
		expect(readBundledSkill()).toContain("name: pixel-dsl");
	});
});

describe("installSkill", () => {
	let tmp: string;

	beforeEach(() => {
		tmp = mkdtempSync(join(tmpdir(), "pixel-dsl-skill-"));
	});

	afterEach(() => {
		rmSync(tmp, { recursive: true, force: true });
	});

	it("copies the skill into <dir>/pixel-dsl/SKILL.md", () => {
		const res = installSkill({ dir: tmp });
		expect(res.installed).toBe(true);
		expect(res.dest).toBe(join(tmp, "pixel-dsl", "SKILL.md"));
		expect(readFileSync(res.dest, "utf8")).toEqual(readBundledSkill());
	});

	it("refuses to overwrite an existing install without force", () => {
		installSkill({ dir: tmp });
		const res = installSkill({ dir: tmp });
		expect(res.installed).toBe(false);
		expect(res.reason).toBe("exists");
	});

	it("overwrites when force is set", () => {
		installSkill({ dir: tmp });
		const res = installSkill({ dir: tmp, force: true });
		expect(res.installed).toBe(true);
	});
});

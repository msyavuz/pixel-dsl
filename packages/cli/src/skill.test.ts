import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	bundledSkillPath,
	installSkill,
	readBundledSkill,
	SECTION_BEGIN,
	SECTION_END,
	skillBody,
} from "./skill.js";

describe("bundled skill", () => {
	it("exists and has the expected frontmatter name", () => {
		expect(existsSync(bundledSkillPath())).toBe(true);
		expect(readBundledSkill()).toContain("name: pixel-dsl");
	});
});

describe("skillBody", () => {
	it("strips the YAML frontmatter, keeping the Markdown body", () => {
		const body = skillBody();
		expect(body).not.toContain("name: pixel-dsl");
		expect(body.startsWith("---")).toBe(false);
		expect(body).toContain("# Pixel-DSL");
	});

	it("returns the input unchanged when there is no frontmatter", () => {
		expect(skillBody("# Title\n\nbody")).toBe("# Title\n\nbody");
	});
});

describe("installSkill (claude, default)", () => {
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
		expect(res.target).toBe("claude");
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

describe("installSkill (agents)", () => {
	let tmp: string;

	beforeEach(() => {
		tmp = mkdtempSync(join(tmpdir(), "pixel-dsl-skill-"));
	});

	afterEach(() => {
		rmSync(tmp, { recursive: true, force: true });
	});

	it("writes a managed block into <dir>/AGENTS.md without frontmatter", () => {
		const res = installSkill({ target: "agents", dir: tmp });
		expect(res.installed).toBe(true);
		expect(res.action).toBe("created");
		expect(res.dest).toBe(join(tmp, "AGENTS.md"));
		const content = readFileSync(res.dest, "utf8");
		expect(content).toContain(SECTION_BEGIN);
		expect(content).toContain(SECTION_END);
		expect(content).toContain("# Pixel-DSL");
		expect(content).not.toContain("name: pixel-dsl");
	});

	it("preserves surrounding content and is idempotent on re-run", () => {
		const dest = join(tmp, "AGENTS.md");
		writeFileSync(dest, "# My project\n\nKeep me.\n");
		const first = installSkill({ target: "agents", dir: tmp });
		expect(first.action).toBe("created");
		const second = installSkill({ target: "agents", dir: tmp });
		expect(second.action).toBe("updated");
		const content = readFileSync(dest, "utf8");
		expect(content).toContain("# My project");
		expect(content).toContain("Keep me.");
		// Exactly one managed block, no duplication.
		expect(content.split(SECTION_BEGIN)).toHaveLength(2);
		expect(content.split(SECTION_END)).toHaveLength(2);
	});
});

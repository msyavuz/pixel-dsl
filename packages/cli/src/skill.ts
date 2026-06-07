import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the SKILL.md bundled in this package. The `skill/` directory
 * sits at the package root (shipped via the `files` field), one level up from
 * both `src/` (dev) and `dist/` (published), so the relative path resolves in
 * both cases.
 */
export function bundledSkillPath(): string {
	return fileURLToPath(new URL("../skill/pixel-dsl/SKILL.md", import.meta.url));
}

/** Read the bundled skill source as text. */
export function readBundledSkill(): string {
	return readFileSync(bundledSkillPath(), "utf8");
}

/** Default skills directory Claude Code reads from. */
export function defaultSkillsDir(): string {
	return join(homedir(), ".claude", "skills");
}

export interface InstallSkillArgs {
	/** Base skills directory. Defaults to {@link defaultSkillsDir}. */
	dir?: string;
	/** Overwrite an existing install. */
	force?: boolean;
}

export interface InstallSkillResult {
	installed: boolean;
	/** Destination SKILL.md path. */
	dest: string;
	/** Set when `installed` is false. */
	reason?: "exists";
}

/**
 * Copy the bundled skill into `<dir>/pixel-dsl/SKILL.md`. Refuses to overwrite an
 * existing install unless `force` is set.
 */
export function installSkill(args: InstallSkillArgs = {}): InstallSkillResult {
	const destDir = join(args.dir ?? defaultSkillsDir(), "pixel-dsl");
	const dest = join(destDir, "SKILL.md");
	if (existsSync(dest) && !args.force) {
		return { installed: false, dest, reason: "exists" };
	}
	mkdirSync(destDir, { recursive: true });
	copyFileSync(bundledSkillPath(), dest);
	return { installed: true, dest };
}

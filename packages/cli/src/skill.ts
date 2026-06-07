import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
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

/** Read the bundled skill source (frontmatter + body) as text. */
export function readBundledSkill(): string {
	return readFileSync(bundledSkillPath(), "utf8");
}

/**
 * Strip a leading YAML frontmatter block (`---` … `---`) from a skill source,
 * returning just the Markdown body. The body is the cross-tool source of truth;
 * the frontmatter is Claude-specific metadata. Returns the input unchanged when
 * there is no frontmatter.
 */
export function skillBody(source = readBundledSkill()): string {
	if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) {
		return source.trim();
	}
	// Find the closing fence: a line containing only `---`.
	const match = source.match(/\n---[ \t]*\r?\n/);
	if (!match || match.index === undefined) return source.trim();
	return source.slice(match.index + match[0].length).trim();
}

/**
 * An agentic tool the skill can be installed for. Each target owns where the
 * skill lives (`defaultDir` + `relPath`), how its content is rendered, and
 * whether it owns the whole file (`file`) or merges a managed block into a
 * shared file (`section`).
 */
export interface Target {
	id: TargetId;
	/** Human-readable name, e.g. "Claude Code". */
	label: string;
	/** Default base directory to install into (home/global). */
	defaultDir(): string;
	/** Path of the installed file, relative to the base directory. */
	relPath: string;
	/**
	 * `file`: the target owns the whole file; refuse to overwrite without force.
	 * `section`: merge a delimited managed block into a possibly-shared file.
	 */
	mode: "file" | "section";
	/** Produce the content this target installs from the bundled skill source. */
	render(source: string): string;
}

export type TargetId = "claude" | "agents";

/** Markers delimiting the pixel-dsl block inside a shared `section` file. */
export const SECTION_BEGIN =
	"<!-- BEGIN pixel-dsl skill (managed by `pixel-dsl skill install`) -->";
export const SECTION_END = "<!-- END pixel-dsl skill -->";

export const TARGETS: Record<TargetId, Target> = {
	claude: {
		id: "claude",
		label: "Claude Code",
		defaultDir: () => join(homedir(), ".claude", "skills"),
		relPath: join("pixel-dsl", "SKILL.md"),
		mode: "file",
		// Claude consumes the SKILL.md verbatim, frontmatter included.
		render: (source) => source,
	},
	agents: {
		id: "agents",
		label: "AGENTS.md",
		// Codex and friends read a global AGENTS.md from $CODEX_HOME (~/.codex).
		// Use `--dir .` to drop it into a project instead.
		defaultDir: () => join(homedir(), ".codex"),
		relPath: "AGENTS.md",
		mode: "section",
		// AGENTS.md is plain Markdown with no frontmatter.
		render: (source) => skillBody(source),
	},
};

export function resolveTarget(id: string): Target | undefined {
	return (TARGETS as Record<string, Target | undefined>)[id];
}

export interface InstallSkillArgs {
	/** Which tool to install for. Defaults to `claude`. */
	target?: TargetId;
	/** Base directory. Defaults to the target's {@link Target.defaultDir}. */
	dir?: string;
	/** Overwrite an existing `file`-mode install. */
	force?: boolean;
}

export interface InstallSkillResult {
	installed: boolean;
	/** Tool this result is for. */
	target: TargetId;
	/** Destination file path. */
	dest: string;
	/** What happened on success. */
	action?: "created" | "updated";
	/** Set when `installed` is false. */
	reason?: "exists";
}

/**
 * Install the bundled skill for the chosen target. `file`-mode targets (Claude)
 * own the destination and refuse to overwrite without `force`; `section`-mode
 * targets (AGENTS.md) idempotently upsert a delimited managed block, leaving the
 * rest of a shared file untouched.
 */
export function installSkill(args: InstallSkillArgs = {}): InstallSkillResult {
	const target = TARGETS[args.target ?? "claude"];
	const dest = join(args.dir ?? target.defaultDir(), target.relPath);

	if (target.mode === "file") {
		if (existsSync(dest) && !args.force) {
			return { installed: false, target: target.id, dest, reason: "exists" };
		}
		mkdirSync(dirname(dest), { recursive: true });
		// Claude's render is identity, so copy the file byte-for-byte.
		copyFileSync(bundledSkillPath(), dest);
		return { installed: true, target: target.id, dest, action: "created" };
	}

	// section mode
	const block = `${SECTION_BEGIN}\n${target.render(readBundledSkill())}\n${SECTION_END}`;
	const existing = existsSync(dest) ? readFileSync(dest, "utf8") : "";
	const { content, action } = upsertSection(existing, block);
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, content);
	return { installed: true, target: target.id, dest, action };
}

/**
 * Replace an existing pixel-dsl managed block in `existing`, or append one.
 * Returns the new file content and whether a block was created or updated.
 */
function upsertSection(
	existing: string,
	block: string,
): { content: string; action: "created" | "updated" } {
	const begin = existing.indexOf(SECTION_BEGIN);
	if (begin !== -1) {
		const endMarker = existing.indexOf(SECTION_END, begin);
		const end =
			endMarker === -1 ? existing.length : endMarker + SECTION_END.length;
		const content = existing.slice(0, begin) + block + existing.slice(end);
		return { content: ensureTrailingNewline(content), action: "updated" };
	}
	if (existing.trim() === "") {
		return { content: ensureTrailingNewline(block), action: "created" };
	}
	const sep = existing.endsWith("\n") ? "\n" : "\n\n";
	return {
		content: ensureTrailingNewline(existing + sep + block),
		action: "created",
	};
}

function ensureTrailingNewline(s: string): string {
	return s.endsWith("\n") ? s : `${s}\n`;
}

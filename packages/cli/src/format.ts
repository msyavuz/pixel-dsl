import type { Diagnostic } from "@pixel-dsl/core";

export function formatDiagnostic(d: Diagnostic, file?: string): string {
	const prefix = file
		? `${file}:${d.loc.line}:${d.loc.col}`
		: `${d.loc.line}:${d.loc.col}`;
	const head = `${prefix}: ${d.severity}[${d.code}]: ${d.message}`;
	return d.hint ? `${head}\n  hint: ${d.hint}` : head;
}

export function formatDiagnostics(
	diagnostics: Diagnostic[],
	file?: string,
): string {
	return diagnostics.map((d) => formatDiagnostic(d, file)).join("\n");
}

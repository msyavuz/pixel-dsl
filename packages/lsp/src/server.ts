#!/usr/bin/env node
import {
	createConnection,
	ProposedFeatures,
	TextDocumentSyncKind,
	TextDocuments,
	// `.js` is required: vscode-languageserver has no `exports` map, so the
	// `/node` subpath only resolves under ESM with the explicit extension.
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
	computeCompletions,
	computeDiagnostics,
	computeHover,
	formatDocument,
} from "./features.js";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
	capabilities: {
		textDocumentSync: TextDocumentSyncKind.Incremental,
		hoverProvider: true,
		completionProvider: { resolveProvider: false },
		documentFormattingProvider: true,
	},
}));

function validate(doc: TextDocument): void {
	connection.sendDiagnostics({
		uri: doc.uri,
		diagnostics: computeDiagnostics(doc.getText()),
	});
}

documents.onDidOpen((e) => validate(e.document));
documents.onDidChangeContent((e) => validate(e.document));

connection.onHover((params) => {
	const doc = documents.get(params.textDocument.uri);
	return doc ? computeHover(doc.getText(), params.position) : null;
});

connection.onDocumentFormatting((params) => {
	const doc = documents.get(params.textDocument.uri);
	return doc ? (formatDocument(doc.getText()) ?? []) : [];
});

connection.onCompletion((params) => {
	const doc = documents.get(params.textDocument.uri);
	return doc ? computeCompletions(doc.getText(), params.position) : [];
});

documents.listen(connection);
connection.listen();

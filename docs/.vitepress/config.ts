import { defineConfig, type UserConfig } from "vitepress";
import pixGrammar from "./pix.tmLanguage.json";

type PixLang = NonNullable<
	NonNullable<UserConfig["markdown"]>["languages"]
>[number];

export default defineConfig({
	title: "Pixel-DSL",
	description: "A deterministic, LLM-friendly DSL for pixel art sprites.",
	// Served at the root of the custom domain https://pixel-dsl.com
	base: "/",
	head: [["link", { rel: "icon", type: "image/png", href: "/favicon.png" }]],
	markdown: {
		// Register the custom `pix` language so ```pix code blocks highlight.
		languages: [pixGrammar as unknown as PixLang],
	},
	themeConfig: {
		logo: "/logo.png",
		nav: [
			{ text: "Guide", link: "/guide/getting-started" },
			{ text: "Grammar", link: "/guide/grammar" },
			{ text: "Examples", link: "/examples/" },
			{ text: "Playground", link: "/playground/", target: "_self" },
		],
		sidebar: {
			"/guide/": [
				{
					text: "Guide",
					items: [
						{ text: "Getting started", link: "/guide/getting-started" },
						{ text: "Grammar reference", link: "/guide/grammar" },
						{ text: "CLI usage", link: "/guide/cli" },
						{ text: "Shape ops", link: "/guide/shape-ops" },
					],
				},
			],
			"/examples/": [
				{
					text: "Examples",
					items: [{ text: "Overview", link: "/examples/" }],
				},
			],
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/msyavuz/pixel-dsl" },
		],
	},
});

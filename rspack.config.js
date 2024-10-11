import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "path";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const packagemeta = JSON.parse(await readFile("package.json"));

export default defineConfig({
	// change to production when needed
	mode: "development",
	entry: {
		shared: join(__dirname, "src/shared/index.ts"),
		worker: join(__dirname, "src/worker/index.ts"),
		thread: join(__dirname, "src/thread/thread.ts"),
		client: join(__dirname, "src/client/index.ts"),
		codecs: join(__dirname, "src/codecs/index.ts"),
		controller: join(__dirname, "src/controller/index.ts"),
		sync: join(__dirname, "src/sync.ts"),
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: "builtin:swc-loader",
				exclude: ["/node_modules/"],
				options: {
					asdasdasds: new Error(),
					jsc: {
						parser: {
							syntax: "typescript",
						},
						target: "es2022",
					},
					strictMode: false,
					module: {
						type: "es6",
						strict: false,
						strictMode: false,
					},
				},
				type: "javascript/auto",
			},
		],
		parser: {
			javascript: {
				dynamicImportMode: "eager",
			},
		},
	},
	output: {
		filename: "scramjet.[name].js",
		path: join(__dirname, "dist"),
		libraryTarget: "es2022",
		iife: true,
	},
	plugins: [
		new rspack.ProvidePlugin({
			dbg: [join(__dirname, "src/log.ts"), "default"],
		}),
		new rspack.DefinePlugin({
			VERSION: JSON.stringify(packagemeta.version),
		}),
		new rspack.DefinePlugin({
			COMMITHASH: JSON.stringify(
				execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).replace(
					/\r?\n|\r/g,
					""
				)
			),
		}),
		process.env.DEBUG === "true"
			? new RsdoctorRspackPlugin({
					supports: {
						parseBundle: true,
						banner: true,
					},
				})
			: null,
	],
	target: "webworker",
});

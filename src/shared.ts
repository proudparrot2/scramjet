export const {
	util: { BareClient, ScramjetHeaders, BareMuxConnection },
	url: { encodeUrl, decodeUrl },
	rewrite: {
		rewriteCss,
		unrewriteCss,
		rewriteHtml,
		unrewriteHtml,
		rewriteSrcset,
		rewriteJs,
		rewriteHeaders,
		rewriteWorkers,
		htmlRules,
	},
	CookieStore,
} = self.$scramjet.shared;

export const config = self.$scramjet.config;

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.js",
		worker: "/scram/scramjet.worker.js",
		client: "/scram/scramjet.client.js",
		shared: "/scram/scramjet.shared.js",
		sync: "/scram/scramjet.sync.js",
	},
	siteFlags: {
		"https://worker-playground.glitch.me/.*": {
			serviceworkers: true,
		},
	},
});

scramjet.init("./sw.js");

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const flex = css`
	display: flex;
`;
const col = css`
	flex-direction: column;
`;

const store = $store(
	{
		url: "https://google.com",
		wispurl:
			_CONFIG?.wispurl ||
			(location.protocol === "https:" ? "wss" : "ws") +
				"://" +
				location.host +
				"/wisp/",
		bareurl:
			_CONFIG?.bareurl ||
			(location.protocol === "https:" ? "https" : "http") +
				"://" +
				location.host +
				"/bare/",
		proxy: "",
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" }
);
connection.setTransport("/epoxy/index.mjs", [{ wisp: store.wispurl }]);

function PlaygroundApp() {
	this.css = `
    width: 100%;
    height: 100%;
    color: #f0fef4;
    display: flex;
    padding: 0.5em;
    box-sizing: border-box;
    gap: 0.5em;


    .codesplit {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;

      gap: 0.5em;
    }

    .mcontainer { 
      background: #1e1e1e;
      h2 {
        margin: 0.1em;
      }

      border: 1px solid #313131;
      flex-basis: 100%;
      display: flex;
      flex-direction: column;
    }
    .monaco {
      flex: 1;
    }

    .frame {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      iframe {
        width: 100%;

      border: 1px solid #313131;
      }
    }
    .config {
      border: 1px solid #313131;
      background: #1e1e1e;
      padding: 0.5em;
    }
  `;

	this.fakeorigin = "https://sandboxedorigin.com";
	this.mount = async () => {
		const monaco = await import(
			"https://cdn.jsdelivr.net/npm/monaco-editor/+esm"
		);

		monaco.editor.setTheme("vs-dark");
		const html = monaco.editor.create(this.htmlbox, {
			value: `<html>
  <head>
    <!-- all resources are intercepted by the service worker -->
    <link rel="stylesheet" href="/style.css"></link>
    <script src="/script.js"></script>

    <!-- external resources go through WISP (check network tab) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
  </head>
  <body>
    <h1>Scramjet Sandbox Playground</h1>
    <p>
      Scramjet allows any webpage to be run on the same origin in an isolated manner
    </p>


    <button onclick="checkOrigin()">Test emulated origin</button>
    <button onclick="loadResource('https://example.com/')">Load assets through sandbox</button>
    <br><br>

    <h2>iframe test</h2>
    <button onclick="loadiframe()">test iframe nesting</button>
    <br>
  </body>
</html>`,
			language: "html",
		});
		const js = monaco.editor.create(this.jsbox, {
			value: `function checkOrigin() {
	// real origin is hidden from the page
  alert("origin: " + window.origin);
}

// external resources fetched will be re-
// directed to the WISP server
function loadResource(url) {
  fetch(url).then(r => {
    console.log("loaded", r);
  })
}
function loadiframe()  {
	if (document.getElementById("nested-frame")) return;
	let frame = document.createElement("iframe");
	frame.id = "nested-frame";
	frame.src = "https://google.com";
	document.body.appendChild(frame);
}`,
			language: "javascript",
		});
		const css = monaco.editor.create(this.cssbox, {
			value: `/* resources loaded by css are intercepted by service worker */
@import  url('https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');

body, html {
  background: #1e1e1e;
  color: white;
  width: 100%;
  height: 100%;
  font-family: "Roboto";
}
iframe {
	zoom: 0.75;
  width: 50%;
  height: 50%;
}
`,
			language: "css",
		});
		let oldjs;
		let oldhtml;
		let oldcss;

		setInterval(async () => {
			if (
				oldjs !== js.getValue() ||
				oldhtml !== html.getValue() ||
				oldcss !== css.getValue()
			) {
				oldjs = js.getValue();
				oldhtml = html.getValue();
				oldcss = css.getValue();

				(await navigator.serviceWorker.ready).active.postMessage({
					type: "playgroundData",
					html: html.getValue(),
					css: css.getValue(),
					js: js.getValue(),
					origin: this.fakeorigin,
				});

				this.frame.src = scramjet.encodeUrl(this.fakeorigin);
			}
		}, 1000);
	};

	return html`
		<div>
			<div class="codesplit">
				<div class="mcontainer">
					<h2>HTML</h2>
					<div class="monaco" bind:this=${use(this.htmlbox)}></div>
				</div>

				<div class="mcontainer">
					<h2>JS</h2>
					<div class="monaco" bind:this=${use(this.jsbox)}></div>
				</div>

				<div class="mcontainer">
					<h2>CSS</h2>
					<div class="monaco" bind:this=${use(this.cssbox)}></div>
				</div>
			</div>
			<div class="frame" style="flex: 1">
				<iframe style="flex: 1" bind:this=${use(this.frame)}></iframe>
				<div class="config">
					<h1>Config</h1>
					<div>
						<label>fake origin:</label>
						<input bind:value=${use(this.fakeorigin)} />

						<label>wisp server:</label>
						<input bind:value=${use(store.wispurl)} />
					</div>
				</div>
			</div>
		</div>
	`;
}

window.addEventListener("load", async () => {
	document.body.appendChild(h(PlaygroundApp));
});

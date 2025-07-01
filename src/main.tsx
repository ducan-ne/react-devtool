import { render } from "preact";
import "./index.css";
import { App } from "./app.tsx";

// biome-ignore lint/style/noNonNullAssertion: app is always present
render(<App />, document.getElementById("app")!);

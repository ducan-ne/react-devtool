import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app.tsx";

// biome-ignore lint/style/noNonNullAssertion: app is always present
createRoot(document.getElementById("app")!).render(<App />);

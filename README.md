# React Devtool

A lightweight embeddable devtool for React apps. Drop a `<Devtool>` component into your app to get an in-page toolbar, component render inspection, performance signals, and a small set of dark developer UI primitives you can compose into your own internal tooling.

<div align="center">

[![npm version](https://img.shields.io/npm/v/react-devtool.svg?style=flat-square)](https://www.npmjs.com/package/react-devtool)
[![npm downloads](https://img.shields.io/npm/dm/react-devtool.svg?style=flat-square)](https://www.npmjs.com/package/react-devtool)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-devtool?style=flat-square)](https://bundlephobia.com/package/react-devtool)
[![license](https://img.shields.io/npm/l/react-devtool.svg?style=flat-square)](https://github.com/ducan-ne/react-devtool/blob/main/LICENSE)

</div>

Try the hosted playground at [react-devtool.com](https://react-devtool.com).

## What it gives you

- **Embeddable devtool shell** - mount one React component and render custom tools inside the devtool panel.
- **Component inspection** - inspect rendered React components and their props/state-like data from the in-page toolbar.
- **Render/performance monitoring** - highlight component activity and inspect render-related performance information while developing.
- **Data inspection** - render object trees with the bundled `Inspector` component.
- **Feature flag helpers** - create subscribable flag containers and read them with `useFlag`.
- **Developer UI kit** - use small primitives such as buttons, inputs, toggles, sections, tabs, radio groups, and code blocks.

## Installation

```bash
npm install react-devtool
# or
pnpm add react-devtool
# or
yarn add react-devtool
# or
bun add react-devtool
```

React Devtool is published as an ES module package and expects React and React DOM from your application.

## Quick start

Render `Devtool` once near the root of your app. The component initializes the devtool and renders nothing directly into your app tree.

```tsx
import { Devtool } from "react-devtool";

export function App() {
  return (
    <>
      <YourApp />
      <Devtool>
        <div>Internal tools go here</div>
      </Devtool>
    </>
  );
}
```

## Add custom tools

Import UI primitives from `react-devtool/ui` and pass them as children to `Devtool`.

```tsx
import { Devtool } from "react-devtool";
import { Button, CodeBlock, Input, Section, Tab, Tabs } from "react-devtool/ui";

export function App() {
  return (
    <>
      <YourApp />

      <Devtool>
        <Section title="Debug actions">
          <Input label="User id" placeholder="user_123" />
          <Button onClick={() => console.log("refresh cache")}>Refresh cache</Button>
        </Section>

        <Tabs defaultValue="request">
          <Tab label="Request" value="request">
            <CodeBlock language="json">{JSON.stringify({ page: "home" }, null, 2)}</CodeBlock>
          </Tab>
          <Tab label="Response" value="response">
            <CodeBlock language="json">{JSON.stringify({ ok: true }, null, 2)}</CodeBlock>
          </Tab>
        </Tabs>
      </Devtool>
    </>
  );
}
```

## Feature flags

Use `flags` to create a subscribable flag object. Read individual values with `useFlag`, then render the flag object in the devtool panel with `FeatureFlags`.

```tsx
import { Devtool, flags, useFlag } from "react-devtool";
import { FeatureFlags } from "react-devtool/ui";

const featureFlags = flags({
  newCheckout: false,
  verboseLogs: true,
});

function Checkout() {
  const newCheckout = useFlag(featureFlags, "newCheckout");

  return newCheckout ? <NewCheckout /> : <LegacyCheckout />;
}

export function App() {
  return (
    <>
      <Checkout />
      <Devtool>
        <FeatureFlags name="Features" values={featureFlags} />
      </Devtool>
    </>
  );
}
```

## Inspect data

Use `values` for subscribable data and `Inspector` for object-tree rendering.

```tsx
import { Devtool, values } from "react-devtool";
import { Inspector } from "react-devtool/ui";

const session = values({
  user: { id: "u_123", role: "admin" },
  settings: { theme: "dark" },
});

export function App() {
  return (
    <>
      <YourApp />
      <Devtool>
        <Inspector data={session.value} expandLevel={2} />
      </Devtool>
    </>
  );
}
```

## API

### `react-devtool`

| Export | Description |
| --- | --- |
| `Devtool` | Initializes the in-page devtool and syncs its children into the devtool UI. |
| `values(initialValue)` | Creates a subscribable signal-like value container. |
| `flags(initialFlags)` | Creates a subscribable signal-like flag container. |
| `useFlag(flags, key)` | React hook that subscribes to one flag value. |

### `react-devtool/ui`

| Export | Description |
| --- | --- |
| `FeatureFlags` | Displays a subscribable boolean map in the devtool UI. |
| `Inspector` | Object and DOM-like value inspector powered by `react-inspector`. |
| `Button` | Button primitive with `default`, `outline`, `ghost`, and `destructive` variants. |
| `Toggle` | Accessible switch primitive. |
| `Input` | Text input with optional label, help text, and error text. |
| `Select` | Select input with optional label, placeholder, help text, and error text. |
| `Radio`, `RadioGroup` | Radio input primitives. |
| `ButtonGroup` | Horizontal or vertical button grouping. |
| `Section` | Titled section with optional collapse behavior. |
| `Tabs`, `Tab` | Controlled or uncontrolled tabs. |
| `CodeBlock` | Small code block display component. |

## Local development

This repository uses Bun for the lockfile, but the npm scripts are standard package scripts.

```bash
bun install
bun run dev        # start the Vite playground on http://localhost:1234
bun run build      # build the library into dist/
bun run build:playground # build the hosted playground into playground-dist/
bun run typecheck  # run TypeScript project checks
bun run knip       # check for unused files/dependencies
```

There is no package-level `test` script yet. Unit tests live under `tests/unit`, component tests live under `tests/ct`, and the repository includes Vitest and Playwright component-test configuration.

## Package exports

```ts
import { Devtool, flags, useFlag, values } from "react-devtool";
import { Button, FeatureFlags, Inspector, Tabs } from "react-devtool/ui";
```

The package builds `src/devtool.tsx` and `src/ui.tsx` as library entry points.

## Acknowledgments

React Devtool builds on ideas and implementation patterns from earlier React render debugging tools. Thanks to the open-source React debugging community for their work.

## Contributing

Contributions are welcome. A typical local loop is:

1. Create a feature branch.
2. Make the smallest focused change.
3. Run `bun run typecheck` and `bun run build`.
4. Open a pull request with a short description and verification notes.

## License

MIT © [React Devtool](https://github.com/ducan-ne/react-devtool)

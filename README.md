# React Devtool

<div align="center">
  <h3>Easy solution to have your own internal devtool, unleash the DX of React</h3>
  <p>A powerful, extensible devtool for React applications with built-in UI components and plugin system</p>
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/react-devtool.svg?style=flat-square)](https://www.npmjs.com/package/react-devtool)
[![npm downloads](https://img.shields.io/npm/dm/react-devtool.svg?style=flat-square)](https://www.npmjs.com/package/react-devtool)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-devtool?style=flat-square)](https://bundlephobia.com/package/react-devtool)
[![license](https://img.shields.io/npm/l/react-devtool.svg?style=flat-square)](https://github.com/ducan-ne/react-devtool/blob/main/LICENSE)

</div>

---

## ✨ Features

- 🎨 **Rich UI Components** - Pre-built components for common devtool needs
- 📊 **Performance Monitoring** - Built-in performance tracking and visualization
- 🔍 **Component Inspector** - Inspect and debug React components
- 🎛️ **Feature Flags** - Toggle features on/off during development
- 🎯 **Framework Agnostic** - Works with React, Preact, and more (coming soon)
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🌙 **Dark Mode** - Beautiful dark theme optimized for developer experience

## 📦 Installation

```bash
npm install react-devtool
# or
yarn add react-devtool
# or
pnpm add react-devtool
```

## 🚀 Quick Start

```tsx
import { Devtool } from 'react-devtool';

function App() {
  return (
    <div>
      {/* Your app content */}
      <YourApp />
      
      {/* Add Devtool at the root of your app */}
      <Devtool />
    </div>
  );
}
```

## 📖 Usage

### Basic Setup

The simplest way to get started is to add the `Devtool` component to your app:

```tsx
import { Devtool } from 'react-devtool';

function App() {
  return (
    <>
      <YourApp />
      <Devtool />
    </>
  );
}
```



### Custom UI

Add custom UI elements to your devtool:

```tsx
import { Devtool } from 'react-devtool';
import { Button, Input, Tabs, Tab } from 'react-devtool/ui';

function App() {
  return (
    <>
      <YourApp />
      <Devtool>
        <Input type="text" placeholder="Search..." />
        <Button onClick={() => console.log('Clicked!')}>
          Save Changes
        </Button>
        
        <Tabs defaultValue="tab1">
          <Tab label="Feature A" value="tab1">
            Content for Feature A
          </Tab>
          <Tab label="Feature B" value="tab2">
            Content for Feature B
          </Tab>
        </Tabs>
      </Devtool>
    </>
  );
}
```

### Feature Flags

Manage feature flags with reactive updates:

```tsx
import { Devtool, flags } from 'react-devtool';
import { FeatureFlags, useFlag } from 'react-devtool/ui';

// Define your feature flags
const featureFlags = flags({
  newUI: false,
  experimentalFeature: true,
  debugMode: false
});

function MyComponent() {
  // Use flags in your components
  const isNewUIEnabled = useFlag(featureFlags, 'newUI');
  
  return (
    <div>
      {isNewUIEnabled ? <NewUI /> : <OldUI />}
    </div>
  );
}

function App() {
  return (
    <>
      <MyComponent />
      <Devtool>
        <FeatureFlags 
          name="App Features"
          values={featureFlags}
          onChange={(key, value) => {
            console.log(`Feature ${key} changed to ${value}`);
          }}
        />
      </Devtool>
    </>
  );
}
```

### Data Inspection

Use the Inspector component to debug complex data:

```tsx
import { Devtool, values } from 'react-devtool';
import { Inspector } from 'react-devtool/ui';

const appState = values({
  user: { id: 1, name: 'John Doe' },
  settings: { theme: 'dark', notifications: true }
});

function App() {
  return (
    <>
      <YourApp />
      <Devtool>
        <Inspector 
          data={appState.value}
          expandLevel={2}
        />
      </Devtool>
    </>
  );
}
```

## 🔌 API Reference

### Components

#### `<Devtool>`

The main devtool component that provides the devtool interface.

```tsx
interface DevtoolProps {
  children?: ReactNode;
}
```

#### `<FeatureFlags>`

Component for managing feature flags with a UI.

```tsx
interface FeatureFlagsProps {
  name?: string;
  values: Subscribable<Record<string, boolean>>;
  onChange?: (key: string, value: boolean) => void;
}
```

#### `<Inspector>`

Data inspector component for debugging complex objects.

```tsx
interface InspectorProps {
  data: any;
  theme?: any;
  expandLevel?: number;
  table?: boolean;
  className?: string;
}
```

### UI Components

React Devtool includes a comprehensive set of UI components:

- **`Button`** - Customizable button with variants
- **`Toggle`** - Switch/toggle component
- **`Input`** - Text input with label and validation
- **`Select`** - Dropdown select component
- **`Radio`** & **`RadioGroup`** - Radio button components
- **`ButtonGroup`** - Group buttons together
- **`Section`** - Collapsible content sections
- **`Tabs`** & **`Tab`** - Tabbed interface
- **`CodeBlock`** - Syntax highlighted code display

### Functions

#### `values(initialValue)`

Create a subscribable value container.

```tsx
const state = values({ count: 0 });

// Subscribe to changes
state.subscribe((newValue) => {
  console.log('State changed:', newValue);
});
```

#### `flags(initialFlags)`

Create a subscribable feature flags container.

```tsx
const featureFlags = flags({
  feature1: true,
  feature2: false
});
```

### Hooks

#### `useFlag(flags, key)`

React hook to use a specific feature flag.

```tsx
const isEnabled = useFlag(featureFlags, 'feature1');
```

## 🎨 Styling

React Devtool uses Tailwind CSS for styling and provides CSS variables for theming:

```css
:root {
  --color-wash: #ffffff;
  --color-gray-40: #666666;
  --color-gray-80: #cccccc;
  --color-gray-90: #e6e6e6;
  --color-gray-95: #f2f2f2;
  --color-yellow-30: #ffd700;
  --color-blue-30: #4169e1;
  --color-red-30: #dc143c;
}
```


## 🙏 Acknowledgments

This project was built upon the amazing work of [React Scan](https://github.com/aidenybai/react-scan). We've adapted and extended their excellent UI components and devtool architecture to create React Devtool. Special thanks to the React Scan team for their innovative approach to React debugging tools.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [React Devtool](https://github.com/ducan-ne/react-devtool)

---

<div align="center">
  Made with ❤️ by the React Devtool team
</div>

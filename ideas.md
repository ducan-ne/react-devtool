## flags api

```tsx

type Subscribable = {
  [key: string]: any
  subscribe: (fn: (value: any) => void) => () => void
}

const defaultFlags: Subscribable<Record<string, boolean>> = createState({
  flags: {}
})

const defaultFlags: Subscribable<Record<string, boolean>> = createFlags({
  'aaaa': true,
  'abc-0123': true,
})

const { flags, setFlag } = useFlags(defaultFlags)
// subscribe to state changes

// 1
<FeatureFlags values={defaultFlags}>
// 2
<FeatureFlags defaultValues={defaultFlags}>
  // internally it will create a new store with the default values
```








```

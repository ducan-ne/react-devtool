import React from 'react'
import { Radio, RadioGroup, Tab, Tabs, Toggle } from '../../src/ui'

export function ToggleHarness() {
  const [checked, setChecked] = React.useState(false)
  return <Toggle checked={checked} onChange={setChecked} />
}

export function ToggleDisabledHarness() {
  const [checked, setChecked] = React.useState(false)
  return <Toggle checked={checked} onChange={setChecked} disabled id="tg" />
}

export function TabsHarness() {
  return (
    <Tabs defaultValue="one">
      <Tab label="One" value="one">
        <div>Panel One</div>
      </Tab>
      <Tab label="Two" value="two">
        <div>Panel Two</div>
      </Tab>
    </Tabs>
  )
}

export function RadioHarness() {
  const [value, setValue] = React.useState('a')
  return (
    <RadioGroup value={value} onChange={setValue} label="Group">
      <Radio label="A" value="a" />
      <Radio label="B" value="b" />
    </RadioGroup>
  )
}

import { isValidElement } from "react"

export function Test({ children }: { children: any }) {
  console.log(isValidElement(children))
  return children
  return <div>Test</div>
}

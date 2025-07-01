import { useEffect } from "react"

export function SampleReact() {
  useEffect(() => {
    console.log("SampleReact")
  }, [])
  return <div className="text-red-500">Sample</div>
}

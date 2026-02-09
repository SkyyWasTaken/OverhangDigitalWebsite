import { useState } from 'react'
import reactLogo from './assets/react.svg'
import {Button} from "@/components/ui/button.tsx";

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="max-w-7xl m-auto p-2rem text-center w-full h-full font-sans flex items-center">
      <div className="m-auto">
        <h1 className="text-3xl">skibidi ohio</h1>
        <div className="flex items-center flex-col">
          <a href="https://ohio.gov" target="_blank">
            <img src={reactLogo} className="h-6em p-1.5em will-change-filter animate-spin drop-shadow-md" alt="React logo" />
          </a>
        </div>
        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
      </div>
    </div>
  )
}

export default App

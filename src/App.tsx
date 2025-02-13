import { useState, Suspense, lazy } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// 动态导入 BackgroundEffect 组件
const BackgroundEffect = lazy(() => import('./components/BackgroundEffect/BackgroundEffect'))

// 提取计数器为独立组件
const Counter = () => {
  const [count, setCount] = useState(0)

  return (
    <div className="card">
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  )
}

// 提取 Logo 部分为独立组件
const Logos = () => (
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src={viteLogo} className="logo" alt="Vite logo" />
    </a>
    <a href="https://react.dev" target="_blank">
      <img src={reactLogo} className="logo react" alt="React logo" />
    </a>
  </div>
)

function App() {
  return (
    <>
      <div className="background-container">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <BackgroundEffect
            imageSrc="src/assets/images/撰写个人博客 UI 功能文档 (3).png"
            grid={40}
            distortionStrength={0.01}
            relaxation={0.9}
            particleCount={400}
            particleSpread={10}
            particleSpeed={0.1}
            particleColors={['#ffffff', '#61dafb', '#646cff']}
            particleBaseSize={100}
            sizeRandomness={1}
            cameraDistance={20}
            disableRotation={false}
            mouseForce={2}
            mouseRadius={0.2}
            particleMouseForce={1}
          />
        </Suspense>
      </div>
      <div className="content-wrapper">
        <Logos />
        <h1>Vite + React</h1>
        <Counter />
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </>
  )
}

export default App

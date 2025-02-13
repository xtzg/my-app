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
        计数器 {count}
      </button>
      <p>
        点击按钮可以增加计数器，虽然没啥用
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
            imageSrc="./src/assets/images/background.png"
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
          点那两图标可以跳转，虽然可能会禁访问
        </p>
      </div>
    </>
  )
}

export default App

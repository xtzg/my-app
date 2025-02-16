import { Suspense, lazy } from 'react'
import './App.css'
import LoginForm from './components/LoginFrom/LoginForm'

// 动态导入 BackgroundEffect 组件
const BackgroundEffect = lazy(() => import('./components/BackgroundEffect/BackgroundEffect'))

function App() {
  return (
    <>
      <div className="background-container">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <BackgroundEffect
            imageSrc="./src/assets/images/background.png"
            grid={10}
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
        <div className="login-form-container">
          <LoginForm />
        </div>
      </div>
    </>
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { TransitionProvider } from './context/TransitionContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <TransitionProvider>
      <App />
    </TransitionProvider>
  </BrowserRouter>
)


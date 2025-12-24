import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "./lib/theme-provider"
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)

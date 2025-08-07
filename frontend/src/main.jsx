import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/index.css'

// Add error boundary for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2A2B32',
            color: '#FFFFFF',
            border: '1px solid #3E3F47',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#F44336',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
) 
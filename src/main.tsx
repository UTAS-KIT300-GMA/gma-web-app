import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' 
import { AuthProvider } from './context/AuthContext' 
import './index.css'
import App from './App.tsx'

/**
 * @summary Entry point for the GMA Connect Partner Portal.
 * Initializes global providers so App.tsx can access Auth and Routing.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
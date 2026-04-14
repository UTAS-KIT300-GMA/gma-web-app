import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' 
import { AuthProvider } from './context/AuthContext' 
//import './index.css'
import "./styles/base.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/login.css";
import "./styles/layout.css";
import "./styles/sidebar.css";
import "./styles/cards.css";
import "./styles/analytics.css";
import "./styles/tags.css";
import "./styles/approval.css";
import "./styles/event-manage.css";
import "./styles/image-upload.css";
import "./styles/dashboard.css";
import "./styles/responsive.css";
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
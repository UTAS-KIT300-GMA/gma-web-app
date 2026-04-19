import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
//import './index.css'
import "./styles/shared/base.css";
import "./styles/shared/buttons.css";
import "./styles/shared/login.css";
import "./styles/shared/layout.css";
import "./styles/shared/sidebar.css";
import "./styles/shared/topbar.css";
import "./styles/shared/cards.css";
import "./styles/shared/tags.css";
import "./styles/shared/responsive.css";

import "./styles/admin/analytics.css";
import "./styles/admin/approval.css";
import "./styles/admin/event-manage.css";
import "./styles/admin/dashboard.css";

import "./styles/partner/forms.css";
import "./styles/partner/image-upload.css";
import "./styles/partner/dashboard.css";

import App from "./App.tsx";

/**
 * @summary Entry point for the GMA Connect Partner Portal.
 * Initializes global providers so App.tsx can access Auth and Routing.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

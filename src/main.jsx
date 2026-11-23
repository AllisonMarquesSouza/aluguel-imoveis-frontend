import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/forms.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/login.css';
import './styles/dashboard.css';
import './styles/management.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Falta VITE_GOOGLE_CLIENT_ID en las variables de entorno.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <div style={{ padding: '20px', textAlign: 'center', color: '#EF4444' }}>
        <h2>Error de Configuración</h2>
        <p>No se encontró el <strong>Client ID de Google</strong>. Por favor, añádelo como variable de entorno en Netlify.</p>
        <App /> {/* Renderizamos App de todos modos por si solo usas archivos locales */}
      </div>
    )}
  </React.StrictMode>,
);

// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext'; // <--- IMPORTAR

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> {/* <--- ENVOLVER LA APP */}
      <App />
      <Toaster position="bottom-center" />
    </ThemeProvider>
  </React.StrictMode>,
)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import { Toaster } from 'react-hot-toast'; // <--- 1. IMPORTAR
import Kiosk from "./pages/Kiosk";
import Kitchen from "./pages/Kitchen";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Waiter from "./pages/Waiter";

// --- COMPONENTE DE SEGURIDAD ---
// Este componente envuelve a los que queremos proteger
const RutaProtegida = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Escuchar si hay usuario logueado
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  if (cargando) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  
  // Si hay usuario, muestra el contenido. Si no, manda al Login.
  return usuario ? children : <Navigate to="/login" />;
};
// -------------------------------

function App() {
  return (
    <BrowserRouter>
    <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }} 
      />
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Kiosk />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas Privadas (Protegidas) */}
        <Route path="/admin" element={
          <RutaProtegida>
            <Admin />
          </RutaProtegida>
        } />
        
        <Route path="/cocina" element={
          <RutaProtegida>
            <Kitchen />
          </RutaProtegida>
        } />
        <Route path="/mesero" element={<Waiter />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
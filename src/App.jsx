// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Kiosk from "./pages/Kiosk";
import Kitchen from "./pages/Kitchen";
import Admin from "./pages/Admin"; // <--- 1. IMPORTAR

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Kiosk />} />
        <Route path="/cocina" element={<Kitchen />} />
        
        {/* 2. NUEVA RUTA DE ADMINISTRADOR */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
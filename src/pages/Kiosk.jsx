// src/App.jsx
import { useState } from "react";
import Menu from "../components/Menu";
import OrderSummary from "../components/OrderSummary"; // <--- IMPORTAR
import { Send } from "lucide-react";
import { useSearchParams } from "react-router-dom"; // <--- AGREGAR ESTO

export default function Kiosk() {
  // Leemos la URL
  const [searchParams] = useSearchParams();
  // Si dice ?mesa=5, guardamos "5". Si no, es null.
  const numeroMesa = searchParams.get("mesa");

  const [carrito, setCarrito] = useState([]);
  const [verOrden, setVerOrden] = useState(false); // <--- NUEVO ESTADO: ¿Estamos viendo el resumen?

  const agregarAlCarrito = (platillo) => {
    setCarrito([...carrito, platillo]);
  };

  // Función para borrar todo y volver al inicio
  const limpiarCarrito = () => {
    setCarrito([]);
    setVerOrden(false);
  };

  const total = carrito.reduce((suma, item) => suma + item.precio, 0);

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* SI "verOrden" ES TRUE, MOSTRAMOS EL RESUMEN Y TAPAMOS EL RESTO */}
      {verOrden && (
        <OrderSummary 
          carrito={carrito} 
          limpiarCarrito={limpiarCarrito} 
          cancelarOrden={() => setVerOrden(false)}
          numeroMesa={numeroMesa} // <--- PASAMOS EL DATO NUEVO
        />
      )}

      <header className="bg-white shadow p-4 sticky top-0 z-10">
        <h1 className="text-center font-black text-xl text-gray-800">🍔 RESTAURANTE APP</h1>
      </header>

      <Menu agregarAlCarrito={agregarAlCarrito} />

      {/* Solo mostramos la barra si hay items y NO estamos viendo ya el resumen */}
      {carrito.length > 0 && !verOrden && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-20">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">{carrito.length} productos</p>
              <p className="text-2xl font-black text-gray-900">${total}</p>
            </div>
            
            <button 
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 active:scale-95 transition-all"
              onClick={() => setVerOrden(true)} 
            >
              Ver Orden <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

//export default Kiosk;
// src/components/OrderSummary.jsx
import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function OrderSummary({ carrito, limpiarCarrito, cancelarOrden, numeroMesa }) {
  const [procesando, setProcesando] = useState(false);
  const [ordenId, setOrdenId] = useState(null);

  // Calcular total de nuevo
  const total = carrito.reduce((suma, item) => suma + item.precio, 0);

  const enviarOrden = async () => {
    setProcesando(true);

    try {
      // 1. Armamos el paquete de datos
        const orden = {
            items: carrito.map(item => ({ id: item.id, nombre: item.nombre, precio: item.precio })),
            total: total,
            fecha: serverTimestamp(),
            estado: "pendiente",
            // TRUCO: Si hay numeroMesa, ponemos "Mesa X", si no, "Barra"
            mesa: numeroMesa ? `Mesa ${numeroMesa}` : "Barra / Para Llevar" 
        };

      // 2. Lo enviamos a la colección "ordenes"
      const docRef = await addDoc(collection(db, "ordenes"), orden);

      // 3. Guardamos el ID que nos dio Firebase (ej: "8VMuVHi...")
      // Usaremos los últimos 4 caracteres como "Número de Ticket"
      setOrdenId(docRef.id.slice(-4).toUpperCase());
      
    } catch (error) {
      console.error("Error enviando orden:", error);
      alert("Hubo un error. Llama al mesero.");
    }
  };

  // Si ya tenemos ID, mostramos la pantalla de ÉXITO
  // Si ya tenemos ID, mostramos la pantalla de ÉXITO
if (ordenId) {
  return (
    <div className="fixed inset-0 bg-green-600 flex flex-col items-center justify-center text-white z-50 p-5 text-center">
      <h1 className="text-6xl mb-4">✅</h1>
      <h2 className="text-4xl font-bold mb-4">¡Orden Recibida!</h2>

      {numeroMesa ? (
        // --- OPCIÓN A: MODO MESA ---
        <div className="bg-white/20 p-8 rounded-xl mb-8 backdrop-blur-sm">
          <p className="text-xl">Relájate, llevaremos todo a la</p>
          <p className="text-5xl font-black mt-2">MESA {numeroMesa}</p>
        </div>
      ) : (
        // --- OPCIÓN B: MODO BARRA ---
        <>
          <p className="text-xl mb-4">Tu número de ticket es:</p>
          <div className="bg-white text-black text-6xl font-black p-8 rounded-2xl mb-8 tracking-widest">
            {ordenId}
          </div>
        </>
      )}

      <button 
        onClick={limpiarCarrito}
        className="bg-black/20 px-8 py-4 rounded-full font-bold hover:bg-black/30 transition border-2 border-white/50"
      >
        {numeroMesa ? "Pedir algo más" : "Nueva Orden"}
      </button>
    </div>
  );
}

  // Pantalla de Revisión
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-gray-100 p-4 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold">Resumen del Pedido</h2>
        <button onClick={cancelarOrden} className="text-red-500 font-bold">Cerrar</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {carrito.map((item, index) => (
          <div key={index} className="flex justify-between border-b py-4">
            <div>
              <p className="font-bold">{item.nombre}</p>
              <p className="text-sm text-gray-500">{item.descripcion}</p>
            </div>
            <p className="font-bold text-gray-700">${item.precio}</p>
          </div>
        ))}
      </div>

      <div className="p-5 border-t bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between text-2xl font-black mb-6">
          <span>Total:</span>
          <span>${total}</span>
        </div>

        <button 
          onClick={enviarOrden}
          disabled={procesando}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg ${procesando ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {procesando ? "Enviando..." : "Confirmar y Cocinar 👨‍🍳"}
        </button>
      </div>
    </div>
  );
}
// src/components/OrderSummary.jsx
import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Trash2, X, CheckCircle, MapPin } from "lucide-react";

export default function OrderSummary({ 
  carrito, 
  limpiarCarrito, 
  cancelarOrden, 
  numeroMesa, 
  idRestaurante, 
  eliminarDelCarrito 
}) {
  const [procesando, setProcesando] = useState(false);
  const [ordenId, setOrdenId] = useState(null);

  // Calcular total
  const total = carrito.reduce((suma, item) => suma + item.precio, 0);

  const enviarOrden = async () => {
    setProcesando(true);

    try {
      const orden = {
        items: carrito.map(item => ({ 
            id: item.id, 
            nombre: item.nombre, 
            precio: item.precio 
        })),
        total: total,
        fecha: serverTimestamp(),
        estado: "pendiente", 
        mesa: numeroMesa ? `Mesa ${numeroMesa}` : "Barra / Para Llevar",
        uid: idRestaurante 
      };

      const docRef = await addDoc(collection(db, "ordenes"), orden);
      setOrdenId(docRef.id.slice(-4).toUpperCase());
      
    } catch (error) {
      console.error("Error enviando orden:", error);
      alert("Hubo un error al enviar tu pedido.");
      setProcesando(false);
    }
  };

  // --- PANTALLA DE ÉXITO ---
  if (ordenId) {
    return (
      <div className="fixed inset-0 bg-green-600 flex flex-col items-center justify-center text-white z-50 p-6 text-center animate-in fade-in duration-300">
        <div className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur-sm">
            <CheckCircle size={64} />
        </div>
        
        <h2 className="text-4xl font-black mb-2">¡Orden Recibida!</h2>
        
        {numeroMesa ? (
          <div className="bg-white/10 p-8 rounded-2xl mb-8 backdrop-blur-md border border-white/20 mt-4 w-full max-w-md">
            <p className="text-xl opacity-90">Llevaremos todo a la</p>
            <div className="flex items-center justify-center gap-3 mt-2">
                <MapPin size={32} />
                <p className="text-5xl font-black">MESA {numeroMesa}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 mb-8">
            <p className="text-xl mb-4 opacity-90">Tu número de ticket es:</p>
            <div className="bg-white text-gray-900 text-6xl font-black p-8 rounded-3xl tracking-widest shadow-2xl">
              {ordenId}
            </div>
          </div>
        )}
        
        <button 
          onClick={limpiarCarrito}
          className="bg-white text-green-700 px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-lg active:scale-95"
        >
          {numeroMesa ? "Pedir algo más" : "Nueva Orden"}
        </button>
      </div>
    );
  }

  // --- PANTALLA DE CARRITO ---
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
        <div className="w-full md:w-[500px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            <div className="bg-gray-50 p-5 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-2xl font-black text-gray-800">Tu Pedido</h2>
                <button 
                    onClick={cancelarOrden} 
                    className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition"
                >
                    <X size={24} className="text-gray-600" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {carrito.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>Tu carrito está vacío 😢</p>
                    </div>
                ) : (
                    carrito.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                {/* --- AQUÍ ARREGLAMOS LA IMAGEN --- */}
                                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                                    {item.imagen?.includes("http") ? (
                                        <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl">{item.imagen || "🍽️"}</span>
                                    )}
                                </div>
                                {/* --------------------------------- */}
                                
                                <div>
                                    <p className="font-bold text-gray-800 leading-tight">{item.nombre}</p>
                                    <p className="text-sm text-green-600 font-bold">${item.precio}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => eliminarDelCarrito(index)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-lg transition-all"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 border-t bg-gray-50 safe-area-bottom">
                <div className="flex justify-between text-xl mb-6">
                    <span className="text-gray-500">Total a pagar:</span>
                    <span className="font-black text-gray-900 text-2xl">${total}</span>
                </div>

                <button 
                    onClick={enviarOrden}
                    disabled={procesando || carrito.length === 0}
                    className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2
                        ${procesando || carrito.length === 0 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {procesando ? "Enviando..." : <>Confirmar Pedido <CheckCircle size={20} /></>}
                </button>
            </div>
        </div>
    </div>
  );
}
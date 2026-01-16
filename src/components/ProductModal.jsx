// src/components/ProductModal.jsx
import { useState } from "react";
import { X, Minus, Plus, MessageSquare } from "lucide-react";
import toast from 'react-hot-toast';

export default function ProductModal({ producto, cerrar, agregarAlCarrito }) {
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");

  if (!producto) return null;

  const incrementar = () => setCantidad(c => c + 1);
  const decrementar = () => setCantidad(c => (c > 1 ? c - 1 : 1));

  const confirmar = () => {
    // CORRECCIÓN: Eliminamos la variable sin usar y hacemos el loop directo
    for (let i = 0; i < cantidad; i++) {
        agregarAlCarrito({ 
            ...producto, 
            nota: nota,
            // Agregamos un ID temporal único para evitar errores de "key" en React
            idTemp: Date.now() + i 
        });
    }

    toast.success(`Agregado: ${cantidad}x ${producto.nombre}`, { 
        icon: '📝',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
    cerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Tarjeta del Modal */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Imagen Gigante */}
        <div className="h-48 md:h-56 bg-gray-100 relative">
          <button 
            onClick={cerrar}
            className="absolute top-4 right-4 bg-white/50 hover:bg-white p-2 rounded-full backdrop-blur-md transition z-10"
          >
            <X size={24} className="text-gray-800" />
          </button>
          
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            {producto.imagen?.includes("http") ? (
                <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
                <span className="text-8xl select-none">{producto.imagen || "🍽️"}</span>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-black text-gray-800 leading-tight">{producto.nombre}</h2>
            <span className="text-xl font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                ${producto.precio}
            </span>
          </div>
          
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {producto.descripcion || "Una deliciosa elección para disfrutar."}
          </p>

          {/* Notas del Cliente */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                <MessageSquare size={14} /> Instrucciones especiales
            </label>
            <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
                rows="2"
                placeholder="Ej. Sin cebolla, carne bien cocida..."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
            ></textarea>
          </div>

          {/* Controles de Cantidad y Botón */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                <button onClick={decrementar} className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition">
                    <Minus size={18} />
                </button>
                <span className="font-black text-xl w-6 text-center">{cantidad}</span>
                <button onClick={incrementar} className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition">
                    <Plus size={18} />
                </button>
            </div>

            <button 
                onClick={confirmar}
                className="flex-1 bg-slate-900 text-white h-12 rounded-xl font-bold text-lg hover:bg-black active:scale-95 transition flex items-center justify-center gap-2 shadow-xl"
            >
                <span>Agregar</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-normal">
                    ${(producto.precio * cantidad).toFixed(2)}
                </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
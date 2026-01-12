// src/pages/Kitchen.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CheckCircle, Clock, MapPin } from "lucide-react"; // <--- Agregué el icono MapPin

export default function Kitchen() {
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "ordenes"),
      where("estado", "==", "pendiente"),
      orderBy("fecha", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordenesNuevas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrdenes(ordenesNuevas);
    });

    return () => unsubscribe();
  }, []);

  const completarOrden = async (id) => {
    try {
      const ordenRef = doc(db, "ordenes", id);
      await updateDoc(ordenRef, { estado: "terminado" });
    } catch (error) {
      console.error("Error completando orden:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 p-6 text-white">
      <header className="flex justify-between items-center mb-8 border-b border-slate-600 pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          👨‍🍳 Monitor de Cocina
        </h1>
        <div className="bg-slate-700 px-4 py-2 rounded-lg">
          <span className="text-green-400 font-bold">{ordenes.length}</span> pendientes
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ordenes.map((orden) => (
          <div key={orden.id} className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-xl animate-pulse-once">
            
            {/* --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE --- */}
            <div className="bg-yellow-400 p-4">
              <div className="flex justify-between items-start">
                <div>
                  {/* Muestra la MESA o BARRA en grande */}
                  <h2 className="font-black text-xl flex items-center gap-2">
                     <MapPin size={20} /> {orden.mesa || "Barra / Para Llevar"}
                  </h2>
                  <p className="text-xs font-bold text-gray-700 mt-1">
                    Ticket: #{orden.id.slice(-4).toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-sm font-bold opacity-70 bg-white/30 px-2 py-1 rounded">
                  <Clock size={16} />
                  {orden.fecha ? new Date(orden.fecha.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                </div>
              </div>
            </div>
            {/* -------------------------------------- */}

            <div className="p-5">
              <ul className="space-y-3 mb-6">
                {orden.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 border-b border-dashed border-gray-300 pb-2">
                    <span className="font-bold text-gray-800">1x</span>
                    <span className="text-gray-700 leading-tight">{item.nombre}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => completarOrden(orden.id)}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-slate-700 transition-colors"
              >
                <CheckCircle /> Orden Lista
              </button>
            </div>
          </div>
        ))}

        {ordenes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-500 mt-20">
            <p className="text-2xl">Todo tranquilo por ahora... 😴</p>
          </div>
        )}
      </div>
    </div>
  );
}
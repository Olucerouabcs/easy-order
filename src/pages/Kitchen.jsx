// src/pages/Kitchen.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CheckCircle, Clock, MapPin, Settings, ChefHat, Bell } from "lucide-react";
import toast from 'react-hot-toast';

export default function Kitchen() {
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "ordenes"),
      where("uid", "==", auth.currentUser.uid),
      where("estado", "==", "pendiente"),
      orderBy("fecha", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrdenes(docs);
    });
    return () => unsubscribe();
  }, []);

  const completarOrden = async (id) => {
    try {
      const ordenRef = doc(db, "ordenes", id);
      await updateDoc(ordenRef, { estado: "terminado" });
      toast.success("¡Orden lista para entregar!", { icon: '🛎️' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-mono">
      {/* Header Tipo Industrial */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-700 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-900/50">
            <ChefHat size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">KDS / COCINA</h1>
            <p className="text-slate-400 text-sm">Sistema de Visualización en Tiempo Real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link to="/admin" className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition border border-slate-700">
            <Settings size={18} /> Admin
          </Link>
          <div className="flex-1 md:flex-none bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-3">
             <Bell className={ordenes.length > 0 ? "text-red-500 animate-bounce" : "text-slate-500"} />
             <span className="text-2xl font-black text-white">{ordenes.length}</span>
             <span className="text-xs text-slate-400 uppercase font-bold">Pendientes</span>
          </div>
        </div>
      </header>

      {/* GRILLA DE TICKETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ordenes.map((orden) => (
          <div key={orden.id} className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 border-t-8 border-yellow-400">
            
            {/* Cabecera Ticket */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="font-black text-2xl flex items-center gap-2 text-gray-800">
                   <MapPin className="text-red-500" size={24} /> 
                   {orden.mesa?.replace("Mesa ", "") || "BARRA"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    {orden.mesa ? "Comedor" : "Para Llevar"}
                  </span>
                  <span className="text-xs font-mono text-gray-400">#{orden.id.slice(-4)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-gray-500">
                <Clock size={16} />
                {orden.fecha ? new Date(orden.fecha.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
              </div>
            </div>

            {/* Lista de Items */}
            <div className="p-5 flex-1 bg-white">
              <ul className="space-y-4">
                {orden.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg shrink-0">1</span>
                    <span className="text-xl font-bold text-gray-700 leading-tight">{item.nombre}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botón Acción */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => completarOrden(orden.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black text-lg uppercase tracking-wider flex justify-center items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-200"
              >
                <CheckCircle size={24} /> Completar
              </button>
            </div>
          </div>
        ))}

        {ordenes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-500 mt-20 opacity-50">
            <ChefHat size={80} strokeWidth={1} />
            <p className="text-2xl mt-4 font-light">Cocina al día. Buen trabajo chef.</p>
          </div>
        )}
      </div>
    </div>
  );
}
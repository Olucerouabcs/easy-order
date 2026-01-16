// src/pages/Kitchen.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // <--- Recuperamos el Link
import { auth, db } from "../firebase/config";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { CheckCircle, Clock, ChefHat, User, ArrowLeft } from "lucide-react"; // <--- Iconos nuevos
import toast from 'react-hot-toast';

export default function Kitchen() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchamos solo las órdenes PENDIENTES o PREPARANDO
    const q = query(
      collection(db, "ordenes"),
      where("uid", "==", auth.currentUser?.uid),
      where("estado", "in", ["pendiente", "preparando"]) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar por fecha (las viejas primero)
      lista.sort((a, b) => a.fecha?.seconds - b.fecha?.seconds);
      setOrdenes(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const avanzarEstado = async (orden) => {
    const ref = doc(db, "ordenes", orden.id);
    
    if (orden.estado === "pendiente") {
        await updateDoc(ref, { estado: "preparando" });
        toast("👨‍🍳 Preparando...", { icon: '🔥' });
    } else if (orden.estado === "preparando") {
        // Pasa a "listo" para que aparezca en la Caja del Admin y se cobre
        await updateDoc(ref, { estado: "listo" }); 
        toast.success("¡Platillo listo para servir!"); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando comandas...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      
      {/* BARRA DE NAVEGACIÓN (RECUPERADA) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-xl text-white shadow-lg shadow-orange-500/20">
                <ChefHat size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cocina (KDS)</h1>
                <p className="text-slate-500 font-medium">Sistema de Pantalla de Cocina</p>
            </div>
        </div>
        
        <Link 
            to="/admin" 
            className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-slate-200 shadow-sm transition active:scale-95"
        >
            <ArrowLeft size={20}/> Volver al Admin
        </Link>
      </div>

      {/* GRID DE ÓRDENES */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {ordenes.map((orden) => (
          <div key={orden.id} className={`bg-white rounded-2xl shadow-md overflow-hidden border-l-8 flex flex-col animate-in fade-in zoom-in-95 duration-300 ${orden.estado === 'pendiente' ? 'border-blue-500' : 'border-orange-500'}`}>
            
            {/* Header del Ticket */}
            <div className={`p-3 text-white flex justify-between items-center ${orden.estado === 'pendiente' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                <span className="font-bold text-lg">#{orden.id.slice(-4).toUpperCase()}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono font-bold">
                    {orden.fecha ? new Date(orden.fecha.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                </span>
            </div>

            <div className="p-4 flex-1">
                <p className="font-black text-2xl text-gray-800 mb-2">{orden.mesa}</p>
                <div className="border-b border-gray-100 mb-3"></div>
                
                <ul className="space-y-4">
                    {orden.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 border-b border-dashed border-gray-100 pb-3 last:border-0">
                            <span className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg shrink-0">1</span>
                            <div className="flex-1">
                                <span className="text-xl font-bold text-gray-700 leading-tight block">{item.nombre}</span>
                                {item.nota && (
                                    <p className="text-red-600 bg-red-50 p-2 rounded-lg mt-2 text-sm font-bold border border-red-100 break-words whitespace-pre-wrap leading-snug">
                                        ⚠️ {item.nota}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Botón de Acción */}
            <button 
                onClick={() => avanzarEstado(orden)}
                className={`w-full py-4 font-bold text-white text-lg flex justify-center items-center gap-2 transition active:scale-95 ${orden.estado === 'pendiente' ? 'bg-slate-700 hover:bg-slate-800' : 'bg-green-600 hover:bg-green-700'}`}
            >
                {orden.estado === 'pendiente' ? <>Empezar <Clock/></> : <>Terminar <CheckCircle/></>}
            </button>
          </div>
        ))}

        {ordenes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 opacity-50 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50">
                <ChefHat size={64} className="mb-4"/>
                <p className="text-2xl font-bold">Todo tranquilo por ahora...</p>
                <p>Esperando nuevas comandas.</p>
            </div>
        )}
      </div>
    </div>
  );
}
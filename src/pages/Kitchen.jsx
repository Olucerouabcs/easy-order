// src/pages/Kitchen.jsx
import { useEffect, useState, useRef } from "react"; 
import { Link } from "react-router-dom"; 
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth"; // <--- Importante
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { CheckCircle, Clock, ChefHat, ArrowLeft, Moon, Sun } from "lucide-react"; 
import toast from 'react-hot-toast';
import { useTheme } from "../context/ThemeContext";

const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function Kitchen() {
  const { theme, toggleTheme } = useTheme();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const audioRef = useRef(new Audio(SOUND_URL));
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // CORRECCIÓN: Usamos onAuthStateChanged para detectar el usuario de forma segura
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Si hay usuario, escuchamos las órdenes
        const q = query(
            collection(db, "ordenes"),
            where("uid", "==", user.uid),
            where("estado", "in", ["pendiente", "preparando"]) 
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            lista.sort((a, b) => (a.fecha?.seconds || 0) - (b.fecha?.seconds || 0));
            
            setOrdenes(lista);
            setLoading(false);

            const hayNuevas = snapshot.docChanges().some(change => change.type === 'added');
            
            if (hayNuevas && !isFirstLoad.current) {
                audioRef.current.play().catch(e => console.log("Audio bloqueado:", e));
                toast("¡Nueva Orden!", { icon: '🔔', duration: 4000 });
            }
            isFirstLoad.current = false;
        });

        // Limpieza interna del snapshot si cambia el usuario (raro pero posible)
        return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  const avanzarEstado = async (orden) => {
    const ref = doc(db, "ordenes", orden.id);
    if (orden.estado === "pendiente") {
        await updateDoc(ref, { estado: "preparando" });
        toast("👨‍🍳 Preparando...", { icon: '🔥' });
    } else if (orden.estado === "preparando") {
        await updateDoc(ref, { estado: "listo" }); 
        toast.success("¡Listo para servir!"); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-xl text-white shadow-lg">
                <ChefHat size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Cocina (KDS)</h1>
                <p className="text-slate-500 dark:text-gray-400 font-medium">Pantalla de Cocina</p>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button onClick={toggleTheme} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-gray-700 dark:text-white hover:scale-105 transition">
                {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <Link to="/admin" className="bg-white dark:bg-slate-800 dark:text-white hover:bg-slate-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition">
                <ArrowLeft size={20}/> Volver
            </Link>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {ordenes.map((orden) => (
          <div key={orden.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden border-l-8 flex flex-col animate-in fade-in zoom-in-95 duration-300 ${orden.estado === 'pendiente' ? 'border-blue-500' : 'border-orange-500'}`}>
            
            <div className={`p-3 text-white flex justify-between items-center ${orden.estado === 'pendiente' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                <span className="font-bold text-lg">#{orden.numeroTicket || "?"}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono font-bold">
                    {orden.fecha ? new Date(orden.fecha.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                </span>
            </div>

            <div className="p-4 flex-1">
                <p className="font-black text-2xl text-gray-800 dark:text-white mb-2">{orden.mesa}</p>
                <div className="border-b border-gray-100 dark:border-slate-700 mb-3"></div>
                
                <ul className="space-y-4">
                    {orden.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 border-b border-dashed border-gray-100 dark:border-slate-700 pb-3 last:border-0">
                            <span className="bg-slate-900 dark:bg-slate-700 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg shrink-0">1</span>
                            <div className="flex-1">
                                <span className="text-xl font-bold text-gray-700 dark:text-gray-200 leading-tight block">{item.nombre}</span>
                                {item.nota && (
                                    <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg mt-2 text-sm font-bold border border-red-100 dark:border-red-800">
                                        ⚠️ {item.nota}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <button 
                onClick={() => avanzarEstado(orden)}
                className={`w-full py-4 font-bold text-white text-lg flex justify-center items-center gap-2 transition active:scale-95 ${orden.estado === 'pendiente' ? 'bg-slate-700 hover:bg-slate-800' : 'bg-green-600 hover:bg-green-700'}`}
            >
                {orden.estado === 'pendiente' ? <>Empezar <Clock/></> : <>Terminar <CheckCircle/></>}
            </button>
          </div>
        ))}

        {ordenes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 opacity-50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
                <ChefHat size={64} className="mb-4"/>
                <p className="text-2xl font-bold">Todo tranquilo...</p>
            </div>
        )}
      </div>
    </div>
  );
}
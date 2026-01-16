// src/pages/Waiter.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { Utensils, MonitorSmartphone, LogOut, ArrowRight, AlertTriangle, Moon, Sun } from "lucide-react"; 
import { useTheme } from "../context/ThemeContext"; // <--- IMPORTAR CONTEXTO
import toast from 'react-hot-toast';

export default function Waiter() {
  const { theme, toggleTheme } = useTheme(); // <--- USAR HOOK
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get("id");

  const [meseroActual, setMeseroActual] = useState(() => {
    if (restaurantId) return localStorage.getItem(`mesero_sesion_${restaurantId}`);
    return null;
  });

  const [pinInput, setPinInput] = useState("");
  const [ordenesActivas, setOrdenesActivas] = useState([]);
  const [mesasReales, setMesasReales] = useState([]); 

  useEffect(() => {
    if (!restaurantId || !meseroActual) return;
    const qMesas = query(collection(db, "mesas"), where("uid", "==", restaurantId));
    const unsubMesas = onSnapshot(qMesas, (snap) => {
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        lista.sort((a, b) => Number(a.numero) - Number(b.numero));
        setMesasReales(lista);
    });
    const qOrdenes = query(collection(db, "ordenes"), where("uid", "==", restaurantId), where("estado", "in", ["pendiente", "preparando", "listo"]));
    const unsubOrdenes = onSnapshot(qOrdenes, (snapshot) => setOrdenesActivas(snapshot.docs.map(doc => doc.data())));
    return () => { unsubMesas(); unsubOrdenes(); };
  }, [restaurantId, meseroActual]);

  const handleLogin = async (e) => {
      e.preventDefault();
      if(!pinInput) return;
      try {
          const q = query(collection(db, "meseros"), where("uid", "==", restaurantId), where("pin", "==", pinInput));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
              const datosMesero = snapshot.docs[0].data();
              localStorage.setItem(`mesero_sesion_${restaurantId}`, datosMesero.nombre);
              setMeseroActual(datosMesero.nombre);
              toast.success(`¡Hola, ${datosMesero.nombre}! 👋`);
          } else {
              toast.error("PIN incorrecto");
              setPinInput("");
          }
      } catch (error) { console.error(error); toast.error("Error al validar PIN"); }
  };

  const cerrarSesion = () => {
      localStorage.removeItem(`mesero_sesion_${restaurantId}`);
      setMeseroActual(null); setPinInput("");
  };

  const getEstadoMesa = (num) => ordenesActivas.find(o => o.mesa === `Mesa ${num}`) ? 'ocupada' : 'libre';
  const irAMesa = (num) => navigate(`/?id=${restaurantId}&mesa=${num}&mode=waiter&mesero=${encodeURIComponent(meseroActual)}`);

  if (!restaurantId) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p>Falta ID de restaurante</p></div>;

  // --- VISTA LOGIN ---
  if (!meseroActual) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
              <div className="absolute top-4 right-4"><button onClick={toggleTheme} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-md text-gray-600 dark:text-white">{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button></div>
              <div className="w-full max-w-sm">
                  <div className="text-center mb-8">
                      <div className="inline-block bg-orange-500 p-4 rounded-2xl mb-4 shadow-lg shadow-orange-500/20"><Utensils size={32} className="text-white"/></div>
                      <h1 className="text-3xl font-black text-gray-800 dark:text-white">Acceso Personal</h1>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">Ingresa tu PIN de 4 dígitos</p>
                  </div>
                  <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl">
                      <input type="password" maxLength="4" className="w-full bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white text-center text-4xl font-mono tracking-[1em] py-4 rounded-xl border border-gray-200 dark:border-slate-600 focus:border-orange-500 outline-none mb-6" placeholder="••••" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus />
                      <div className="grid grid-cols-3 gap-3 mb-6">
                          {[1,2,3,4,5,6,7,8,9].map(n => (<button key={n} type="button" onClick={() => setPinInput(prev => (prev.length < 4 ? prev + n : prev))} className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-white text-2xl font-bold py-4 rounded-xl transition">{n}</button>))}
                          <button type="button" onClick={() => setPinInput("")} className="bg-red-50 dark:bg-red-900/30 text-red-500 font-bold rounded-xl flex items-center justify-center">C</button>
                          <button type="button" onClick={() => setPinInput(prev => (prev.length < 4 ? prev + 0 : prev))} className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-white text-2xl font-bold py-4 rounded-xl transition">0</button>
                          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-600/20"><ArrowRight/></button>
                      </div>
                  </form>
              </div>
          </div>
      );
  }

  // --- VISTA MAPA MESAS ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white p-6 pb-32 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/20"><Utensils size={28} className="text-white"/></div>
            <div><h1 className="text-2xl font-black">Hola, {meseroActual}</h1><p className="text-gray-500 dark:text-gray-400 text-sm">Selecciona una mesa</p></div>
        </div>
        <div className="flex gap-2">
            <button onClick={toggleTheme} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={cerrarSesion} className="bg-white dark:bg-slate-800 hover:bg-gray-50 px-5 py-3 rounded-xl font-bold flex items-center gap-2 border border-gray-200 dark:border-slate-700 transition shadow-sm"><LogOut size={18}/> Salir</button>
        </div>
      </div>

      {mesasReales.length === 0 ? (
          <div className="text-center py-20"><MonitorSmartphone size={48} className="mx-auto text-gray-300 mb-4"/><h3 className="text-xl font-bold text-gray-400">Sin mesas configuradas</h3></div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {mesasReales.map((mesa) => {
                const esOcupada = getEstadoMesa(mesa.numero) === 'ocupada';
                return (
                    <button key={mesa.id} onClick={() => irAMesa(mesa.numero)} className={`relative h-48 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all duration-300 group shadow-sm hover:shadow-xl ${esOcupada ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-800 border-2 border-transparent hover:border-emerald-400 dark:hover:border-emerald-500'}`}>
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner ${esOcupada ? 'bg-red-500 text-white' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>{mesa.numero}</div>
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${esOcupada ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>{esOcupada ? "Ocupada" : "Libre"}</span>
                    </button>
                );
            })}
          </div>
      )}
      <div className="fixed bottom-0 left-0 w-full p-4 pointer-events-none flex justify-center pb-8 z-10">
        <button onClick={() => navigate(`/?id=${restaurantId}&mode=waiter&mesero=${encodeURIComponent(meseroActual)}`)} className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 hover:scale-105 transition active:scale-95 border-4 border-white dark:border-slate-800">🛍️ Para Llevar / Barra</button>
      </div>
    </div>
  );
}
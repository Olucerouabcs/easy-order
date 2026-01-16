// src/pages/Waiter.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { Utensils, MonitorSmartphone, LogOut, ArrowRight, AlertTriangle } from "lucide-react"; // Utensils, etc
import toast from 'react-hot-toast';

export default function Waiter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 1. Obtener el ID del Restaurante desde la URL
  const restaurantId = searchParams.get("id");

  // --- CORRECCIÓN: INICIALIZACIÓN PEREZOSA ---
  // Leemos el localStorage DIRECTAMENTE al crear el estado.
  // Esto evita el error de "Cascading renders" y elimina la necesidad de useEffect.
  const [meseroActual, setMeseroActual] = useState(() => {
    if (restaurantId) {
        return localStorage.getItem(`mesero_sesion_${restaurantId}`);
    }
    return null;
  });

  const [pinInput, setPinInput] = useState("");
  
  const [ordenesActivas, setOrdenesActivas] = useState([]);
  const [mesasReales, setMesasReales] = useState([]); 

  // --- EFECTO: CARGAR DATOS DE FIREBASE ---
  // Solo se ejecuta si ya tenemos un mesero logueado
  useEffect(() => {
    if (!restaurantId || !meseroActual) return;

    // A. Escuchar Mesas
    const qMesas = query(collection(db, "mesas"), where("uid", "==", restaurantId));
    const unsubMesas = onSnapshot(qMesas, (snap) => {
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        lista.sort((a, b) => Number(a.numero) - Number(b.numero));
        setMesasReales(lista);
    });
    
    // B. Escuchar Órdenes
    const qOrdenes = query(collection(db, "ordenes"), where("uid", "==", restaurantId), where("estado", "in", ["pendiente", "preparando", "listo"]));
    const unsubOrdenes = onSnapshot(qOrdenes, (snapshot) => {
      setOrdenesActivas(snapshot.docs.map(doc => doc.data()));
    });

    return () => { unsubMesas(); unsubOrdenes(); };
  }, [restaurantId, meseroActual]);

  // --- LÓGICA DE LOGIN CON PIN ---
  const handleLogin = async (e) => {
      e.preventDefault();
      if(!pinInput) return;

      try {
          const q = query(collection(db, "meseros"), where("uid", "==", restaurantId), where("pin", "==", pinInput));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
              const datosMesero = snapshot.docs[0].data();
              // GUARDAR SESIÓN EN MEMORIA
              localStorage.setItem(`mesero_sesion_${restaurantId}`, datosMesero.nombre);
              setMeseroActual(datosMesero.nombre);
              toast.success(`¡Hola, ${datosMesero.nombre}! 👋`);
          } else {
              toast.error("PIN incorrecto");
              setPinInput("");
          }
      } catch (error) {
          console.error(error);
          toast.error("Error al validar PIN");
      }
  };

  const cerrarSesion = () => {
      localStorage.removeItem(`mesero_sesion_${restaurantId}`);
      setMeseroActual(null);
      setPinInput("");
  };

  const getEstadoMesa = (num) => {
    const ocupada = ordenesActivas.find(o => o.mesa === `Mesa ${num}`);
    return ocupada ? 'ocupada' : 'libre';
  };

  const irAMesa = (num) => {
    navigate(`/?id=${restaurantId}&mesa=${num}&mode=waiter`);
  };

  // --- VISTAS ---

  if (!restaurantId) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
              <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700">
                  <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
                  <h1 className="text-2xl font-bold text-white mb-2">Enlace Incompleto</h1>
                  <p className="text-slate-400">Pide al administrador que te comparta el "Link de Acceso a Meseros".</p>
              </div>
          </div>
      );
  }

  // --- LOGIN (PIN PAD) ---
  if (!meseroActual) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
              <div className="w-full max-w-sm">
                  <div className="text-center mb-8">
                      <div className="inline-block bg-orange-500 p-4 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
                          <Utensils size={32} className="text-white"/>
                      </div>
                      <h1 className="text-3xl font-black text-white">Acceso Personal</h1>
                      <p className="text-slate-400 mt-2">Ingresa tu PIN de 4 dígitos</p>
                  </div>

                  <form onSubmit={handleLogin} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl">
                      <input 
                        type="password" 
                        maxLength="4"
                        className="w-full bg-slate-900 text-white text-center text-4xl font-mono tracking-[1em] py-4 rounded-xl border border-slate-600 focus:border-orange-500 outline-none mb-6 placeholder:tracking-normal placeholder:text-lg"
                        placeholder="••••"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        autoFocus
                      />
                      
                      {/* Teclado Numérico */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                              <button key={n} type="button" onClick={() => setPinInput(prev => (prev.length < 4 ? prev + n : prev))} className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-bold py-4 rounded-xl transition">{n}</button>
                          ))}
                          <button type="button" onClick={() => setPinInput("")} className="bg-red-900/50 text-red-400 font-bold rounded-xl flex items-center justify-center">C</button>
                          <button type="button" onClick={() => setPinInput(prev => (prev.length < 4 ? prev + 0 : prev))} className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-bold py-4 rounded-xl transition">0</button>
                          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white rounded-xl flex items-center justify-center"><ArrowRight/></button>
                      </div>
                      <p className="text-center text-xs text-slate-500">Sistema SaborSaaS</p>
                  </form>
              </div>
          </div>
      );
  }

  // --- MAPA DE MESAS (LOGUEADO) ---
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/20"><Utensils size={28} className="text-white"/></div>
            <div>
                <h1 className="text-2xl font-black">Hola, {meseroActual}</h1>
                <p className="text-slate-400 text-sm">Selecciona una mesa para atender</p>
            </div>
        </div>
        <button onClick={cerrarSesion} className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 border border-slate-700 transition active:scale-95">
            <LogOut size={18}/> Salir
        </button>
      </div>

      {mesasReales.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-700">
              <MonitorSmartphone size={48} className="mx-auto text-slate-600 mb-4"/>
              <h3 className="text-xl font-bold text-slate-400">No hay mesas configuradas</h3>
              <p className="text-slate-500 mt-2">El administrador debe crear mesas primero.</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {mesasReales.map((mesa) => {
                const esOcupada = getEstadoMesa(mesa.numero) === 'ocupada';
                return (
                    <button key={mesa.id} onClick={() => irAMesa(mesa.numero)} className={`relative h-48 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${esOcupada ? 'bg-red-900/20 border-2 border-red-500/50 hover:border-red-500' : 'bg-emerald-900/10 border-2 border-emerald-500/30 hover:border-emerald-400 hover:scale-105 shadow-2xl'}`}>
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner ${esOcupada ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>{mesa.numero}</div>
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${esOcupada ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{esOcupada ? "Ocupada" : "Libre"}</span>
                    </button>
                );
            })}
          </div>
      )}
      <div className="fixed bottom-0 left-0 w-full p-4 pointer-events-none flex justify-center pb-8">
        <button onClick={() => navigate(`/?id=${restaurantId}&mode=waiter`)} className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 hover:scale-105 transition active:scale-95 border-4 border-slate-900">🛍️ Para Llevar / Barra</button>
      </div>
    </div>
  );
}
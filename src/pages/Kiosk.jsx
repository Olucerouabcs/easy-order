// src/pages/Kiosk.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Lock, LogOut, X, ArrowLeft, Moon, Sun } from "lucide-react"; 
import Menu from "../components/Menu";
import OrderSummary from "../components/OrderSummary";
import ProductModal from "../components/ProductModal";
import { useTheme } from "../context/ThemeContext"; 

export default function Kiosk() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); 
  
  const numeroMesa = searchParams.get("mesa");
  const idRestaurante = searchParams.get("id");
  const mode = searchParams.get("mode"); 
  const nombreMesero = searchParams.get("mesero");
  
  const isKioskMode = mode === "kiosk";
  const isWaiterMode = mode === "waiter"; 

  useEffect(() => {
    if (!idRestaurante) {
      navigate("/login");
    }
  }, [idRestaurante, navigate]);

  const [config, setConfig] = useState({
      nombreRestaurante: "Cargando...",
      colorPrimario: "#ea580c", 
      colorFondo: "#f3f4f6"
  });

  const [platillos, setPlatillos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [verOrden, setVerOrden] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCandado, setMostrarCandado] = useState(false);
  const [passwordSalida, setPasswordSalida] = useState("");
  const [errorSalida, setErrorSalida] = useState("");

  useEffect(() => {
    if (!idRestaurante) return;
    const cargarTodo = async () => {
        try {
            const configRef = doc(db, "configuracion", idRestaurante);
            const configSnap = await getDoc(configRef);
            if (configSnap.exists()) setConfig(configSnap.data());

            const q = query(collection(db, "menu"), where("uid", "==", idRestaurante));
            const respuesta = await getDocs(q);
            setPlatillos(respuesta.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };
    cargarTodo();
  }, [idRestaurante]);

  const agregarAlCarrito = (item) => { setCarrito((prev) => [...prev, item]); };
  const eliminarDelCarrito = (index) => { const nuevo = [...carrito]; nuevo.splice(index, 1); setCarrito(nuevo); };
  const limpiarCarrito = () => { setCarrito([]); setVerOrden(false); };

  const intentarSalir = async (e) => {
    e.preventDefault();
    if (!auth.currentUser?.email) return;
    try { 
        await signInWithEmailAndPassword(auth, auth.currentUser.email, passwordSalida); 
        navigate("/admin"); 
    } catch (error) { // <--- CORRECCIÓN: Usamos 'error' y lo logueamos
        console.error(error);
        setErrorSalida("Contraseña incorrecta"); 
    }
  };

  if (!idRestaurante) return null;
  if (cargando) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 dark:bg-slate-950">Cargando...</div>;

  return (
    <div className="min-h-screen pb-24 relative transition-colors duration-500 dark:bg-slate-950" 
         style={{ backgroundColor: theme === 'dark' ? '#020617' : config.colorFondo }}>
      
      <header className="bg-white dark:bg-slate-900 shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3">
            {isWaiterMode && (
                <button onClick={() => navigate(`/mesero?id=${idRestaurante}`)} className="bg-gray-100 dark:bg-slate-800 p-2 rounded-full hover:bg-gray-200 dark:text-white transition">
                    <ArrowLeft size={20} />
                </button>
            )}
            <div>
                <h1 className="font-black text-xl text-gray-800 dark:text-white leading-none tracking-tight">
                    {numeroMesa ? `Mesa ${numeroMesa}` : config.nombreRestaurante}
                </h1>
                <div className="flex items-center gap-1">
                    {isWaiterMode && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase">Staff</span>}
                    <span className="text-[10px] text-gray-400 font-medium">Powered by MeLu</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-white transition">
                {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            {isKioskMode && (
              <button onClick={() => setMostrarCandado(true)} className="text-gray-300 hover:text-red-500 transition"><Lock size={20} /></button>
            )}
        </div>
      </header>

      {mostrarCandado && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-gray-800">Admin Access</h3><button onClick={() => setMostrarCandado(false)}><X /></button></div>
            <form onSubmit={intentarSalir}>
              <input type="password" placeholder="Contraseña..." className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-orange-500" value={passwordSalida} onChange={(e) => setPasswordSalida(e.target.value)} autoFocus />
              {errorSalida && <p className="text-red-500 text-sm mb-3">{errorSalida}</p>}
              <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 flex justify-center gap-2"><LogOut size={18} /> Salir</button>
            </form>
          </div>
        </div>
      )}

      <div className="pt-4">
          <Menu 
            agregarAlCarrito={(item) => setProductoSeleccionado(item)} 
            platillos={platillos}
            estiloMarca={{ color: config.colorPrimario }} 
          />
      </div>

      {productoSeleccionado && (
        <ProductModal 
          producto={productoSeleccionado}
          cerrar={() => setProductoSeleccionado(null)}
          agregarAlCarrito={(item) => agregarAlCarrito(item)}
          colorBoton={config.colorPrimario} 
        />
      )}

      {verOrden && (
        <OrderSummary 
          carrito={carrito} 
          limpiarCarrito={limpiarCarrito} 
          eliminarDelCarrito={eliminarDelCarrito}
          cancelarOrden={() => setVerOrden(false)}
          idRestaurante={idRestaurante}
          numeroMesa={numeroMesa}
          colorBoton={config.colorPrimario}
          nombreMesero={nombreMesero} 
        />
      )}

      {carrito.length > 0 && !verOrden && (
        <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t dark:border-slate-800 p-4 shadow-lg z-20 safe-area-bottom">
            <button 
              style={{ backgroundColor: config.colorPrimario }}
              className="w-full text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition flex justify-between px-6 hover:brightness-110"
              onClick={() => setVerOrden(true)} 
            >
              <span>Ver Orden ({carrito.length})</span>
              <span>${carrito.reduce((s,i)=>s+i.precio,0).toFixed(2)}</span>
            </button>
        </div>
      )}
    </div>
  );
}
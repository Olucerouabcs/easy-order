// src/pages/Kiosk.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // Agrega useNavigate
import { db, auth } from "../firebase/config"; // Importa auth
import { collection, getDocs, query, where } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth"; // Para re-autenticar
import Menu from "../components/Menu";
import OrderSummary from "../components/OrderSummary";
import { Lock, LogOut, X } from "lucide-react"; // Iconos nuevos

export default function Kiosk() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Leemos parámetros
  const idRestaurante = searchParams.get("id");
  const isKioskMode = searchParams.get("mode") === "kiosk"; // ¿Es modo tablet?

  const [platillos, setPlatillos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [verOrden, setVerOrden] = useState(false);
  
  // ESTADOS PARA EL CANDADO DE SALIDA
  const [mostrarCandado, setMostrarCandado] = useState(false);
  const [passwordSalida, setPasswordSalida] = useState("");
  const [errorSalida, setErrorSalida] = useState("");

  // ... (Tu useEffect de cargar menú sigue IGUAL, no lo toques) ...
  useEffect(() => {
    if (!idRestaurante) return;
    const obtenerMenu = async () => {
      // ... tu código de carga ...
      const q = query(collection(db, "menu"), where("uid", "==", idRestaurante));
      const respuesta = await getDocs(q);
      const productos = respuesta.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPlatillos(productos);
      setCargando(false);
    };
    obtenerMenu();
  }, [idRestaurante]);

  // FUNCIONES DEL CARRITO (Siguen igual)
  const agregarAlCarrito = (item) => setCarrito([...carrito, item]);
  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1); // Quita 1 elemento en la posición 'index'
    setCarrito(nuevoCarrito);
  };
  const limpiarCarrito = () => { setCarrito([]); setVerOrden(false); };

  // --- NUEVA LÓGICA DE SALIDA SEGURA ---
  const intentarSalir = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;

    try {
      // Intentamos loguear de nuevo con la contraseña que puso
      await signInWithEmailAndPassword(auth, auth.currentUser.email, passwordSalida);
      // Si pasa, es el dueño. Lo mandamos al Admin.
      navigate("/admin");
    } catch (error) {
      console.error(error);
      setErrorSalida("Contraseña incorrecta");
    }
  };

  // Si no hay ID, error (Igual que antes)
  if (!idRestaurante && !cargando) return <div>No se encontró el restaurante</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20 relative">
      
      {/* HEADER ESPECIAL MODO KIOSCO */}
      <header className="bg-white shadow p-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="font-black text-xl text-gray-800">🍔 Pide Aquí</h1>
        
        {/* BOTÓN DE SALIDA (Solo visible si es modo Kiosk) */}
        {isKioskMode && (
          <button 
            onClick={() => setMostrarCandado(true)}
            className="text-gray-300 hover:text-red-500 transition"
          >
            <Lock size={20} />
          </button>
        )}
      </header>

      {/* --- MODAL DE SEGURIDAD PARA SALIR --- */}
      {mostrarCandado && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Desbloquear Tablet</h3>
              <button onClick={() => setMostrarCandado(false)}><X /></button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">Ingresa tu contraseña de administrador para salir del menú.</p>
            
            <form onSubmit={intentarSalir}>
              <input 
                type="password" 
                placeholder="Contraseña del encargado"
                className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-orange-500"
                value={passwordSalida}
                onChange={(e) => setPasswordSalida(e.target.value)}
                autoFocus
              />
              {errorSalida && <p className="text-red-500 text-sm mb-3">{errorSalida}</p>}
              
              <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2">
                <LogOut size={18} /> Salir al Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VISTA DE ORDEN (Resumen) */}
      {verOrden && (
        <OrderSummary 
          carrito={carrito} 
          limpiarCarrito={limpiarCarrito} 
          eliminarDelCarrito={eliminarDelCarrito}
          cancelarOrden={() => setVerOrden(false)}
          idRestaurante={idRestaurante}
          //numeroMesa={numeroMesa}
        />
      )}

      {/* MENÚ DE COMIDA */}
      <Menu agregarAlCarrito={agregarAlCarrito} platillos={platillos} /> {/* OJO: Pasamos platillos filtrados aquí si Menu.jsx lo requiere modificado, o Menu usa el ID. RECOMENDACIÓN: Usa el prop de platillos si ya los cargaste aquí */}

      {/* BARRA INFERIOR DEL CARRITO (Igual que antes) */}
      {/* ... copia tu barra verde de carrito aquí ... */}
       {carrito.length > 0 && !verOrden && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-lg z-20">
            <button 
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
              onClick={() => setVerOrden(true)} 
            >
              Ver Orden (${carrito.reduce((s,i)=>s+i.precio,0)})
            </button>
        </div>
      )}
    </div>
  );
}
//export default Kiosk;
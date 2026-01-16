// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, where, orderBy, writeBatch, serverTimestamp, setDoc, getDoc 
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, UtensilsCrossed, Settings, Archive, Trash2, Plus, Save, 
  DollarSign, ShoppingBag, TrendingUp, ChefHat, QrCode, CalendarClock, 
  AlertTriangle, Edit2, Eye, EyeOff, XCircle, Users, MonitorSmartphone, Copy, ExternalLink, Printer, Palette, Type, X, Tag, Upload, Image as ImageIcon, Loader2, Moon, Sun 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import toast from 'react-hot-toast';
import { useTheme } from "../context/ThemeContext"; // <--- USAR EL CONTEXTO

const FOOD_EMOJIS = ["🍔", "🍕", "🌭", "🌮", "🌯", "🥗", "🍝", "🍜", "🍱", "🍣", "🍤", "🍚", "🥩", "🍗", "🥪", "🍟", "🍪", "🍩", "🍰", "🍦", "🍫", "🍬", "🍮", "🧁", "☕", "🍺", "🍷", "🍹", "🥤", "🥛", "🥥", "🍉"];

export default function Admin() {
  const { theme, toggleTheme } = useTheme(); // <--- EXTRAER EL TEMA
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard"); 
  
  // DATOS
  const [platillos, setPlatillos] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [mesas, setMesas] = useState([]);
  const [meseros, setMeseros] = useState([]);
  
  // VENTAS Y ORDENES
  const [ventasActivas, setVentasActivas] = useState([]); 
  const [ordenesPorCobrar, setOrdenesPorCobrar] = useState([]); 
  const [cortesPasados, setCortesPasados] = useState([]); 
  
  // ESTADOS DE INTERFAZ
  const [ticketParaImprimir, setTicketParaImprimir] = useState(null);
  const [mesaParaCobrar, setMesaParaCobrar] = useState(null); 
  const [cargandoCorte, setCargandoCorte] = useState(false);
  const [filtroAdmin, setFiltroAdmin] = useState("Todos");
  const [mostrarModalCategorias, setMostrarModalCategorias] = useState(false);
  const [itemParaEliminar, setItemParaEliminar] = useState(null);

  // FORMULARIOS
  const [nuevo, setNuevo] = useState({ nombre: "", precio: "", categoria: "", descripcion: "", imagen: "", disponible: true });
  const [subiendoImagen, setSubiendoImagen] = useState(false); 

  // --- ESTADOS PARA MESEROS ---
  const [nuevoMeseroNombre, setNuevoMeseroNombre] = useState("");
  const [nuevoMeseroApellido, setNuevoMeseroApellido] = useState(""); 
  const [nuevoPin, setNuevoPin] = useState("");
  const [idMeseroEdicion, setIdMeseroEdicion] = useState(null);

  const [idEdicion, setIdEdicion] = useState(null); 
  
  // Formulario Categorías
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [editandoCategoria, setEditandoCategoria] = useState(null); 
  const [textoEditado, setTextoEditado] = useState("");

  // CONFIGURACIÓN DE MARCA
  const [config, setConfig] = useState({
      nombreRestaurante: "Mi Restaurante",
      colorPrimario: "#ea580c", 
      colorFondo: "#f8fafc",    
  });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        cargarDatos(currentUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (ticketParaImprimir) {
        setTimeout(() => {
            window.print();
            setTicketParaImprimir(null);
        }, 500);
    }
  }, [ticketParaImprimir]);

  const cargarDatos = async (uid) => {
    const docRef = doc(db, "configuracion", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        setConfig(docSnap.data());
    }

    onSnapshot(query(collection(db, "menu"), where("uid", "==", uid)), (s) => setPlatillos(s.docs.map(d => ({id:d.id, ...d.data()}))));
    
    const qCat = query(collection(db, "categorias"), where("uid", "==", uid), orderBy("nombre"));
    onSnapshot(qCat, async (s) => {
        const lista = s.docs.map(d => ({id:d.id, ...d.data()}));
        if (lista.length === 0 && !s.metadata.fromCache) {
             const batch = writeBatch(db);
             ["Comida", "Bebida", "Postre"].forEach(nombre => {
                 const ref = doc(collection(db, "categorias"));
                 batch.set(ref, { nombre, uid });
             });
             await batch.commit();
        } else {
            setCategorias(lista);
            if (lista.length > 0 && !nuevo.categoria) {
                setNuevo(prev => ({...prev, categoria: lista[0].nombre}));
            }
        }
    });

    onSnapshot(query(collection(db, "ordenes"), where("uid", "==", uid), where("estado", "==", "terminado")), (s) => setVentasActivas(s.docs.map(d => ({id:d.id, ...d.data()})).filter(o => !o.archivado)));
    onSnapshot(query(collection(db, "ordenes"), where("uid", "==", uid), where("estado", "==", "listo")), (s) => setOrdenesPorCobrar(s.docs.map(d => ({id:d.id, ...d.data()}))));
    onSnapshot(query(collection(db, "cortes"), where("uid", "==", uid), orderBy("fecha", "desc")), (s) => setCortesPasados(s.docs.map(d => ({id:d.id, ...d.data()}))));
    onSnapshot(query(collection(db, "mesas"), where("uid", "==", uid)), (s) => {
        const lista = s.docs.map(d => ({id:d.id, ...d.data()}));
        lista.sort((a, b) => Number(a.numero) - Number(b.numero));
        setMesas(lista);
    });
    onSnapshot(query(collection(db, "meseros"), where("uid", "==", uid)), (s) => setMeseros(s.docs.map(d => ({id:d.id, ...d.data()}))));
  };

  const agregarMesaAutomatica = async () => { if(!user) return; const maxNumero = mesas.reduce((max, mesa) => Math.max(max, Number(mesa.numero)), 0); const siguienteMesa = maxNumero + 1; await addDoc(collection(db, "mesas"), { numero: siguienteMesa, uid: user.uid }); toast.success(`Mesa ${siguienteMesa} agregada`); };
  
  const guardarMesero = async (e) => { 
      e.preventDefault(); 
      if(!user || !nuevoMeseroNombre || !nuevoPin) return toast.error("Faltan datos"); 
      if (nuevoPin.length !== 4) return toast.error("El PIN debe tener 4 dígitos.");
      const pinExiste = meseros.some(m => m.pin === nuevoPin && m.id !== idMeseroEdicion);
      if (pinExiste) return toast.error("Este PIN ya está en uso.");

      try {
          if (idMeseroEdicion) {
              await updateDoc(doc(db, "meseros", idMeseroEdicion), { nombre: nuevoMeseroNombre, apellidos: nuevoMeseroApellido, pin: nuevoPin });
              toast.success("Mesero actualizado");
              cancelarEdicionMesero();
          } else {
              await addDoc(collection(db, "meseros"), { nombre: nuevoMeseroNombre, apellidos: nuevoMeseroApellido, pin: nuevoPin, uid: user.uid }); 
              toast.success(`Mesero registrado`);
              setNuevoMeseroNombre(""); setNuevoMeseroApellido(""); setNuevoPin("");
          }
      } catch (error) { console.error(error); toast.error("Error al guardar"); }
  };

  const iniciarEdicionMesero = (mesero) => { setIdMeseroEdicion(mesero.id); setNuevoMeseroNombre(mesero.nombre); setNuevoMeseroApellido(mesero.apellidos || ""); setNuevoPin(mesero.pin); };
  const cancelarEdicionMesero = () => { setIdMeseroEdicion(null); setNuevoMeseroNombre(""); setNuevoMeseroApellido(""); setNuevoPin(""); };

  const confirmarEliminacion = (tipo, id, nombre) => { setItemParaEliminar({ tipo, id, nombre }); };
  const ejecutarEliminacion = async () => { if (!itemParaEliminar) return; try { await deleteDoc(doc(db, itemParaEliminar.tipo, itemParaEliminar.id)); toast.success("Eliminado correctamente"); setItemParaEliminar(null); } catch (error) { console.error(error); toast.error("Error al eliminar"); } };
  
  const eliminarPlatillo = (id) => { if(confirm("¿Eliminar este platillo?")) { deleteDoc(doc(db, "menu", id)).then(() => toast.success("Eliminado")); } };
  const copiarLinkMesa = (numero) => { navigator.clipboard.writeText(`${window.location.origin}/?id=${user.uid}&mesa=${numero}&mode=kiosk`); toast.success("Link copiado"); };
  const copiarLinkMeseros = () => { navigator.clipboard.writeText(`${window.location.origin}/mesero?id=${user.uid}`); toast.success("Link copiado"); };

  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) return toast.error("Máximo 1MB.");
      setSubiendoImagen(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => { setNuevo({ ...nuevo, imagen: reader.result }); setSubiendoImagen(false); toast.success("Imagen cargada"); };
      reader.onerror = (error) => { console.error(error); setSubiendoImagen(false); };
  };

  const guardarPlatillo = async (e) => { 
      e.preventDefault(); 
      if(!user) return; 
      if (!nuevo.nombre || !nuevo.precio) return toast.error("Faltan datos");
      if (Number(nuevo.precio) < 0) return toast.error("El precio no puede ser negativo");

      try { 
          const categoriaFinal = nuevo.categoria || (categorias.length > 0 ? categorias[0].nombre : "General");
          const imagenFinal = nuevo.imagen || "🍔";

          if (idEdicion) { 
              await updateDoc(doc(db, "menu", idEdicion), { ...nuevo, precio: Number(nuevo.precio), categoria: categoriaFinal, descripcion: nuevo.descripcion || "", imagen: imagenFinal }); 
              toast.success("Actualizado"); cancelarEdicion(); 
          } else { 
              await addDoc(collection(db, "menu"), { ...nuevo, precio: Number(nuevo.precio), uid: user.uid, disponible: true, categoria: categoriaFinal, descripcion: nuevo.descripcion || "", imagen: imagenFinal }); 
              toast.success("Creado"); cancelarEdicion(); 
          } 
      } catch (error) { console.error(error); toast.error("Error"); } 
  };
  
  const cancelarEdicion = () => { setIdEdicion(null); setNuevo({ nombre: "", precio: "", categoria: categorias.length > 0 ? categorias[0].nombre : "", descripcion: "", imagen: "", disponible: true }); };
  const toggleDisponibilidad = async (item) => { await updateDoc(doc(db, "menu", item.id), { disponible: !item.disponible }); };
  
  const guardarCategoria = async (e) => { e.preventDefault(); if (!nuevaCategoria.trim()) return; await addDoc(collection(db, "categorias"), { nombre: nuevaCategoria, uid: user.uid }); setNuevaCategoria(""); toast.success("Etiqueta creada"); };
  const actualizarCategoria = async (id) => { if (!textoEditado.trim()) return; await updateDoc(doc(db, "categorias", id), { nombre: textoEditado }); setEditandoCategoria(null); toast.success("Etiqueta actualizada"); };
  const eliminarCategoria = async (id) => { if (confirm("¿Eliminar etiqueta?")) { await deleteDoc(doc(db, "categorias", id)); toast.success("Eliminada"); } };

  const realizarCorte = async () => { if(!user || ventasActivas.length === 0) return toast.error("No hay ventas"); if (!confirm("¿Cerrar caja?")) return; setCargandoCorte(true); try { const batch = writeBatch(db); const fechaCorte = serverTimestamp(); const totalVentas = ventasActivas.reduce((acc, orden) => acc + orden.total, 0); batch.set(doc(collection(db, "cortes")), { uid: user.uid, fecha: fechaCorte, total: totalVentas, cantidadPedidos: ventasActivas.length, ticketPromedio: ventasActivas.length > 0 ? parseFloat((totalVentas / ventasActivas.length).toFixed(2)) : 0 }); ventasActivas.forEach((v) => batch.update(doc(db, "ordenes", v.id), { archivado: true, fechaCorte: fechaCorte })); await batch.commit(); toast.success("Corte realizado"); } catch (e) { console.error(e); } finally { setCargandoCorte(false); } };
  const guardarPersonalizacion = async () => { if (!user) return; try { await setDoc(doc(db, "configuracion", user.uid), config, { merge: true }); toast.success("¡Marca actualizada! 🎨"); } catch (error) { console.error(error); toast.error("Error al guardar marca"); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-white">Cargando Admin...</div>;
  if (!user) return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 text-center"><h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Sesión Expirada</h2><button onClick={() => navigate('/login')} className="bg-slate-900 dark:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold">Ir al Login</button></div>);

  // --- VISTAS ---
  const renderDashboard = () => {
    const mesasAgrupadas = ordenesPorCobrar.reduce((acc, orden) => {
        const esBarra = orden.mesa.includes("Barra") || orden.mesa.includes("Llevar");
        const claveUnica = esBarra ? `barra_${orden.id}` : orden.mesa;
        if (!acc[claveUnica]) { acc[claveUnica] = { mesa: orden.mesa, items: [], total: 0, ids: [], mesero: orden.mesero || "Cliente / QR" }; }
        acc[claveUnica].items.push(...orden.items); acc[claveUnica].total += orden.total; acc[claveUnica].ids.push(orden.id);
        return acc;
    }, {});
    const listaMesasPorCobrar = Object.values(mesasAgrupadas);
    const datosGrafica = ventasActivas.reduce((acc, orden) => { orden.items.forEach(item => { const existente = acc.find(d => d.nombre === item.nombre); if (existente) existente.cantidad += 1; else acc.push({ nombre: item.nombre, cantidad: 1 }); }); return acc; }, []);
    const topProductos = datosGrafica.sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    const COLORES_GRAFICA = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#ffedd5'];
    const ejecutarCobro = async () => { if (!mesaParaCobrar) return; const grupoMesa = mesaParaCobrar; try { const batch = writeBatch(db); grupoMesa.ids.forEach(id => { const ref = doc(db, "ordenes", id); batch.update(ref, { estado: "terminado" }); }); await batch.commit(); setTicketParaImprimir({ id: grupoMesa.ids[0], mesa: grupoMesa.mesa, items: grupoMesa.items, total: grupoMesa.total, fecha: new Date() }); toast.success(`¡${grupoMesa.mesa} cobrada!`); setMesaParaCobrar(null); } catch (error) { console.error(error); toast.error("Error al cobrar"); } };

    return (
        <div className="space-y-8 animate-in fade-in relative">
           {mesaParaCobrar && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"><div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-gray-800 dark:text-white">Confirmar Cobro</h3><button onClick={() => setMesaParaCobrar(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-300"><X/></button></div><div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900 mb-6 text-center"><p className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold mb-1">Mesa</p><p className="text-2xl font-black text-gray-800 dark:text-white mb-4">{mesaParaCobrar.mesa}</p><p className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold mb-1">Total a cobrar</p><p className="text-4xl font-black text-green-600 dark:text-green-400">${mesaParaCobrar.total.toFixed(2)}</p></div><div className="flex gap-3"><button onClick={() => setMesaParaCobrar(null)} className="flex-1 py-4 rounded-xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition">Cancelar</button><button onClick={ejecutarCobro} className="flex-1 bg-slate-900 dark:bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black dark:hover:bg-orange-500 transition flex items-center justify-center gap-2"><Printer size={20}/> Cobrar</button></div></div></div>)}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-8"><div><h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ChefHat className="text-orange-500"/> Cuentas Abiertas</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{listaMesasPorCobrar.map((grupo, index) => (<div key={index} className="bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col"><div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">{grupo.ids.length} PEDIDOS</div><h3 className="font-black text-xl text-gray-800 dark:text-white leading-none">{grupo.mesa}</h3><p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 mt-1 uppercase tracking-wide">Atendió: {grupo.mesero}</p><p className="text-gray-400 text-xs mb-3">Tickets: {grupo.ids.map(id => "#"+(typeof id === 'string' ? id.slice(-4) : id)).join(", ")}</p><div className="space-y-1 mb-4 flex-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">{grupo.items.map((item, i) => (<div key={i} className="flex justify-between text-sm border-b border-dashed border-gray-100 dark:border-slate-700 pb-1 last:border-0"><span className="text-gray-600 dark:text-gray-300 truncate">{item.nombre}</span><span className="font-mono font-bold dark:text-white">${item.precio}</span></div>))}</div><div className="border-t dark:border-slate-700 pt-3 flex items-center justify-between mt-auto bg-orange-50 dark:bg-slate-700/50 -mx-4 -mb-4 p-4"><div><p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase">Total</p><span className="font-black text-3xl text-gray-800 dark:text-white">${grupo.total.toFixed(2)}</span></div><button onClick={() => setMesaParaCobrar(grupo)} className="bg-slate-900 dark:bg-orange-600 hover:bg-black text-white px-4 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition flex items-center gap-2"><Printer size={18}/> Cobrar</button></div></div>))}{listaMesasPorCobrar.length === 0 && <div className="col-span-full bg-gray-50 dark:bg-slate-800 rounded-xl p-10 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-700"><ChefHat className="mx-auto mb-2 opacity-20" size={48}/><p className="font-bold">Todo cobrado.</p></div>}</div></div><div className="pt-8 border-t border-gray-200 dark:border-slate-700"><div className="flex justify-between items-end mb-6"><div><h2 className="text-3xl font-bold text-gray-800 dark:text-white">Caja del Día</h2><p className="text-gray-500 dark:text-gray-400 text-sm">Ventas cobradas</p></div><button onClick={realizarCorte} disabled={cargandoCorte || ventasActivas.length === 0} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg bg-green-600 text-white hover:bg-green-700"><Archive size={20}/> Cerrar Caja</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4"><div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl text-green-600 dark:text-green-400"><DollarSign size={32} /></div><div><p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Total Cobrado</p><p className="text-3xl font-black text-gray-800 dark:text-white">${ventasActivas.reduce((acc, o) => acc + o.total, 0)}</p></div></div><div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4"><div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl text-blue-600 dark:text-blue-400"><ShoppingBag size={32} /></div><div><p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Tickets Cerrados</p><p className="text-3xl font-black text-gray-800 dark:text-white">{ventasActivas.length}</p></div></div></div></div></div><div className="lg:col-span-1"><div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-full"><h3 className="font-bold text-lg text-gray-800 dark:text-white mb-6 flex items-center gap-2"><TrendingUp className="text-purple-500"/> Top Productos</h3><div className="h-[300px] w-full text-xs">{topProductos.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={topProductos} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="nombre" width={80} stroke={theme === 'dark' ? '#94a3b8' : '#666'} /><Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: theme === 'dark' ? '#1e293b' : 'white', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: theme === 'dark' ? 'white' : 'black'}}/><Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>{topProductos.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORES_GRAFICA[index % COLORES_GRAFICA.length]} />))}</Bar></BarChart></ResponsiveContainer>) : (<div className="h-full flex items-center justify-center text-gray-400 text-center"><p>Realiza ventas para ver estadísticas</p></div>)}</div></div></div></div>
           <div id="ticket-impresion" className="hidden print:block text-black font-mono text-sm p-0 m-0 w-[58mm]">{ticketParaImprimir && (<><div className="text-center mb-4"><h1 className="text-xl font-bold uppercase">{config.nombreRestaurante}</h1><p>Powered by MeLu</p><p className="text-xs">{new Date().toLocaleString()}</p></div><div className="border-b-2 border-dashed border-black my-2"></div><div className="mb-2"><p className="font-bold text-lg">CUENTA CERRADA</p><p className="uppercase font-black text-xl">{ticketParaImprimir.mesa}</p></div><div className="border-b-2 border-dashed border-black my-2"></div><div className="flex flex-col gap-2">{ticketParaImprimir.items.map((item, i) => (<div key={i}><div className="flex justify-between"><span>1 x {item.nombre}</span><span>${item.precio.toFixed(2)}</span></div></div>))}</div><div className="border-b-2 border-dashed border-black my-2"></div><div className="flex justify-between text-2xl font-bold"><span>TOTAL:</span><span>${ticketParaImprimir.total.toFixed(2)}</span></div><div className="mt-8 text-center text-xs"><p>¡Gracias por su visita!</p><p>MeLu App</p></div></>)}</div><style>{`@media print { body * { visibility: hidden; } #ticket-impresion, #ticket-impresion * { visibility: visible; } #ticket-impresion { position: absolute; left: 0; top: 0; width: 100%; } @page { size: auto; margin: 0mm; } }`}</style>
        </div>
    );
  };
  
  const renderMenu = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
        {mostrarModalCategorias && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2"><Tag size={20} className="text-blue-500"/> Etiquetas</h3>
                        <button onClick={() => setMostrarModalCategorias(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-300"><X size={20}/></button>
                    </div>
                    <form onSubmit={guardarCategoria} className="flex gap-2 mb-6">
                        <input type="text" placeholder="Nueva etiqueta..." className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} autoFocus />
                        <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"><Plus size={20}/></button>
                    </form>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {categorias.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-slate-600 group hover:border-blue-200 transition">
                                {editandoCategoria === cat.id ? (
                                    <div className="flex flex-1 gap-2 mr-2">
                                        <input type="text" className="flex-1 p-1 px-2 text-sm border rounded dark:bg-slate-900 dark:text-white" value={textoEditado} onChange={e => setTextoEditado(e.target.value)} />
                                        <button onClick={() => actualizarCategoria(cat.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={16}/></button>
                                        <button onClick={() => setEditandoCategoria(null)} className="text-gray-400 hover:bg-gray-200 p-1 rounded"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{cat.nombre}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => {setEditandoCategoria(cat.id); setTextoEditado(cat.nombre)}} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit2 size={16}/></button>
                                            <button onClick={() => eliminarCategoria(cat.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-fit sticky top-6 z-10">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">{idEdicion ? <><Edit2 className="text-blue-500"/> Editando</> : <><Plus className="text-orange-500"/> Nuevo</>}</h3>{idEdicion && <button onClick={cancelarEdicion} className="text-xs text-red-500 font-bold hover:underline">Cancelar</button>}</div>
            <form onSubmit={guardarPlatillo} className="space-y-4">
                <input type="text" placeholder="Nombre" className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border" value={nuevo.nombre} onChange={e=>setNuevo({...nuevo, nombre: e.target.value})} />
                <div className="flex gap-2">
                    <input type="number" min="0" step="0.01" placeholder="Precio" className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border" value={nuevo.precio} onChange={e => {if (e.target.value === '' || Number(e.target.value) >= 0) {setNuevo({...nuevo, precio: e.target.value});}}} />
                    <select className="p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition w-1/2" value={nuevo.categoria} onChange={e => {if(e.target.value === "GESTIONAR_CATEGORIAS_XX") {setMostrarModalCategorias(true);} else {setNuevo({...nuevo, categoria: e.target.value});}}}>
                        {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                        <option disabled>──────────</option>
                        <option value="GESTIONAR_CATEGORIAS_XX" className="font-bold text-blue-600 bg-blue-50">+ Crear/Editar Etiquetas...</option>
                    </select>
                </div>
                <textarea placeholder="Descripción del platillo..." className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border h-20 text-sm resize-none" value={nuevo.descripcion} onChange={e=>setNuevo({...nuevo, descripcion: e.target.value})}></textarea>
                
                {/* --- SECCIÓN DE IMAGEN "HACK" --- */}
                <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase">Imagen del Platillo</span>
                        {nuevo.imagen && <button type="button" onClick={() => setNuevo({...nuevo, imagen: ""})} className="text-xs text-red-500 hover:underline font-bold">Quitar</button>}
                    </div>
                    
                    {nuevo.imagen ? (
                        <div className="relative w-full h-40 bg-white rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={nuevo.imagen} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition flex items-center gap-2">
                                    <Edit2 size={16}/> Cambiar
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <label className={`w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition ${subiendoImagen ? 'opacity-50 pointer-events-none' : ''}`}>
                            {subiendoImagen ? (
                                <><Loader2 className="animate-spin text-blue-500 mb-2" /><span className="text-xs text-blue-500 font-bold">Procesando...</span></>
                            ) : (
                                <><ImageIcon className="text-gray-400 mb-2" size={32}/><span className="text-sm text-gray-500 font-medium">Click para subir foto</span><span className="text-[10px] text-gray-400">(O usa la cámara del cel)</span></>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    )}
                </div>

                <button type="submit" className={`w-full py-3 rounded-xl font-bold text-white transition flex justify-center items-center gap-2 ${idEdicion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 dark:bg-orange-600 dark:hover:bg-orange-700 hover:bg-black'}`}>{idEdicion ? "Actualizar" : "Guardar"}</button>
            </form>
        </div>
        <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Inventario ({platillos.length})</h3>
                <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-x-auto max-w-full custom-scrollbar">
                    <button onClick={() => setFiltroAdmin("Todos")} className={`px-3 py-1 rounded-md text-xs font-bold transition whitespace-nowrap ${filtroAdmin === "Todos" ? 'bg-orange-100 text-orange-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Todos</button>
                    {categorias.map(cat => (
                        <button key={cat.id} onClick={() => setFiltroAdmin(cat.nombre)} className={`px-3 py-1 rounded-md text-xs font-bold transition whitespace-nowrap ${filtroAdmin === cat.nombre ? 'bg-orange-100 text-orange-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>{cat.nombre}</button>
                    ))}
                    <button onClick={() => setMostrarModalCategorias(true)} className="px-2 text-gray-400 hover:text-blue-500 transition" title="Gestionar Etiquetas"><Settings size={14}/></button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{(filtroAdmin === "Todos" ? platillos : platillos.filter(p => p.categoria === filtroAdmin)).map(item => (<div key={item.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border flex items-center gap-4 transition ${item.disponible === false ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10 opacity-75' : 'border-gray-100 dark:border-slate-700'}`}><div className="relative"><div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-lg flex items-center justify-center text-3xl overflow-hidden border border-gray-100 dark:border-slate-600">{(item.imagen?.includes("http") || item.imagen?.includes("data:image")) ? <img src={item.imagen} className="w-full h-full object-cover"/> : item.imagen}</div>{item.disponible === false && (<div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center rounded-lg backdrop-blur-[1px]"><XCircle className="text-red-500" size={24} /></div>)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-gray-800 dark:text-white truncate">{item.nombre}</p>{item.disponible === false && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Agotado</span>}</div><p className="text-sm text-gray-500">{item.categoria} • <span className="text-green-600 dark:text-green-400 font-bold">${item.precio}</span></p></div><div className="flex flex-col gap-1"><button onClick={()=>idEdicion===item.id ? cancelarEdicion() : (setNuevo(item) || setIdEdicion(item.id))} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg hover:bg-blue-100 transition"><Edit2 size={16}/></button><button onClick={()=>toggleDisponibilidad(item)} className={`p-2 rounded-lg transition ${item.disponible === false ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>{item.disponible === false ? <Eye size={16}/> : <EyeOff size={16}/>}</button><button onClick={()=>eliminarPlatillo(item.id)} className="bg-red-50 dark:bg-red-900/30 text-red-400 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></div></div>))}</div>
        </div>
    </div>
  );

  const renderResources = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
        {itemParaEliminar && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 text-center">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="text-red-600" size={32} /></div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¿Eliminar {itemParaEliminar.tipo === 'mesas' ? 'Mesa' : 'Mesero'}?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Estás a punto de borrar a <strong className="text-gray-800 dark:text-white">{itemParaEliminar.nombre}</strong>. Esta acción no se puede deshacer.</p>
                    <div className="flex gap-3"><button onClick={() => setItemParaEliminar(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition">Cancelar</button><button onClick={ejecutarEliminacion} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition">Sí, Eliminar</button></div>
                </div>
            </div>
        )}

        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4 flex items-center gap-2"><MonitorSmartphone className="text-blue-500"/> Gestión de Mesas</h3>
                <button onClick={agregarMesaAutomatica} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition flex justify-center items-center gap-2 mb-6"><Plus size={24} /> Agregar Mesa {mesas.length > 0 ? `(Sigue la ${Math.max(...mesas.map(m=>Number(m.numero))) + 1})` : "#1"}</button>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {mesas.map(mesa => (
                        <div key={mesa.id} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border border-gray-200 dark:border-slate-600 flex flex-col gap-3">
                            <div className="flex justify-between items-center"><span className="font-black text-gray-700 dark:text-white text-lg">Mesa {mesa.numero}</span><button onClick={() => confirmarEliminacion("mesas", mesa.id, `Mesa ${mesa.numero}`)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></div>
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-slate-700 flex flex-col gap-2"><p className="text-xs text-blue-500 font-bold uppercase">Dispositivo</p><div className="flex gap-2"><button onClick={() => copiarLinkMesa(mesa.numero)} className="flex-1 bg-gray-100 dark:bg-slate-800 dark:text-white hover:bg-gray-200 text-gray-700 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition"><Copy size={14}/> Copiar Link</button><Link to={`/?id=${user.uid}&mesa=${mesa.numero}&mode=kiosk`} target="_blank" className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition"><ExternalLink size={14}/> Abrir</Link></div></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2"><Users className="text-orange-500"/> Equipo (Meseros)</h3>
                    {idMeseroEdicion && <button onClick={cancelarEdicionMesero} className="text-xs text-red-500 font-bold hover:underline">Cancelar Edición</button>}
                </div>
                <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900 flex flex-col gap-2"><p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Acceso para Empleados</p><button onClick={copiarLinkMeseros} className="w-full bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900 py-2 rounded-lg font-bold hover:bg-orange-600 hover:text-white transition flex items-center justify-center gap-2"><Copy size={16}/> Copiar Link de Acceso</button></div>
                <form onSubmit={guardarMesero} className="flex flex-col gap-3 mb-6">
                    <input type="text" placeholder="Nombre" className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" value={nuevoMeseroNombre} onChange={e => setNuevoMeseroNombre(e.target.value)} />
                    <input type="text" placeholder="Apellidos" className="w-full p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" value={nuevoMeseroApellido} onChange={e => setNuevoMeseroApellido(e.target.value)} />
                    <div className="flex gap-2">
                        <input type="tel" maxLength="4" placeholder="PIN (4)" className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border text-center tracking-widest font-mono focus:ring-2 focus:ring-orange-500 outline-none" value={nuevoPin} onChange={e => setNuevoPin(e.target.value)} />
                        <button type="submit" className={`px-6 rounded-lg font-bold text-white transition shadow-lg ${idMeseroEdicion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>{idMeseroEdicion ? <Save size={20}/> : "Crear"}</button>
                    </div>
                </form>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {meseros.map(m => (
                        <div key={m.id} className={`flex justify-between items-center p-3 rounded-lg border transition ${idMeseroEdicion === m.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 ring-1 ring-blue-300' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}>
                            <div><span className="font-bold text-gray-700 dark:text-white block text-lg capitalize">{m.nombre} {m.apellidos}</span><span className="text-xs text-gray-400 font-mono tracking-widest">PIN: {m.pin}</span></div>
                            <div className="flex gap-1"><button onClick={() => iniciarEdicionMesero(m)} className="text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 p-2 rounded-lg transition"><Edit2 size={16}/></button><button onClick={() => confirmarEliminacion("meseros", m.id, m.nombre)} className="text-red-400 hover:bg-red-100 dark:hover:bg-red-900 p-2 rounded-lg transition"><Trash2 size={16}/></button></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-in fade-in space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Historial</h2>
        <div className="grid grid-cols-1 gap-4">
            {cortesPasados.map(corte => (
                <div key={corte.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4"><div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400"><CalendarClock size={24} /></div><div><p className="text-sm text-gray-400 font-bold uppercase">Cierre</p><p className="text-lg font-bold text-gray-800 dark:text-white">{corte.fecha ? new Date(corte.fecha.seconds * 1000).toLocaleString() : "Reciente"}</p></div></div>
                    <div className="flex gap-8 text-right"><div><p className="text-xs text-gray-400 uppercase font-bold">Pedidos</p><p className="font-bold text-gray-800 dark:text-white">{corte.cantidadPedidos}</p></div><div><p className="text-xs text-gray-400 uppercase font-bold">Total</p><p className="font-black text-2xl text-green-600 dark:text-green-400">${corte.total}</p></div></div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl animate-in fade-in space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Configuración</h2>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Palette className="text-purple-500"/> Personalización de Marca (MeLu)</h3>
            <div className="space-y-4">
                <div><label className="text-sm font-bold text-gray-500 mb-1 block">Nombre del Restaurante</label><div className="flex items-center gap-2"><Type className="text-gray-400" size={20}/><input type="text" className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none" value={config.nombreRestaurante} onChange={(e) => setConfig({...config, nombreRestaurante: e.target.value})} placeholder="Ej: Tacos El Tío"/></div></div>
                <div className="grid grid-cols-2 gap-6"><div><label className="text-sm font-bold text-gray-500 mb-1 block">Color Botones (Primario)</label><div className="flex items-center gap-3"><input type="color" className="w-12 h-12 rounded-lg cursor-pointer border-0" value={config.colorPrimario} onChange={(e) => setConfig({...config, colorPrimario: e.target.value})}/><span className="text-sm font-mono text-gray-600 dark:text-gray-400">{config.colorPrimario}</span></div></div><div><label className="text-sm font-bold text-gray-500 mb-1 block">Color de Fondo</label><div className="flex items-center gap-3"><input type="color" className="w-12 h-12 rounded-lg cursor-pointer border-0" value={config.colorFondo} onChange={(e) => setConfig({...config, colorFondo: e.target.value})}/><span className="text-sm font-mono text-gray-600 dark:text-gray-400">{config.colorFondo}</span></div></div></div>
                <div className="pt-4 border-t dark:border-slate-700 mt-4"><button onClick={guardarPersonalizacion} className="bg-slate-900 dark:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition w-full flex items-center justify-center gap-2"><Save size={18}/> Guardar Cambios de Marca</button></div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700"><div className="flex items-start gap-6"><div className="bg-blue-600 text-white p-4 rounded-xl"><QrCode size={40}/></div><div><h3 className="text-xl font-bold text-gray-800 dark:text-white">Menú Digital (Kiosco)</h3><p className="text-gray-500 dark:text-gray-400 mb-4">Link para compartir.</p><div className="bg-gray-100 dark:bg-slate-900 dark:text-white p-4 rounded-lg font-mono text-sm break-all select-all border border-gray-200 dark:border-slate-700">{window.location.origin}/?id={user.uid}&mode=kiosk</div><Link to={`/?id=${user.uid}&mode=kiosk`} target="_blank" className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 font-bold hover:underline">Abrir simulador <ExternalLink size={16}/></Link></div></div></div>
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border border-red-100 dark:border-red-900"><h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2"><AlertTriangle size={20}/> Zona de Peligro</h3><button onClick={()=>auth.signOut()} className="mt-4 bg-white dark:bg-red-900/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 px-6 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition">Cerrar Sesión</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex font-sans transition-colors duration-300">
      <aside className="w-20 lg:w-64 bg-slate-900 dark:bg-black text-white flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-6 flex items-center gap-3"><div className="bg-orange-500 p-2 rounded-lg"><ChefHat size={24}/></div><span className="font-bold text-xl hidden lg:block">MeLu<span className="text-orange-400 font-normal text-sm ml-1">Admin</span></span></div>
        <nav className="flex-1 px-4 space-y-2">
            <button onClick={()=>setActiveTab('dashboard')} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition ${activeTab==='dashboard'?'bg-orange-600':'hover:bg-slate-800 dark:hover:bg-gray-900'}`}><LayoutDashboard/> <span className="hidden lg:block">Caja</span></button>
            <button onClick={()=>setActiveTab('resources')} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition ${activeTab==='resources'?'bg-orange-600':'hover:bg-slate-800 dark:hover:bg-gray-900'}`}><MonitorSmartphone/> <span className="hidden lg:block">Recursos</span></button>
            <button onClick={()=>setActiveTab('history')} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition ${activeTab==='history'?'bg-orange-600':'hover:bg-slate-800 dark:hover:bg-gray-900'}`}><Archive/> <span className="hidden lg:block">Historial</span></button>
            <button onClick={()=>setActiveTab('menu')} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition ${activeTab==='menu'?'bg-orange-600':'hover:bg-slate-800 dark:hover:bg-gray-900'}`}><UtensilsCrossed/> <span className="hidden lg:block">Menú</span></button>
            <button onClick={()=>setActiveTab('settings')} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition ${activeTab==='settings'?'bg-orange-600':'hover:bg-slate-800 dark:hover:bg-gray-900'}`}><Settings/> <span className="hidden lg:block">Ajustes</span></button>
        </nav>
        {/* BOTÓN TOGGLE DE TEMA */}
        <div className="px-4 pb-2">
            <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 dark:bg-gray-900 text-gray-400 hover:text-white rounded-xl transition">
                {theme === 'dark' ? <><Sun size={20}/> <span className="hidden lg:block">Modo Claro</span></> : <><Moon size={20}/> <span className="hidden lg:block">Modo Oscuro</span></>}
            </button>
        </div>
        <div className="p-4"><Link to="/cocina" className="flex items-center gap-3 px-4 py-3 bg-slate-800 dark:bg-gray-900 text-blue-400 rounded-xl hover:bg-slate-700 transition"><ChefHat size={20}/> <span className="hidden lg:block">Cocina</span></Link></div>
      </aside>
      <main className="flex-1 ml-20 lg:ml-64 p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'menu' && renderMenu()}
        {activeTab === 'settings' && renderSettings()}
      </main>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }`}</style>
    </div>
  );
}
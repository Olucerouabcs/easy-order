// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, where, orderBy, writeBatch, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, UtensilsCrossed, Settings, Archive, Trash2, Plus, Save, 
  DollarSign, ShoppingBag, TrendingUp, ChefHat, QrCode, CalendarClock, 
  AlertTriangle, Edit2, Eye, EyeOff, XCircle, Users, MonitorSmartphone, Copy, ExternalLink, Printer, Palette, Type 
} from "lucide-react";
import toast from 'react-hot-toast';

const FOOD_EMOJIS = ["🍔", "🍕", "🌭", "🌮", "🌯", "🥗", "🍝", "🍜", "🍱", "🍣", "🍤", "🍚", "🥩", "🍗", "🥪", "🍟", "🍪", "🍩", "🍰", "🍦", "🍫", "🍬", "🍮", "🧁", "☕", "🍺", "🍷", "🍹", "🥤", "🥛", "🥥", "🍉"];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [platillos, setPlatillos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [meseros, setMeseros] = useState([]);
  
  // ESTADOS DE VENTAS
  const [ventasActivas, setVentasActivas] = useState([]); 
  const [ordenesPorCobrar, setOrdenesPorCobrar] = useState([]); 
  const [cortesPasados, setCortesPasados] = useState([]); 
  
  // ESTADO PARA IMPRESIÓN
  const [ticketParaImprimir, setTicketParaImprimir] = useState(null);
  const [mesaParaCobrar, setMesaParaCobrar] = useState(null); 

  // FORMULARIOS
  const [nuevo, setNuevo] = useState({ nombre: "", precio: "", categoria: "Comida", descripcion: "", imagen: "🍔", disponible: true });
  const [nuevoMesero, setNuevoMesero] = useState("");
  const [nuevoPin, setNuevoPin] = useState("");
  
  // --- NUEVO: ESTADO DE PERSONALIZACIÓN (MARCA) ---
  const [config, setConfig] = useState({
      nombreRestaurante: "Mi Restaurante",
      colorPrimario: "#ea580c", // Naranja por defecto (MeLu original)
      colorFondo: "#f8fafc",    // Gris muy claro
  });
  
  const [usarEmoji, setUsarEmoji] = useState(true);
  const [idEdicion, setIdEdicion] = useState(null); 
  const [filtroAdmin, setFiltroAdmin] = useState("Todos");
  const [cargandoCorte, setCargandoCorte] = useState(false);

  // 1. DETECTOR DE USUARIO
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

  // 2. IMPRESIÓN AUTOMÁTICA
  useEffect(() => {
    if (ticketParaImprimir) {
        setTimeout(() => {
            window.print();
            setTicketParaImprimir(null);
        }, 500);
    }
  }, [ticketParaImprimir]);

  const cargarDatos = async (uid) => {
    // Cargar Configuración de Marca (usamos el UID como ID del documento para que sea único)
    const docRef = doc(db, "configuracion", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        setConfig(docSnap.data());
    }

    onSnapshot(query(collection(db, "menu"), where("uid", "==", uid)), (s) => setPlatillos(s.docs.map(d => ({id:d.id, ...d.data()}))));
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

  // --- RECURSOS ---
  const agregarMesaAutomatica = async () => { if(!user) return; const maxNumero = mesas.reduce((max, mesa) => Math.max(max, Number(mesa.numero)), 0); const siguienteMesa = maxNumero + 1; await addDoc(collection(db, "mesas"), { numero: siguienteMesa, uid: user.uid }); toast.success(`Mesa ${siguienteMesa} agregada`); };
  const agregarMesero = async (e) => { e.preventDefault(); if(!user || !nuevoMesero || !nuevoPin) return toast.error("Faltan datos"); await addDoc(collection(db, "meseros"), { nombre: nuevoMesero, pin: nuevoPin, uid: user.uid }); setNuevoMesero(""); setNuevoPin(""); toast.success(`Mesero registrado`); };
  const borrarItem = async (col, id) => { if(confirm("¿Eliminar elemento?")) { await deleteDoc(doc(db, col, id)); toast.success("Eliminado"); } };
  const eliminarPlatillo = (id) => borrarItem("menu", id);
  const copiarLinkMesa = (numero) => { navigator.clipboard.writeText(`${window.location.origin}/?id=${user.uid}&mesa=${numero}&mode=kiosk`); toast.success("Link copiado"); };
  const copiarLinkMeseros = () => { navigator.clipboard.writeText(`${window.location.origin}/mesero?id=${user.uid}`); toast.success("Link copiado"); };

  // --- MENU ---
  const guardarPlatillo = async (e) => { e.preventDefault(); if(!user) return; if (!nuevo.nombre || !nuevo.precio) return toast.error("Faltan datos"); try { if (idEdicion) { await updateDoc(doc(db, "menu", idEdicion), { ...nuevo, precio: Number(nuevo.precio) }); toast.success("Actualizado"); cancelarEdicion(); } else { await addDoc(collection(db, "menu"), { ...nuevo, precio: Number(nuevo.precio), uid: user.uid, disponible: true }); toast.success("Creado"); cancelarEdicion(); } } catch (error) { console.error(error); toast.error("Error"); } };
  const cancelarEdicion = () => { setIdEdicion(null); setNuevo({ nombre: "", precio: "", categoria: "Comida", descripcion: "", imagen: "🍔", disponible: true }); setUsarEmoji(true); };
  const toggleDisponibilidad = async (item) => { await updateDoc(doc(db, "menu", item.id), { disponible: !item.disponible }); };
  
  // --- CORTE ---
  const realizarCorte = async () => { if(!user || ventasActivas.length === 0) return toast.error("No hay ventas"); if (!confirm("¿Cerrar caja?")) return; setCargandoCorte(true); try { const batch = writeBatch(db); const fechaCorte = serverTimestamp(); const totalVentas = ventasActivas.reduce((acc, orden) => acc + orden.total, 0); batch.set(doc(collection(db, "cortes")), { uid: user.uid, fecha: fechaCorte, total: totalVentas, cantidadPedidos: ventasActivas.length, ticketPromedio: ventasActivas.length > 0 ? parseFloat((totalVentas / ventasActivas.length).toFixed(2)) : 0 }); ventasActivas.forEach((v) => batch.update(doc(db, "ordenes", v.id), { archivado: true, fechaCorte: fechaCorte })); await batch.commit(); toast.success("Corte realizado"); } catch (e) { console.error(e); } finally { setCargandoCorte(false); } };

  // --- NUEVO: GUARDAR PERSONALIZACIÓN ---
  const guardarPersonalizacion = async () => {
      if (!user) return;
      try {
          // Usamos setDoc con merge para crear o actualizar
          await setDoc(doc(db, "configuracion", user.uid), config, { merge: true });
          toast.success("¡Marca actualizada! 🎨");
      } catch (error) {
          console.error(error);
          toast.error("Error al guardar marca");
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando Admin...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Acceso Denegado. Inicia Sesión.</div>;

  const renderDashboard = () => {
    const mesasAgrupadas = ordenesPorCobrar.reduce((acc, orden) => {
        const mesa = orden.mesa; 
        if (!acc[mesa]) { acc[mesa] = { mesa: mesa, items: [], total: 0, ids: [] }; }
        acc[mesa].items.push(...orden.items); acc[mesa].total += orden.total; acc[mesa].ids.push(orden.id);
        return acc;
    }, {});
    const listaMesasPorCobrar = Object.values(mesasAgrupadas);

    const ejecutarCobro = async () => {
        if (!mesaParaCobrar) return;
        const grupoMesa = mesaParaCobrar;
        try {
            const batch = writeBatch(db);
            grupoMesa.ids.forEach(id => { const ref = doc(db, "ordenes", id); batch.update(ref, { estado: "terminado" }); });
            await batch.commit();
            setTicketParaImprimir({ id: grupoMesa.ids[0], mesa: grupoMesa.mesa, items: grupoMesa.items, total: grupoMesa.total, fecha: new Date() });
            toast.success(`¡${grupoMesa.mesa} cobrada!`);
            setMesaParaCobrar(null); 
        } catch (error) { console.error(error); toast.error("Error al cobrar"); }
    };

    return (
        <div className="space-y-8 animate-in fade-in relative">
           {/* MODAL COBRO */}
           {mesaParaCobrar && (
               <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                   <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                       <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-gray-800">Confirmar Cobro</h3><button onClick={() => setMesaParaCobrar(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X/></button></div>
                       <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 text-center"><p className="text-gray-500 text-sm uppercase font-bold mb-1">Mesa</p><p className="text-2xl font-black text-gray-800 mb-4">{mesaParaCobrar.mesa}</p><p className="text-gray-500 text-sm uppercase font-bold mb-1">Total a cobrar</p><p className="text-4xl font-black text-green-600">${mesaParaCobrar.total.toFixed(2)}</p></div>
                       <div className="flex gap-3"><button onClick={() => setMesaParaCobrar(null)} className="flex-1 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancelar</button><button onClick={ejecutarCobro} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition flex items-center justify-center gap-2"><Printer size={20}/> Cobrar e Imprimir</button></div>
                   </div>
               </div>
           )}
           {/* COBRO */}
           <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><ChefHat className="text-orange-500"/> Cuentas Abiertas (Por Mesa)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listaMesasPorCobrar.map((grupo, index) => (
                        <div key={index} className="bg-white border border-orange-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">{grupo.ids.length} PEDIDOS</div>
                            <h3 className="font-black text-xl text-gray-800 mb-1">{grupo.mesa}</h3>
                            <p className="text-gray-400 text-xs mb-3">Tickets: {grupo.ids.map(id => "#"+id.slice(-4)).join(", ")}</p>
                            <div className="space-y-1 mb-4 flex-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">{grupo.items.map((item, i) => (<div key={i} className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-1 last:border-0"><span className="text-gray-600">{item.nombre}</span><span className="font-mono font-bold">${item.precio}</span></div>))}</div>
                            <div className="border-t pt-3 flex items-center justify-between mt-auto bg-orange-50 -mx-4 -mb-4 p-4"><div><p className="text-xs text-orange-600 font-bold uppercase">Total</p><span className="font-black text-3xl text-gray-800">${grupo.total.toFixed(2)}</span></div><button onClick={() => setMesaParaCobrar(grupo)} className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition flex items-center gap-2"><Printer size={20}/> Cobrar</button></div>
                        </div>
                    ))}
                    {listaMesasPorCobrar.length === 0 && <div className="col-span-full bg-gray-50 rounded-xl p-10 text-center text-gray-400 border-2 border-dashed border-gray-200"><ChefHat className="mx-auto mb-2 opacity-20" size={48}/><p className="font-bold">No hay cuentas pendientes.</p></div>}
                </div>
           </div>
           {/* CAJA */}
           <div className="pt-8 border-t border-gray-200">
                <div className="flex justify-between items-end mb-6"><div><h2 className="text-3xl font-bold text-gray-800">Caja del Día</h2><p className="text-gray-500 text-sm">Ventas cobradas</p></div><button onClick={realizarCorte} disabled={cargandoCorte || ventasActivas.length === 0} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg bg-green-600 text-white hover:bg-green-700"><Archive size={20}/> Cerrar Caja</button></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="bg-green-100 p-4 rounded-xl text-green-600"><DollarSign size={32} /></div><div><p className="text-gray-500 text-sm font-bold uppercase">Total Cobrado</p><p className="text-3xl font-black text-gray-800">${ventasActivas.reduce((acc, o) => acc + o.total, 0)}</p></div></div></div>
           </div>
           {/* TICKET */}
           <div id="ticket-impresion" className="hidden print:block text-black font-mono text-sm p-0 m-0 w-[58mm]">
                {ticketParaImprimir && (
                    <>
                        <div className="text-center mb-4"><h1 className="text-xl font-bold uppercase">{config.nombreRestaurante}</h1><p>Powered by MeLu</p><p className="text-xs">{new Date().toLocaleString()}</p></div>
                        <div className="border-b-2 border-dashed border-black my-2"></div>
                        <div className="mb-2"><p className="font-bold text-lg">CUENTA CERRADA</p><p className="uppercase font-black text-xl">{ticketParaImprimir.mesa}</p></div>
                        <div className="border-b-2 border-dashed border-black my-2"></div>
                        <div className="flex flex-col gap-2">{ticketParaImprimir.items.map((item, i) => (<div key={i}><div className="flex justify-between"><span>1 x {item.nombre}</span><span>${item.precio.toFixed(2)}</span></div></div>))}</div>
                        <div className="border-b-2 border-dashed border-black my-2"></div>
                        <div className="flex justify-between text-2xl font-bold"><span>TOTAL:</span><span>${ticketParaImprimir.total.toFixed(2)}</span></div>
                        <div className="mt-8 text-center text-xs"><p>¡Gracias por su visita!</p><p>MeLu App</p></div>
                    </>
                )}
           </div>
           <style>{`@media print { body * { visibility: hidden; } #ticket-impresion, #ticket-impresion * { visibility: visible; } #ticket-impresion { position: absolute; left: 0; top: 0; width: 100%; } @page { size: auto; margin: 0mm; } }`}</style>
        </div>
    );
  };

  const renderResources = () => (<div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in"><div className="space-y-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2"><MonitorSmartphone className="text-blue-500"/> Gestión de Mesas</h3><button onClick={agregarMesaAutomatica} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition flex justify-center items-center gap-2 mb-6"><Plus size={24} /> Agregar Mesa {mesas.length > 0 ? `(Sigue la ${Math.max(...mesas.map(m=>Number(m.numero))) + 1})` : "#1"}</button><div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">{mesas.map(mesa => (<div key={mesa.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-3"><div className="flex justify-between items-center"><span className="font-black text-gray-700 text-lg">Mesa {mesa.numero}</span><button onClick={() => borrarItem("mesas", mesa.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></div><div className="bg-white p-3 rounded-lg border border-blue-100 flex flex-col gap-2"><p className="text-xs text-blue-500 font-bold uppercase">Dispositivo</p><div className="flex gap-2"><button onClick={() => copiarLinkMesa(mesa.numero)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition"><Copy size={14}/> Copiar Link</button><Link to={`/?id=${user.uid}&mesa=${mesa.numero}&mode=kiosk`} target="_blank" className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition"><ExternalLink size={14}/> Abrir</Link></div></div></div>))}</div></div></div><div className="space-y-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2"><Users className="text-orange-500"/> Equipo (Meseros)</h3><div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col gap-2"><p className="text-xs font-bold text-orange-600 uppercase">Acceso para Empleados</p><button onClick={copiarLinkMeseros} className="w-full bg-white text-orange-600 border border-orange-200 py-2 rounded-lg font-bold hover:bg-orange-600 hover:text-white transition flex items-center justify-center gap-2"><Copy size={16}/> Copiar Link de Acceso</button></div><form onSubmit={agregarMesero} className="flex gap-2 mb-6"><input type="text" placeholder="Nombre" className="flex-1 p-3 bg-gray-50 rounded-lg border w-1/2" value={nuevoMesero} onChange={e => setNuevoMesero(e.target.value)} /><input type="tel" maxLength="4" placeholder="PIN (4)" className="p-3 bg-gray-50 rounded-lg border w-24 text-center tracking-widest" value={nuevoPin} onChange={e => setNuevoPin(e.target.value)} /><button type="submit" className="bg-orange-600 text-white px-4 rounded-lg font-bold hover:bg-orange-700">Crear</button></form><div className="space-y-2">{meseros.map(m => (<div key={m.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200"><div><span className="font-medium text-gray-700 block">{m.nombre}</span><span className="text-xs text-gray-400 font-mono tracking-widest">PIN: {m.pin}</span></div><button onClick={() => borrarItem("meseros", m.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></div>))}</div></div></div></div>);
  const renderHistory = () => (<div className="animate-in fade-in space-y-6"><h2 className="text-3xl font-bold text-gray-800">Historial</h2><div className="grid grid-cols-1 gap-4">{cortesPasados.map(corte => (<div key={corte.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4"><div className="flex items-center gap-4"><div className="bg-blue-50 p-3 rounded-full text-blue-600"><CalendarClock size={24} /></div><div><p className="text-sm text-gray-400 font-bold uppercase">Cierre</p><p className="text-lg font-bold text-gray-800">{corte.fecha ? new Date(corte.fecha.seconds * 1000).toLocaleString() : "Reciente"}</p></div></div><div className="flex gap-8 text-right"><div><p className="text-xs text-gray-400 uppercase font-bold">Pedidos</p><p className="font-bold text-gray-800">{corte.cantidadPedidos}</p></div><div><p className="text-xs text-gray-400 uppercase font-bold">Total</p><p className="font-black text-2xl text-green-600">${corte.total}</p></div></div></div>))}</div></div>);
  const renderMenu = () => (<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in"><div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-6 z-10"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2">{idEdicion ? <><Edit2 className="text-blue-500"/> Editando</> : <><Plus className="text-orange-500"/> Nuevo</>}</h3>{idEdicion && <button onClick={cancelarEdicion} className="text-xs text-red-500 font-bold hover:underline">Cancelar</button>}</div><form onSubmit={guardarPlatillo} className="space-y-4"><input type="text" placeholder="Nombre" className="w-full p-3 bg-gray-50 rounded-lg border" value={nuevo.nombre} onChange={e=>setNuevo({...nuevo, nombre: e.target.value})} /><div className="flex gap-2"><input type="number" placeholder="Precio" className="w-full p-3 bg-gray-50 rounded-lg border" value={nuevo.precio} onChange={e=>setNuevo({...nuevo, precio: e.target.value})} /><select className="p-3 bg-gray-50 rounded-lg border" value={nuevo.categoria} onChange={e=>setNuevo({...nuevo, categoria: e.target.value})}><option>Comida</option><option>Bebida</option><option>Postre</option></select></div><div className="bg-gray-50 p-3 rounded-lg border border-gray-200"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-gray-500 uppercase">Imagen</span><button type="button" onClick={()=>setUsarEmoji(!usarEmoji)} className="text-xs text-blue-600 font-bold hover:underline">{usarEmoji ? "Cambiar a URL" : "Cambiar a Emoji"}</button></div>{usarEmoji ? (<div className="grid grid-cols-6 gap-2 h-24 overflow-y-auto custom-scrollbar">{FOOD_EMOJIS.map(e => <button key={e} type="button" onClick={()=>setNuevo({...nuevo, imagen:e})} className={`text-xl p-1 rounded hover:bg-white ${nuevo.imagen===e?'bg-white shadow':''}`}>{e}</button>)}</div>) : (<input type="url" className="w-full p-2 text-sm border rounded" placeholder="https://..." value={nuevo.imagen} onChange={e=>setNuevo({...nuevo, imagen:e.target.value})} />)}</div><button type="submit" className={`w-full py-3 rounded-xl font-bold text-white transition flex justify-center items-center gap-2 ${idEdicion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'}`}>{idEdicion ? "Actualizar" : "Guardar"}</button></form></div><div className="lg:col-span-8 space-y-4"><div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2"><h3 className="font-bold text-lg text-gray-800">Inventario ({platillos.length})</h3><div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">{["Todos", "Comida", "Bebida", "Postre"].map(cat => (<button key={cat} onClick={() => setFiltroAdmin(cat)} className={`px-3 py-1 rounded-md text-xs font-bold transition ${filtroAdmin === cat ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>{cat}</button>))}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{(filtroAdmin === "Todos" ? platillos : platillos.filter(p => p.categoria === filtroAdmin)).map(item => (<div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4 transition ${item.disponible === false ? 'border-red-200 bg-red-50/50 opacity-75' : 'border-gray-100'}`}><div className="relative"><div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-3xl overflow-hidden border border-gray-100">{item.imagen?.includes("http") ? <img src={item.imagen} className="w-full h-full object-cover"/> : item.imagen}</div>{item.disponible === false && (<div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg backdrop-blur-[1px]"><XCircle className="text-red-500" size={24} /></div>)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-gray-800 truncate">{item.nombre}</p>{item.disponible === false && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Agotado</span>}</div><p className="text-sm text-gray-500">{item.categoria} • <span className="text-green-600 font-bold">${item.precio}</span></p></div><div className="flex flex-col gap-1"><button onClick={()=>idEdicion===item.id ? cancelarEdicion() : (setNuevo(item) || setIdEdicion(item.id))} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition"><Edit2 size={16}/></button><button onClick={()=>toggleDisponibilidad(item)} className={`p-2 rounded-lg transition ${item.disponible === false ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{item.disponible === false ? <Eye size={16}/> : <EyeOff size={16}/>}</button><button onClick={()=>eliminarPlatillo(item.id)} className="bg-red-50 text-red-400 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></div></div>))}</div></div></div>);
  
  const renderSettings = () => (
    <div className="max-w-2xl animate-in fade-in space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración</h2>
        
        {/* PERSONALIZACIÓN DE MARCA (NUEVO) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Palette className="text-purple-500"/> Personalización de Marca (MeLu)</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-bold text-gray-500 mb-1 block">Nombre del Restaurante</label>
                    <div className="flex items-center gap-2">
                        <Type className="text-gray-400" size={20}/>
                        <input 
                            type="text" 
                            className="flex-1 p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none" 
                            value={config.nombreRestaurante}
                            onChange={(e) => setConfig({...config, nombreRestaurante: e.target.value})}
                            placeholder="Ej: Tacos El Tío"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Color Botones (Primario)</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                value={config.colorPrimario}
                                onChange={(e) => setConfig({...config, colorPrimario: e.target.value})}
                            />
                            <span className="text-sm font-mono text-gray-600">{config.colorPrimario}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-1 block">Color de Fondo</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                value={config.colorFondo}
                                onChange={(e) => setConfig({...config, colorFondo: e.target.value})}
                            />
                            <span className="text-sm font-mono text-gray-600">{config.colorFondo}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t mt-4">
                    <button 
                        onClick={guardarPersonalizacion}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition w-full flex items-center justify-center gap-2"
                    >
                        <Save size={18}/> Guardar Cambios de Marca
                    </button>
                </div>
            </div>
        </div>

        {/* CÓDIGO QR */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-6">
                <div className="bg-blue-600 text-white p-4 rounded-xl"><QrCode size={40}/></div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Menú Digital (Kiosco)</h3>
                    <p className="text-gray-500 mb-4">Link para compartir.</p>
                    <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm break-all select-all border border-gray-200">{window.location.origin}/?id={user.uid}&mode=kiosk</div>
                    <Link to={`/?id=${user.uid}&mode=kiosk`} target="_blank" className="inline-flex items-center gap-2 mt-4 text-blue-600 font-bold hover:underline">Abrir simulador <ExternalLink size={16}/></Link>
                </div>
            </div>
        </div>

        {/* ZONA PELIGRO */}
        <div className="mt-8 bg-red-50 p-8 rounded-2xl border border-red-100">
            <h3 className="text-red-800 font-bold flex items-center gap-2"><AlertTriangle size={20}/> Zona de Peligro</h3>
            <button onClick={()=>auth.signOut()} className="mt-4 bg-white text-red-600 border border-red-200 px-6 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition">Cerrar Sesión</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3"><div className="bg-orange-500 p-2 rounded-lg"><ChefHat size={24}/></div><span className="font-bold text-xl hidden lg:block">MeLu<span className="text-orange-400 font-normal text-sm ml-1">Admin</span></span></div>
        <nav className="flex-1 px-4 space-y-2">
            <button onClick={()=>setActiveTab('dashboard')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab==='dashboard'?'bg-orange-600':'hover:bg-slate-800'}`}><LayoutDashboard/> <span className="hidden lg:block">Caja</span></button>
            <button onClick={()=>setActiveTab('resources')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab==='resources'?'bg-orange-600':'hover:bg-slate-800'}`}><MonitorSmartphone/> <span className="hidden lg:block">Recursos</span></button>
            <button onClick={()=>setActiveTab('history')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab==='history'?'bg-orange-600':'hover:bg-slate-800'}`}><Archive/> <span className="hidden lg:block">Historial</span></button>
            <button onClick={()=>setActiveTab('menu')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab==='menu'?'bg-orange-600':'hover:bg-slate-800'}`}><UtensilsCrossed/> <span className="hidden lg:block">Menú</span></button>
            <button onClick={()=>setActiveTab('settings')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab==='settings'?'bg-orange-600':'hover:bg-slate-800'}`}><Settings/> <span className="hidden lg:block">Ajustes</span></button>
        </nav>
        <div className="p-4"><Link to="/cocina" className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-blue-400 rounded-xl hover:bg-slate-700"><ChefHat size={20}/> <span className="hidden lg:block">Cocina</span></Link></div>
      </aside>
      <main className="flex-1 ml-20 lg:ml-64 p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'menu' && renderMenu()}
        {activeTab === 'settings' && renderSettings()}
      </main>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }`}</style>
    </div>
  );
}
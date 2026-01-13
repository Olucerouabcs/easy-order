// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Trash2, Plus, Save, ChefHat, Smartphone, QrCode, Image as ImageIcon, Smile } from "lucide-react";
import toast from 'react-hot-toast';

// Lista predefinida de Emojis para comida
const FOOD_EMOJIS = [
  "🍔", "🍕", "🌭", "🌮", "🌯", "🥗", "🍝", "🍜",
  "🍱", "🍣", "🍤", "🍚", "🥩", "🍗", "🥪", "🍟",
  "🍪", "🍩", "🍰", "🍦", "🍫", "🍬", "🍮", "🧁",
  "☕", "🍺", "🍷", "🍹", "🥤", "🥛", "🥥", "🍉"
];

export default function Admin() {
  const [platillos, setPlatillos] = useState([]);

  // Estado del formulario
  const [nuevo, setNuevo] = useState({
    nombre: "", precio: "", categoria: "Comida", descripcion: "", imagen: "🍔"
  });

  // Estado para controlar si usa Emoji o URL
  const [usarEmoji, setUsarEmoji] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "menu"), where("uid", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlatillos(docs);
    });
    return () => unsubscribe();
  }, []);

  const guardarPlatillo = async (e) => {
    e.preventDefault();

    // 1. Validaciones
    if (!nuevo.nombre || !nuevo.precio) return toast.error("Faltan nombre o precio");
    if (Number(nuevo.precio) < 0) return toast.error("El precio no puede ser negativo 📉");

    try {
      await addDoc(collection(db, "menu"), {
        ...nuevo,
        precio: Number(nuevo.precio),
        uid: auth.currentUser.uid
      });
      // Resetear form
      setNuevo({ nombre: "", precio: "", categoria: "Comida", descripcion: "", imagen: "🍔" });
      setUsarEmoji(true);
      toast.success("Platillo creado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    }
  };

  const eliminarPlatillo = async (id) => {
    if (confirm("¿Borrar este platillo?")) {
      await deleteDoc(doc(db, "menu", id));
      toast.success("Platillo eliminado");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* NAVBAR SUPERIOR */}
      <nav className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg"><ChefHat className="text-orange-600" /></div>
          <div>
            <h1 className="font-bold text-xl text-gray-800 leading-none">Panel de Control</h1>
            <p className="text-xs text-gray-400">Administrador</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/cocina" className="flex-1 md:flex-none bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-700 transition shadow-lg shadow-slate-200">
            <ChefHat size={18} /> Cocina
          </Link>
          <Link
             to={`/?id=${auth.currentUser?.uid}&mode=kiosk`}
             target="_blank"
             className="flex-1 md:flex-none bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-orange-700 transition shadow-lg shadow-orange-200"
          >
            <Smartphone size={18} /> Tablet Cliente
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-4 space-y-6">

          {/* Tarjeta del Link QR */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
            <QrCode className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><QrCode size={20}/> Tu Menú Digital</h3>
            <p className="text-blue-100 text-sm mb-4">Usa este enlace para generar tu código QR:</p>
            <div className="bg-white/10 backdrop-blur p-3 rounded-lg font-mono text-xs break-all select-all border border-white/20">
              {window.location.origin}/?id={auth.currentUser?.uid}
            </div>
          </div>

          {/* Formulario de Crear */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <Plus className="bg-green-100 text-green-600 rounded-full p-1" size={24} /> Nuevo Platillo
            </h2>

            <form onSubmit={guardarPlatillo} className="space-y-5">

              {/* Nombre */}
              <div>
                <label className="label-admin">Nombre del producto</label>
                <input type="text" className="input-admin" placeholder="Ej. Hamburguesa Deluxe" value={nuevo.nombre} onChange={(e) => setNuevo({...nuevo, nombre: e.target.value})} />
              </div>

              {/* Precio y Categoría */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-admin">Precio ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    className="input-admin"
                    placeholder="0.00"
                    value={nuevo.precio}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if(val >= 0 || e.target.value === "") setNuevo({...nuevo, precio: e.target.value})
                    }}
                  />
                </div>
                <div>
                  <label className="label-admin">Categoría</label>
                  <select className="input-admin" value={nuevo.categoria} onChange={(e) => setNuevo({...nuevo, categoria: e.target.value})}>
                    <option>Comida</option>
                    <option>Bebida</option>
                    <option>Postre</option>
                  </select>
                </div>
              </div>

              {/* SELECCIÓN DE IMAGEN / EMOJI */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                <div className="flex justify-between items-center mb-3">
                    <label className="label-admin mb-0">Imagen del producto</label>
                    <button
                        type="button"
                        onClick={() => {
                            setUsarEmoji(!usarEmoji);
                            setNuevo({...nuevo, imagen: !usarEmoji ? "🍔" : ""});
                        }}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all border ${usarEmoji ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'}`}
                    >
                        {usarEmoji ? <><Smile size={14}/> Cambiar a URL</> : <><ImageIcon size={14}/> Cambiar a Emoji</>}
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Mensaje de Modo */}
                    <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${usarEmoji ? 'text-orange-600' : 'text-blue-600'}`}>
                        {usarEmoji ? <span>Selecciona un Emoji:</span> : <span>Pega un enlace:</span>}
                    </div>

                    {/* SELECTORES */}
                    {usarEmoji ? (
                        <div className="grid grid-cols-6 gap-2 h-32 overflow-y-auto p-2 custom-scrollbar border border-gray-200 rounded-lg bg-white">
                            {FOOD_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setNuevo({...nuevo, imagen: emoji})}
                                    className={`text-2xl hover:bg-gray-100 p-2 rounded-lg transition relative ${nuevo.imagen === emoji ? 'bg-orange-50 shadow-sm ring-2 ring-orange-400 z-10' : ''}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2">
                             <input
                                type="url"
                                className="input-admin text-sm"
                                placeholder="https://ejemplo.com/foto.jpg"
                                value={nuevo.imagen.includes("http") ? nuevo.imagen : ""}
                                onChange={(e) => setNuevo({...nuevo, imagen: e.target.value})}
                            />
                            {/* --- ERROR CORREGIDO AQUÍ ABAJO (usé &rarr;) --- */}
                            <p className="text-[10px] text-gray-400 mt-1">Tip: Busca en Google Imágenes, Click derecho &rarr; Copiar dirección de imagen.</p>
                        </div>
                    )}

                    {/* Preview GRANDE */}
                    <div className="mt-4">
                        <label className="label-admin text-center mb-2">Así se verá:</label>
                        <div className="w-full h-48 bg-white rounded-xl shadow-inner border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                            {/* Fondo cuadriculado suave para transparencia */}
                            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            
                            {nuevo.imagen.includes("http") ? (
                                <img src={nuevo.imagen} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-8xl drop-shadow-md transform group-hover:scale-110 transition duration-300">
                                    {nuevo.imagen || "❓"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="label-admin">Descripción</label>
                <textarea className="input-admin" rows="2" placeholder="Ingredientes..." value={nuevo.descripcion} onChange={(e) => setNuevo({...nuevo, descripcion: e.target.value})}></textarea>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition flex justify-center items-center gap-2 text-lg shadow-xl shadow-slate-200">
                <Save size={20} /> Guardar al Menú
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA */}
        <div className="lg:col-span-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Inventario Actual ({platillos.length})</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platillos.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition group">
                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-4xl group-hover:scale-110 transition overflow-hidden relative border border-gray-100">
                  {item.imagen?.includes("http") ? (
                      <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                  ) : (
                      item.imagen
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-lg">{item.nombre}</h3>
                    <button onClick={() => eliminarPlatillo(item.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18} /></button>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-1">{item.descripcion}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md text-sm">${item.precio}</span>
                    <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-md">{item.categoria}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .label-admin { display: block; font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 0.5rem; }
        .input-admin { width: 100%; padding: 0.75rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-weight: 500; outline: none; transition: all; }
        .input-admin:focus { background-color: #fff; border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; border: 1px solid #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}
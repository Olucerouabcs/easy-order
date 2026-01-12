// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { Trash2, PlusCircle, Save } from "lucide-react";

export default function Admin() {
  const [platillos, setPlatillos] = useState([]);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    precio: "",
    categoria: "Comida",
    descripcion: "",
    imagen: "🍽️" // Por defecto un emoji
  });

  // 1. Escuchar el menú en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menu"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlatillos(docs);
    });
    return () => unsubscribe();
  }, []);

  // 2. Función CREAR
  const guardarPlatillo = async (e) => {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.precio) return alert("Faltan datos");

    try {
      await addDoc(collection(db, "menu"), {
        ...nuevo,
        precio: Number(nuevo.precio) // Convertir texto a número
      });
      // Limpiar formulario
      setNuevo({ nombre: "", precio: "", categoria: "Comida", descripcion: "", imagen: "🍽️" });
      alert("Platillo creado con éxito");
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Función BORRAR
  const eliminarPlatillo = async (id) => {
    if (confirm("¿Seguro que quieres borrar este platillo?")) {
      await deleteDoc(doc(db, "menu", id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-black text-gray-800 mb-8">⚙️ Panel de Administración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO DE CREACIÓN (Izquierda) */}
        <div className="bg-white p-6 rounded-xl shadow-lg h-fit">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PlusCircle className="text-blue-600" /> Nuevo Platillo
          </h2>
          
          <form onSubmit={guardarPlatillo} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700">Nombre</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded-lg" 
                value={nuevo.nombre}
                onChange={(e) => setNuevo({...nuevo, nombre: e.target.value})}
                placeholder="Ej. Tacos de Pastor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Precio ($)</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded-lg" 
                  value={nuevo.precio}
                  onChange={(e) => setNuevo({...nuevo, precio: e.target.value})}
                  placeholder="Ej. 50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Emoji / Icono</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-center" 
                  value={nuevo.imagen}
                  onChange={(e) => setNuevo({...nuevo, imagen: e.target.value})}
                  placeholder="🌮"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Categoría</label>
              <select 
                className="w-full border p-2 rounded-lg"
                value={nuevo.categoria}
                onChange={(e) => setNuevo({...nuevo, categoria: e.target.value})}
              >
                <option>Comida</option>
                <option>Bebida</option>
                <option>Postre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Descripción</label>
              <textarea 
                className="w-full border p-2 rounded-lg"
                rows="3"
                value={nuevo.descripcion}
                onChange={(e) => setNuevo({...nuevo, descripcion: e.target.value})}
                placeholder="Ingredientes deliciosos..."
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
              <Save size={20} /> Guardar Platillo
            </button>
          </form>
        </div>

        {/* LISTA DE PLATILLOS (Derecha) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-4">Menú Actual ({platillos.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platillos.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center border-l-4 border-orange-500">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{item.imagen}</span>
                  <div>
                    <h3 className="font-bold">{item.nombre}</h3>
                    <p className="text-gray-500 text-sm">${item.precio} - {item.categoria}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => eliminarPlatillo(item.id)}
                  className="text-red-500 bg-red-100 p-2 rounded-lg hover:bg-red-200 transition"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
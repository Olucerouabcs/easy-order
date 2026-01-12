// src/components/Menu.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

// NOTA: Mira cómo recibimos "agregarAlCarrito" aquí abajo vvv
export default function Menu({ agregarAlCarrito }) {
  const [platillos, setPlatillos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerMenu = async () => {
      const productosRef = collection(db, "menu");
      const respuesta = await getDocs(productosRef);
      const productos = respuesta.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlatillos(productos);
      setCargando(false);
    };
    obtenerMenu();
  }, []);

  if (cargando) return <h2 className="text-center mt-10">Cargando...</h2>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {platillos.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
            <div className="h-32 bg-orange-50 flex items-center justify-center text-6xl">
              {item.imagen}
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-gray-800 leading-tight">{item.nombre}</h3>
              <p className="text-gray-400 text-xs mt-1 mb-3 line-clamp-2">{item.descripcion}</p>
              
              <div className="mt-auto flex justify-between items-center">
                <span className="font-bold text-green-700">${item.precio}</span>
                
                {/* ESTE ES EL BOTÓN MÁGICO vvv */}
                <button 
                  onClick={() => agregarAlCarrito(item)}
                  className="bg-orange-100 text-orange-600 p-2 rounded-lg hover:bg-orange-200 active:bg-orange-300 transition"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
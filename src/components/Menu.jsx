// src/components/Menu.jsx
import { useState, useMemo } from 'react';

// AHORA RECIBIMOS "estiloMarca" (que trae el color)
export default function Menu({ agregarAlCarrito, platillos = [], estiloMarca }) {
  const [filtro, setFiltro] = useState("Todos");

  const platillosDisponibles = platillos.filter(p => p.disponible !== false);

  const categorias = useMemo(() => {
    const cats = ["Todos", ...new Set(platillosDisponibles.map(p => p.categoria))];
    return cats;
  }, [platillosDisponibles]);

  const platillosFiltrados = filtro === "Todos" 
    ? platillosDisponibles 
    : platillosDisponibles.filter(p => p.categoria === filtro);

  const colorPrimario = estiloMarca?.color || "#0f172a"; // Color por defecto si no hay marca

  if (platillos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg animate-pulse">Cargando menú... 🍔</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      
      {/* BARRA DE CATEGORÍAS */}
      <div className="sticky top-[60px] z-10 bg-white/95 backdrop-blur-sm py-4 mb-4 border-b border-gray-200 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 min-w-max mx-auto max-w-5xl">
            {categorias.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFiltro(cat)}
                    style={{ 
                        backgroundColor: filtro === cat ? colorPrimario : 'white',
                        color: filtro === cat ? 'white' : '#4b5563',
                        borderColor: filtro === cat ? colorPrimario : '#e5e7eb'
                    }}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm border`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* GRILLA DE PRODUCTOS */}
      <div className="p-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {platillosFiltrados.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                
                <div className="h-40 bg-gray-50 flex items-center justify-center relative overflow-hidden group">
                {item.imagen?.includes("http") || item.imagen?.includes("data:image") ? (
                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                ) : (
                    <span className="text-7xl drop-shadow-sm select-none transition-transform duration-300 group-hover:scale-110">{item.imagen || "🍽️"}</span>
                )}
                <span className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg font-black text-gray-800 text-sm shadow-sm border border-gray-100">
                    ${item.precio}
                </span>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-black text-gray-800 text-lg leading-tight mb-2">{item.nombre}</h3>
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed font-medium">
                        {item.descripcion}
                    </p>
                    
                    <div className="mt-auto">
                        <button 
                            onClick={() => agregarAlCarrito(item)}
                            // AQUÍ APLICAMOS EL COLOR DE LA MARCA
                            style={{ backgroundColor: colorPrimario }}
                            className="w-full text-white py-3 rounded-xl font-bold text-sm active:scale-95 transition-all duration-300 flex justify-center items-center gap-2 hover:brightness-110"
                        >
                            Agregar +
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}
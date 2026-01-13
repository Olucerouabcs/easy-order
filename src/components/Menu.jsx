// src/components/Menu.jsx
import toast from 'react-hot-toast';

export default function Menu({ agregarAlCarrito, platillos = [] }) {
  
  if (platillos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg animate-pulse">Cargando menú delicioso... 🍔</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto pb-32">
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {platillos.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            
            {/* --- AQUÍ ESTÁ LA CORRECCIÓN --- */}
            <div className="h-40 bg-gray-50 flex items-center justify-center relative overflow-hidden">
              {item.imagen?.includes("http") ? (
                // CASO 1: ES UNA FOTO (URL)
                <img 
                  src={item.imagen} 
                  alt={item.nombre} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              ) : (
                // CASO 2: ES UN EMOJI
                <span className="text-7xl drop-shadow-sm select-none">
                  {item.imagen || "🍽️"}
                </span>
              )}

              {/* Etiqueta de precio flotante */}
              <span className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg font-black text-gray-800 text-sm shadow-sm border border-gray-100">
                ${item.precio}
              </span>
            </div>
            {/* ------------------------------- */}
            
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black text-gray-800 text-lg leading-tight">{item.nombre}</h3>
              </div>
              
              <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed font-medium">
                {item.descripcion}
              </p>
              
              <div className="mt-auto">
                <button 
                  onClick={() => {
                    agregarAlCarrito(item);
                    toast.success(`¡${item.nombre} al carrito!`, { 
                      icon: '😋',
                      style: { borderRadius: '10px', background: '#333', color: '#fff' }
                    });
                  }}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 active:scale-95 transition-all duration-300 flex justify-center items-center gap-2 group"
                >
                  Agregar
                  <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center group-hover:bg-white group-hover:text-orange-600 transition-colors">
                    +
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
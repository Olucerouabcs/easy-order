// src/pages/Login.jsx
import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Lock, ChefHat, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setError("Usuario o contraseña incorrectos.");
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4">
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Cabecera del Card */}
        <div className="bg-orange-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 rotate-12 scale-150"></div>
          <div className="relative z-10 flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <ChefHat size={40} className="text-orange-600" />
            </div>
          </div>
          <h2 className="relative z-10 text-3xl font-black text-white">Sabor Digital</h2>
          <p className="relative z-10 text-orange-100 text-sm mt-1">Portal Administrativo</p>
        </div>

        {/* Formulario */}
        <div className="p-8 pt-10">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 border border-red-100">
              <Lock size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Correo Corporativo</label>
              <input 
                type="email" 
                required
                placeholder="admin@restaurante.com"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-xl shadow-slate-900/20"
            >
              {cargando ? "Accediendo..." : <>Entrar al Sistema <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>
      </div>

      <p className="fixed bottom-5 text-slate-500 text-xs">© 2026 Sabor Digital SaaS</p>
    </div>
  );
}
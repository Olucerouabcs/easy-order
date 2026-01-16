// src/pages/Login.jsx
import { useState } from "react";
import { auth, db } from "../firebase/config";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Importamos getDoc para verificar si existe
import { useNavigate } from "react-router-dom";
import { ChefHat, ArrowRight, Loader2 } from "lucide-react";
import toast from 'react-hot-toast';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Función para crear la config por defecto si el usuario es nuevo
  const crearConfiguracionInicial = async (uid) => {
    // Verificamos si ya existe configuración para no sobrescribir
    const docRef = doc(db, "configuracion", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        await setDoc(docRef, {
            nombreRestaurante: "Nuevo Restaurante",
            colorPrimario: "#ea580c", // Naranja MeLu
            colorFondo: "#f8fafc"     // Gris claro
        });
    }
  };

  // Login con Correo/Contraseña
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await crearConfiguracionInicial(userCredential.user.uid);
        toast.success("¡Cuenta creada! Bienvenido a MeLu.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("¡Bienvenido de vuelta!");
      }
      navigate("/admin");
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') toast.error("Este correo ya está registrado.");
      else if (error.code === 'auth/wrong-password') toast.error("Contraseña incorrecta.");
      else if (error.code === 'auth/user-not-found') toast.error("Usuario no encontrado.");
      else if (error.code === 'auth/weak-password') toast.error("La contraseña debe tener al menos 6 caracteres.");
      else toast.error("Error de autenticación.");
    } finally {
      setLoading(false);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        // Si es la primera vez, creamos su config. Si ya existe, no hace nada.
        await crearConfiguracionInicial(result.user.uid);
        
        toast.success(`¡Hola, ${result.user.displayName}! 👋`);
        navigate("/admin");
    } catch (error) {
        console.error(error);
        toast.error("No se pudo iniciar sesión con Google.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* LADO IZQUIERDO: FORMULARIO */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white w-full lg:w-[500px]">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-orange-600 p-2 rounded-lg shadow-lg shadow-orange-200">
                <ChefHat className="text-white" size={32} />
            </div>
            <span className="text-3xl font-black text-gray-900 tracking-tighter">MeLu</span>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isRegistering ? "Crea tu cuenta" : "Inicia sesión"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegistering ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
            <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="font-bold text-orange-600 hover:text-orange-500 transition hover:underline"
            >
              {isRegistering ? "Inicia sesión aquí" : "Regístrate gratis"}
            </button>
          </p>

          <div className="mt-8">
            {/* BOTÓN GOOGLE */}
            <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition mb-6"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O usa tu correo</span></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition items-center gap-2 hover:scale-[1.02] active:scale-95 duration-200"
              >
                {loading ? <Loader2 className="animate-spin"/> : (isRegistering ? "Crear Cuenta" : "Entrar")} 
                {!loading && <ArrowRight size={16}/>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* LADO DERECHO: IMAGEN DE INTERIOR DE RESTAURANTE */}
      <div className="hidden lg:block relative w-0 flex-1">
        {/* Imagen de restaurante elegante y moderna */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
          alt="Interior de restaurante moderno"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-16 text-white max-w-2xl">
            <h3 className="text-5xl font-black mb-6 leading-tight">Tu restaurante, <br/>al siguiente nivel.</h3>
            <p className="text-xl opacity-90 font-light leading-relaxed">
                Gestiona comandas, mesas y cobros desde cualquier dispositivo. 
                Sin hardware costoso, sin complicaciones.
            </p>
        </div>
      </div>
    </div>
  );
}
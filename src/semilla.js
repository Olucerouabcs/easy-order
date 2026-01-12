// src/semilla.js
import { db } from "./firebase/config";
import { collection, addDoc } from "firebase/firestore";

const menuFalso = [
  { nombre: "Hamburguesa Monster", precio: 150, categoria: "Comida", imagen: "🍔", descripcion: "Doble carne, tocino y queso" },
  { nombre: "Tacos Gobernador (3)", precio: 120, categoria: "Comida", imagen: "🌮", descripcion: "Camarón con queso" },
  { nombre: "Pizza Suprema", precio: 200, categoria: "Comida", imagen: "🍕", descripcion: "Familiar con todo" },
  { nombre: "Coca Cola 600ml", precio: 35, categoria: "Bebida", imagen: "🥤", descripcion: "Bien fría" },
  { nombre: "Limonada Mineral", precio: 45, categoria: "Bebida", imagen: "🍹", descripcion: "Natural" },
  { nombre: "Brownie con Nieve", precio: 80, categoria: "Postre", imagen: "🍰", descripcion: "Chocolate caliente" }
];

export const subirMenu = async () => {
  try {
    const colRef = collection(db, "menu");
    console.log("Iniciando subida...");
    
    for (const platillo of menuFalso) {
      await addDoc(colRef, platillo);
      console.log("Subido: ", platillo.nombre);
    }
    alert("✅ ¡ÉXITO! Menú cargado en Firebase.");
  } catch (error) {
    console.error("Error subiendo datos: ", error);
    alert("❌ Error: Revisa la consola (F12)");
  }
};
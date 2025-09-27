import express from "express";
import rectangulo from "./Rectangulos.js";
import { conectarDB } from "./db.js";

const app = express();
const port =  3000;

// Conexión a DB
conectarDB();

app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

// Prefijo correcto para el router
app.use("/", rectangulo);

app.listen(port, () => {
  console.log(` Servidor  en puerto: ${port}`);
});

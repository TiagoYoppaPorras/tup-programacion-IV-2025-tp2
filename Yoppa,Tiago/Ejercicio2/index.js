import express from "express";
import { conectarDB } from "./db.js";
import tareasRouter from "./tareas.js"
conectarDB()


const app = express();
const port = 3000;

// Para interpretar body como JSON
app.use(express.json());
app.get("/", (req, res) => {
  // Responder con string
  res.send("Hola mundo!");
});
app.use("/tareas",tareasRouter )
app.listen(port, () => {
  console.log(`puerto funcionando en ${port}`);
});

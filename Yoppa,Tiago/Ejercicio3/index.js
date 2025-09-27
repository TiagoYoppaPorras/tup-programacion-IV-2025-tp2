import express from "express";
import { conectarDB } from "./db.js";
import materiasRouter from "./materias.js"
import alumnosRouter from "./alumnos.js";
conectarDB()


const app = express();
const port = 3000;

// Para interpretar body como JSON
app.use(express.json());
app.get("/", (req, res) => {
  // Responder con string
  res.send("Hola mundo!");
});


app.use("/alumnos", alumnosRouter);
app.use("/materias", materiasRouter);




app.listen(port, () => {
  console.log(`puerto funcionando en ${port}`);
});

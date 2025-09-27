import express from "express";
import { body, param, validationResult } from "express-validator";
import { db } from "./db.js";

const router = express.Router();

// Validaciones
const validacionID = param("id").isInt({ min: 1 }).withMessage("El ID debe ser positivo");

const validarMateria = [
  body("nombre").isString().isLength({ min: 1, max: 50 }).withMessage("Nombre inválido")
];

// Middleware de validación
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ success: false, errores: errores.array() });
  }
  next();
};

// GET todas las materias
router.get("/", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM materias");
  res.json({ success: true, data: rows });
});

// GET materia por ID
router.get("/:id", validacionID, validar, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute("SELECT * FROM materias WHERE id = ?", [id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: "Materia no encontrada" });
  res.json({ success: true, data: rows[0] });
});

// POST crear materia
router.post("/", validarMateria, validar, async (req, res) => {
  const { nombre } = req.body;
  const [rows] = await db.execute("SELECT id FROM materias WHERE nombre = ?", [nombre]);
  if (rows.length > 0) return res.status(400).json({ success: false, message: "La materia ya existe" });

  const [result] = await db.execute("INSERT INTO materias (nombre) VALUES (?)", [nombre]);
  res.status(201).json({ success: true, data: { id: result.insertId, nombre } });
});

// PUT actualizar materia
router.put("/:id", validacionID, validarMateria, validar, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body;

  // Verificar existencia
  const [rows] = await db.execute("SELECT * FROM materias WHERE id = ?", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "Materia no encontrada" });
  }

  // Verificar duplicado
  const [rowsNombre] = await db.execute(
    "SELECT id FROM materias WHERE nombre = ? AND id != ?",
    [nombre, id]
  );
  if (rowsNombre.length > 0) {
    return res.status(400).json({ success: false, message: "Ya existe una materia con ese nombre" });
  }

  await db.execute("UPDATE materias SET nombre = ? WHERE id = ?", [nombre, id]);
  res.json({ success: true, data: { id, nombre } });
});

// DELETE eliminar materia
router.delete("/:id", validacionID, validar, async (req, res) => {
  const id = Number(req.params.id);

  // Verificar existencia
  const [rows] = await db.execute("SELECT * FROM materias WHERE id = ?", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "Materia no encontrada" });
  }

  // Eliminar materia
  await db.execute("DELETE FROM materias WHERE id = ?", [id]);
  res.json({ success: true, message: "La materia fue eliminada correctamente" });
});


export default router;

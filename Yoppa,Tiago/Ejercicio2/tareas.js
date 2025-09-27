import { body, param, query, validationResult } from "express-validator";
import express from "express";
import { db } from "./db.js";
const router = express.Router();

// Validaciones
const validacionID = param("id").isInt({ min: 1 }).withMessage("El ID debe ser positivo");

const validacionTAREA = [
  body("nombre").isString().isLength({ min: 1, max: 50 }).withMessage("El texto es incorrecto!"),
  body("completada").isBoolean().withMessage("El valor es incorrecto!").toBoolean()
];

const ValidadorFiltros = [
  query("completada").optional().isBoolean().toBoolean().withMessage("Dato incorrecto")
];

// Middleware de validación
const validacionDeTarea = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errores: errores.array()
    });
  }
  next();
};

// GET todas las tareas
router.get("/", ValidadorFiltros, validacionDeTarea, async (req, res) => {
  const filtros = [];
  const parametros = [];
  const { completada } = req.query;

  let sql = "SELECT * FROM tareas";

  if (completada !== undefined) {
    filtros.push("completada = ?");
    parametros.push(completada === "true" ? 1 : 0);
  }

  if (filtros.length > 0) {
    sql += " WHERE " + filtros.join(" AND ");
  }

  const [rows] = await db.execute(sql, parametros);
  res.json({ success: true, data: rows });
});

// GET tarea por ID
router.get("/:id", validacionID, validacionDeTarea, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute("SELECT * FROM tareas WHERE id = ?", [id]);

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "La tarea no se encuentra" });
  }

  res.json({ success: true, data: rows[0] });
});

// POST crear tarea
router.post("/", validacionTAREA, validacionDeTarea, async (req, res) => {
  const { nombre, completada } = req.body;

  // Verificar que no se repita
  const [rows] = await db.execute("SELECT id FROM tareas WHERE nombre = ?", [nombre]);
  if (rows.length > 0) {
    return res.status(400).json({ success: false, message: "La tarea ya está creada" });
  }

  // Insertar tarea
  const [result] = await db.execute(
    "INSERT INTO tareas (nombre, completada) VALUES (?, ?)",
    [nombre, completada]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, nombre, completada }
  });
});

// PUT actualizar tarea por ID
router.put("/:id", validacionID, validacionTAREA, validacionDeTarea, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, completada } = req.body;

  // Verificar existencia
  const [rows] = await db.execute("SELECT * FROM tareas WHERE id = ?", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "La tarea no se encuentra" });
  }

  // Verificar nombre duplicado
  const [rowsNombre] = await db.execute(
    "SELECT id FROM tareas WHERE nombre = ? AND id != ?",
    [nombre, id]
  );
  if (rowsNombre.length > 0) {
    return res.status(400).json({ success: false, message: "ya existe esta tarea" });
  }

  // Actualizar
  await db.execute(
    "UPDATE tareas SET nombre = ?, completada = ? WHERE id = ?",
    [nombre, completada, id]
  );

  res.json({
    success: true,
    data: { id, nombre, completada },
    message: "estado de tarea completo"
  });
});

// DELETE eliminar tarea por ID
router.delete("/:id", validacionID, validacionDeTarea, async (req, res) => {
  const id = Number(req.params.id);

  // Verificar existencia
  const [rows] = await db.execute("SELECT * FROM tareas WHERE id = ?", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "La tarea no se encuentra" });
  }

  // Eliminar
  await db.execute("DELETE FROM tareas WHERE id = ?", [id]);

  res.json({
    success: true,
    message: `La tarea con id ${id} fue eliminada`
  });
});


export default router;

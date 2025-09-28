import express from "express";
import { body, param, validationResult } from "express-validator";
import { db } from "./db.js";

const router = express.Router();


const validarID = param("id")
  .isInt({ min: 1 })
  .withMessage("ID debe ser positivo");

const validarAlumno = [
  body("nombre").isString().isLength({ min: 1, max: 50 }).withMessage("Nombre incorrecto"),
  body("materia_id").isInt({ min: 1 }).withMessage("Materia incorrecto"),
  body("nota1").isFloat({ min: 0, max: 10 }).withMessage("Nota1 incorrecto"),
  body("nota2").isFloat({ min: 0, max: 10 }).withMessage("Nota2 incorrecto"),
  body("nota3").isFloat({ min: 0, max: 10 }).withMessage("Nota3 incorrecto"),
];

const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ success: false, errores: errores.array() });
  }
  next();
};



// Traer todos los alumnos
router.get("/", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT a.id, a.nombre, m.nombre AS materia, a.nota1, a.nota2, a.nota3
    FROM alumnos a
    JOIN materias m ON a.materia_id = m.id
  `);
  res.json({ success: true, data: rows });
});

// Traer alumno por ID
router.get("/:id", validarID, validar, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute(
    `SELECT a.id, a.nombre, m.nombre AS materia, a.nota1, a.nota2, a.nota3
     FROM alumnos a
     JOIN materias m ON a.materia_id = m.id
     WHERE a.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "El alumno no fue encontrado" });
  }
  res.json({ success: true, data: rows[0] });
});

// Crear alumno
router.post("/", validarAlumno, validar, async (req, res) => {
  const { nombre, materia_id, nota1, nota2, nota3 } = req.body;

  // Verificar que la materia exista
  const [materias] = await db.execute(
    "SELECT id FROM materias WHERE id = ?",
    [materia_id]
  );
  if (materias.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "La materia no existe" });
  }

  // Verificar que no se duplique
  const [rows] = await db.execute(
    "SELECT id FROM alumnos WHERE nombre = ? AND materia_id = ?",
    [nombre, materia_id]
  );
  if (rows.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: "El alumno ya existe en esa materia" });
  }

  const [result] = await db.execute(
    "INSERT INTO alumnos (nombre, materia_id, nota1, nota2, nota3) VALUES (?,?,?,?,?)",
    [nombre, materia_id, nota1, nota2, nota3]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, nombre, materia_id, nota1, nota2, nota3 },
  });
});


// Actualizar alumno
router.put("/:id", validarID, validarAlumno, validar, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, materia_id, nota1, nota2, nota3 } = req.body;

  // Verificar que la materia exista
  const [materias] = await db.execute(
    "SELECT id FROM materias WHERE id = ?",
    [materia_id]
  );
  if (materias.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "La materia no existe" });
  }

  // Verificar duplicados excepto el mismo ID
  const [rows] = await db.execute(
    "SELECT id FROM alumnos WHERE nombre = ? AND materia_id = ? AND id != ?",
    [nombre, materia_id, id]
  );
  if (rows.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: "El alumno ya existe en esa materia" });
  }

  await db.execute(
    `UPDATE alumnos
     SET nombre = ?, materia_id = ?, nota1 = ?, nota2 = ?, nota3 = ?
     WHERE id = ?`,
    [nombre, materia_id, nota1, nota2, nota3, id]
  );

  res.json({
    success: true,
    data: { id, nombre, materia_id, nota1, nota2, nota3 },
  });
});


// Eliminar alumno
router.delete("/:id", validarID, validar, async (req, res) => {
  const id = Number(req.params.id);

  //  Verificar que el alumno exista
  const [alumnos] = await db.execute(
    "SELECT * FROM alumnos WHERE id = ?",
    [id]
  );
  if (alumnos.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "El alumno no existe" });
  }

  //  Verificar que la materia asociada exista
  const materia_id = alumnos[0].materia_id;
  const [materias] = await db.execute(
    "SELECT id FROM materias WHERE id = ?",
    [materia_id]
  );
  if (materias.length === 0) {
    return res.status(400).json({
      success: false,
      message: "La materia asociada al alumno no existe",
    });
  }

  // Eliminar alumno
  await db.execute("DELETE FROM alumnos WHERE id = ?", [id]);

  res.json({ success: true, message: "Alumno eliminado correctamente" });
});


export default router;
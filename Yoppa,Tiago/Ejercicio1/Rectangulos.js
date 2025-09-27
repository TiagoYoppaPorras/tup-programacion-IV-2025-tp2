import { body, param, query, validationResult } from "express-validator";
import express from "express";
import { db } from "./db.js";
const router = express.Router();

// Middleware de validación
function checkValidations(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// Listar todos
router.get("/rectangulos", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM rectangulos");
  res.json({ success: true, data: rows });
});

// Obtener por ID
router.get(
  "/rectangulos/:id",
  [
    param("id")
      .isInt({ gt: 0 })
      .withMessage("El id debe ser un número entero positivo"),
  ],
  checkValidations,
  async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM rectangulos WHERE id=?", [
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rectángulo no encontrado" });
    }

    res.json({ success: true, data: rows[0] });
  }
);

// Crear rectángulo
router.post(
  "/rectangulos",
  [
    body("base")
      .isFloat({ gt: 0 })
      .withMessage("base debe ser un número positivo"),
    body("altura")
      .isFloat({ gt: 0 })
      .withMessage("altura debe ser un número positivo"),
  ],
  checkValidations,
  async (req, res) => {
    const { base, altura } = req.body;

    const perimetro = 2 * (base + altura);
    const superficie = base * altura;

    const [result] = await db.execute(
      "INSERT INTO rectangulos (base, altura, perimetro, superficie) VALUES (?,?,?,?)",
      [base, altura, perimetro, superficie]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, base, altura, perimetro, superficie },
    });
  }
);

// Modificar rectángulo
router.put(
  "/rectangulos/:id",
  [
    param("id")
      .isInt({ gt: 0 })
      .withMessage("El id debe ser un número entero positivo"),
    body("base")
      .isFloat({ gt: 0 })
      .withMessage("base debe ser un número positivo"),
    body("altura")
      .isFloat({ gt: 0 })
      .withMessage("altura debe ser un número positivo"),
  ],
  checkValidations,
  async (req, res) => {
    const id = Number(req.params.id);
    const { base, altura } = req.body;

    const perimetro = 2 * (base + altura);
    const superficie = base * altura;

    const [result] = await db.execute(
      "UPDATE rectangulos SET base=?, altura=?, perimetro=?, superficie=? WHERE id=?",
      [base, altura, perimetro, superficie, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rectángulo no encontrado" });
    }

    res.json({
      success: true,
      data: { id, base, altura, perimetro, superficie },
    });
  }
);

// Eliminar
router.delete(
  "/rectangulos/:id",
  [
    param("id")
      .isInt({ gt: 0 })
      .withMessage("El id debe ser un número entero positivo"),
  ],
  checkValidations,
  async (req, res) => {
    const id = Number(req.params.id);

    const [result] = await db.execute("DELETE FROM rectangulos WHERE id=?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rectángulo no encontrado" });
    }

    res.json({ success: true, data: id });
  }
);

export default router;

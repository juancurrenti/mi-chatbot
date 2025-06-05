// api/test.js
module.exports = (req, res) => {
  console.log("API /api/test fue invocada exitosamente!");
  res.status(200).json({ message: "Hola desde /api/test!" });
};
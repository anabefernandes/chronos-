const errorHandler = (err, req, res, next) => {
  console.error(err);
  res
    .status(err.statusCode || 500)
    .json({ msg: err.message || "Erro interno" });
};

const notFound = (req, res) =>
  res.status(404).json({ msg: "Rota não encontrada" });

module.exports = { errorHandler, notFound };

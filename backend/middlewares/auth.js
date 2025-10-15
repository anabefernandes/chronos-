const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ msg: "Token não enviado" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token inválido" });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Permissão negada" });
    }
    next();
  };

module.exports = { auth, requireRole };

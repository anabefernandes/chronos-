require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dbConnect = require("./config/db");
const { swaggerUi, swaggerSpec } = require("./swagger");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
dbConnect();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ ok: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//ROTAS
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/escala", require("./routes/escala.routes"));
app.use("/api/holerite", require("./routes/holerite.routes"));
app.use("/api/ponto", require("./routes/ponto.routes"));
app.use("/api/tarefas", require("./routes/tarefa.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/ml", require("./routes/ml.routes")); 

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;

const createAdmin = async () => {
  try {
    const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (exists) {
      console.log("✅ Admin já existe:", exists.email);
      return;
    }

    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const admin = await User.create({
      nome: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      senha: hashed,
      role: "admin",
    });

    console.log("🚀 Admin criado com sucesso:", admin.email);
  } catch (err) {
    console.error("❌ Erro ao criar admin:", err.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Servidor na porta ${PORT}`);
  await createAdmin();
});

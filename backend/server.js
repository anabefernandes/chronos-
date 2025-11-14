require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dbConnect = require('./config/db');
const { swaggerUi, swaggerSpec } = require('./swagger');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
dbConnect();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
});

app.set('io', io);

io.on('connection', socket => {
  console.log('🟢 Usuário conectado via Socket:', socket.id);

  socket.on('join', userId => {
    socket.join(userId);
    console.log(`Usuário ${userId} entrou na sala ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Usuário desconectado:', socket.id);
  });
});

module.exports.io = io;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ ok: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//ROTAS
app.use('/auth', require('./routes/auth.routes'));
app.use('/escala', require('./routes/escala.routes'));
app.use('/holerite', require('./routes/holerite.routes'));
app.use('/ponto', require('./routes/ponto.routes'));
app.use('/tarefas', require('./routes/tarefa.routes'));
app.use('/user', require('./routes/user.routes'));
app.use('/ml', require('./routes/ml.routes'));
app.use('/notificacoes', require('./routes/notificacao.routes'));
app.use('/relatorio', require('./routes/relatorio.routes'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;

const createAdmin = async () => {
  try {
    const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (exists) {
      console.log('✅ Admin já existe:', exists.email);
      return;
    }

    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const admin = await User.create({
      nome: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      senha: hashed,
      role: 'admin',
      setor: 'Admin'
    });

    console.log('🚀 Admin criado com sucesso:', admin.email);
  } catch (err) {
    console.error('❌ Erro ao criar admin:', err.message);
  }
};

server.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  await createAdmin();
});

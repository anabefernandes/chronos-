const mongoose = require('mongoose');

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoBD conectado');
  } catch (err) {
    console.error('Erro ao conectar com o MongoDB: ', err.message);
    process.exit(1);
  }
};

module.exports = dbConnect;

// mail.js
require("dotenv").config();
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // senha de app
    }
  });

  const mailOptions = {
    from: `"CHRONOS" <${process.env.EMAIL_USER}>`, // tem que ser o mesmo e-mail
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso!');
  } catch (error) {
    console.log('Erro ao enviar e-mail:', error);
  }
};

module.exports = sendEmail;

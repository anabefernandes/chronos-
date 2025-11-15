// mail.js
const nodemailer = require('nodemailer');

// Função para enviar o e-mail com o token
const sendEmail = async (to, subject, text) => {
  // Criação do transporte de e-mail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Seu e-mail
      pass: process.env.EMAIL_PASS   // Sua senha do e-mail ou senha de aplicativo do Gmail
    }
  });

  // Configuração do e-mail
  const mailOptions = {
    from:'"CHRONOS" <AdmFórum@gmail.com>', // Seu e-mail
    to: to,                      // E-mail do destinatário
    subject: subject,            // Assunto do e-mail
    text: text                   // Corpo do e-mail
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso!');
  } catch (error) {
    console.log('Erro ao enviar e-mail:', error);
  }
};

module.exports = sendEmail;

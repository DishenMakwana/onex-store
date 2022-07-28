const nodemailer = require('nodemailer');

const mailHelper = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: 'dishen@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: '',
  };

  await transporter.sendMail(message);
};

module.exports = mailHelper;

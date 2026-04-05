const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using the configured transporter.
 * @param {Object} options - Email options (to, subject, html)
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Joya Amazónica - Sistema Hotelero" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('No se pudo enviar el correo electrónico');
  }
};

/**
 * Generate a basic HTML template for emails.
 * @param {String} title - Email title
 * @param {String} content - Main content of the email
 * @returns {String} HTML string
 */
const getHtmlTemplate = (title, contentHTML) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
        ${title}
      </h2>
      <div style="color: #34495e; line-height: 1.6; font-size: 16px;">
        ${contentHTML}
      </div>
      <p style="margin-top: 20px; font-size: 14px; color: #7f8c8d; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
        Este es un mensaje automático del Sistema Hotelero Joya Amazónica.<br>
        Por favor, no responda a este correo.
      </p>
    </div>
  `;
};

module.exports = { sendEmail, getHtmlTemplate };

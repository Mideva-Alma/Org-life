const nodemailer = require('nodemailer');

// Create transporter with Ethereal credentials
const createTransporter = () => {
  // For Ethereal - you'll get these from https://ethereal.email
  return nodemailer.createTransport({

    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.ETHEREAL_USER || 'germaine.blanda75@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'xs3wMm86qFTG4vaQFY'
    }
  });
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Org-Life Admin" <admin@orglife.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });
    
    // For Ethereal, log the preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, createTransporter };
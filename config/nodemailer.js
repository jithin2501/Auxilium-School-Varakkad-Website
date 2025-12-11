// config/nodemailer.js
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: true,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Brevo SMTP connection failed:", error.message);
  } else {
    console.log("✅ Brevo SMTP transporter is ready to send emails!");
  }
});
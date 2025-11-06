// config/nodemailer.js
import nodemailer from "nodemailer";
import sendGridTransport from "nodemailer-sendgrid-transport";

// ✅ Create transporter using SendGrid
export const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

// Optional: Check connection (you’ll see this in Render logs)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SendGrid connection failed:", error);
  } else {
    console.log("✅ SendGrid transporter is ready to send emails!");
  }
});

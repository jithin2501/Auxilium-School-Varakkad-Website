import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail SMTP failed:", error.message);
  } else {
    console.log("✅ Gmail SMTP ready!");
  }
});

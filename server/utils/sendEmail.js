const nodemailer = require("nodemailer");

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS ? "Loaded" : "Missing"
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.log("SMTP Error:", error);
  } else {
    console.log("✅ Gmail SMTP Connected");
  }
});

const sendEmail = async (email, otp) => {
  const mailOptions = {
    from: `"VivaPartner" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "VivaPartner Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2>VivaPartner Password Reset</h2>

        <p>Your OTP is:</p>

        <h1 style="color:#2563eb;">${otp}</h1>

        <p>This OTP is valid for <strong>10 minutes</strong>.</p>

        <p>Do not share this OTP with anyone.</p>

        <br>

        <strong>VivaPartner Team</strong>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
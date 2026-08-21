const nodemailer = require("nodemailer");

// ==========================================
// Check Email Environment Variables
// ==========================================

console.log("========================================");
console.log("Email Configuration");
console.log("EMAIL_USER:", process.env.EMAIL_USER || "Missing");
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS ? "Loaded" : "Missing"
);
console.log("========================================");

// ==========================================
// Create Gmail Transporter
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// Verify SMTP Connection
// ==========================================

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail SMTP Error:");
    console.error(error);
  } else {
    console.log("✅ Gmail SMTP Connected Successfully");
  }
});

// ==========================================
// Send OTP Email
// ==========================================

const sendEmail = async (email, otp) => {
  try {
    if (!email) {
      throw new Error("Recipient email is missing.");
    }

    if (!otp) {
      throw new Error("OTP is missing.");
    }

    console.log("========================================");
    console.log("Sending Password Reset Email");
    console.log("To:", email);
    console.log("OTP:", otp);
    console.log("========================================");

    const mailOptions = {
      from: `"VivaPartner" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: "VivaPartner Password Reset OTP",

      text: `Your VivaPartner password reset OTP is ${otp}. This OTP is valid for 10 minutes.`,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #ffffff;
          "
        >

          <h2 style="color: #0f172a;">
            VivaPartner Password Reset
          </h2>

          <p style="color: #475569; font-size: 16px;">
            We received a request to reset your VivaPartner password.
          </p>

          <p style="color: #475569; font-size: 16px;">
            Your One-Time Password (OTP) is:
          </p>

          <div
            style="
              margin: 25px 0;
              padding: 20px;
              text-align: center;
              background: #eff6ff;
              border-radius: 10px;
            "
          >
            <h1
              style="
                margin: 0;
                color: #2563eb;
                letter-spacing: 8px;
                font-size: 36px;
              "
            >
              ${otp}
            </h1>
          </div>

          <p style="color: #64748b;">
            This OTP is valid for
            <strong>10 minutes</strong>.
          </p>

          <p style="color: #64748b;">
            Do not share this OTP with anyone.
          </p>

          <hr
            style="
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 30px 0;
            "
          />

          <p style="color: #64748b;">
            Regards,<br />
            <strong>VivaPartner Team</strong>
          </p>

        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("========================================");
    console.log("✅ OTP EMAIL SENT");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("========================================");

    return info;
  } catch (error) {
    console.error("========================================");
    console.error("❌ SEND EMAIL ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("========================================");

    throw error;
  }
};

module.exports = sendEmail;
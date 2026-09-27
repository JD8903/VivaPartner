const nodemailer = require("nodemailer");

// ==========================================
// Lazy Transporter Generator
// ==========================================

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email credentials not configured. OTP sending will fail.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

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

    console.log("Sending Password Reset Email To:", email);

    const mailOptions = {
      from: `"VivaPartner" <${process.env.EMAIL_USER || "no-reply@vivapartner.com"}>`,
      to: email,
      subject: "VivaPartner Password Reset OTP",
      text: `Your VivaPartner password reset OTP is ${otp}. This OTP is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0f172a;">VivaPartner Password Reset</h2>
          <p style="color: #475569; font-size: 16px;">We received a request to reset your VivaPartner password.</p>
          <p style="color: #475569; font-size: 16px;">Your One-Time Password (OTP) is:</p>
          <div style="margin: 25px 0; padding: 20px; text-align: center; background: #eff6ff; border-radius: 10px;">
            <h1 style="margin: 0; color: #2563eb; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
          </div>
          <p style="color: #64748b;">This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #64748b;">Do not share this OTP with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #64748b;">Regards,<br /><strong>VivaPartner Team</strong></p>
        </div>
      `,
    };

    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ OTP EMAIL SENT:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ SEND EMAIL ERROR:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
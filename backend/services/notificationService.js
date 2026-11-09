const axios = require("axios");
const nodemailer = require("nodemailer");

/**
 * Format nomor telepon Indonesia ke standar internasional (628xxx)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let cleaned = phone.toString().replace(/[^0-9]/g, "");
  if (cleaned.startsWith("08")) {
    cleaned = "628" + cleaned.slice(2);
  } else if (cleaned.startsWith("8")) {
    cleaned = "628" + cleaned.slice(1);
  } else if (cleaned.startsWith("+62")) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Pengiriman Pesan WhatsApp.
 * Mendukung Fonnte / generic WhatsApp Gateway, atau fallback log console jika token belum diisi.
 */
const sendWhatsApp = async ({ to, message }) => {
  const target = formatPhoneNumber(to);
  if (!target) {
    return { success: false, reason: "Nomor WhatsApp kosong atau tidak valid" };
  }

  const fonnteToken = process.env.FONNTE_TOKEN;

  if (fonnteToken) {
    try {
      const response = await axios.post(
        "https://api.fonnte.com/send",
        {
          target,
          message,
        },
        {
          headers: {
            Authorization: fonnteToken,
          },
        }
      );
      console.log(`[WhatsApp Sent] ke ${target}: status ${response.data?.status}`);
      return { success: true, data: response.data };
    } catch (err) {
      console.error(`[WhatsApp Error] gagal kirim ke ${target}:`, err.response?.data || err.message);
      return { success: false, error: err.message };
    }
  } else {
    // Mode Simulasi / Log (jika belum mengonfigurasi FONNTE_TOKEN di .env)
    console.log(`\n--- [WHATSAPP NOTIFIKASI] ---`);
    console.log(`Penerima : ${target}`);
    console.log(`Pesan    :\n${message}`);
    console.log(`-------------------------------------\n`);
    return { success: true, simulated: true };
  }
};

/**
 * Pengiriman Email via Nodemailer (SMTP / Gmail).
 * Jika SMTP tidak di-set di .env, akan menjalankan fallback simulasi log console.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    return { success: false, reason: "Email penerima kosong" };
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from: `"${process.env.APP_NAME || "AbsensiKu"}" <${user}>`,
        to,
        subject,
        html,
      });

      console.log(`[Email Sent] ke ${to}: ${info.messageId}`);
      return { success: true, info };
    } catch (err) {
      console.error(`[Email Error] gagal kirim ke ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    // Mode Simulasi / Log
    console.log(`\n--- [EMAIL NOTIFIKASI] ---`);
    console.log(`Penerima : ${to}`);
    console.log(`Subjek   : ${subject}`);
    console.log(`-----------------------------------\n`);
    return { success: true, simulated: true };
  }
};

module.exports = {
  formatPhoneNumber,
  sendWhatsApp,
  sendEmail,
};

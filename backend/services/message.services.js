// backend/services/message.services.js
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send SMS
exports.sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log("SMS sent:", result.sid);
    return result;
  } catch (err) {
    console.error("❌ SMS error:", err.message);
    throw err;
  }
};

// Send WhatsApp message
exports.sendWhatsApp = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER, // sandbox number
      to: `whatsapp:${to}`, // user WhatsApp number with country code
    });
    console.log("WhatsApp sent:", result.sid);
    return result;
  } catch (err) {
    console.error("❌ WhatsApp error:", err.message);
    throw err;
  }
};

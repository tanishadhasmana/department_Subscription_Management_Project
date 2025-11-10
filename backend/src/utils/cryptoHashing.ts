import crypto from "crypto";

const algorithm = process.env.ENCRYPTION_ALGORITHM || "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY || "defaultsecretkeydefaultsecretkey!!", "utf8");

// 🔒 Encrypt
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

// 🔓 Decrypt (safe version)
export const decrypt = (text: string): string => {
  try {
    if (!text) return ""; // empty check

    // If it doesn't contain ':', assume it's plain text (old record)
    if (!text.includes(":")) return text;

    const [ivHex, encryptedHex] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");

    if (iv.length !== 16) {
      console.warn("⚠️ Invalid IV length, returning original text");
      return text; // prevent crash
    }

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err: any) {
    console.error("❌ Decryption failed:", err.message);
    return text; // return original text safely
  }
};

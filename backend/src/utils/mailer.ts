// src/utils/mailer.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Single transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Generic send mail function - used for all emails
export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// ✅ Interface for subscription expiry data
interface EmailData {
  subscriptionName: string;
  departmentName: string;
  price: number;
  currency: string;
  expiryDate: string;
  daysRemaining: number;
  url: string;
}

// // ✅ Function to generate HTML for expiry emails
// const generateExpiryEmailHTML = (data: EmailData): string => {
//   const { subscriptionName, departmentName, price, currency, expiryDate, daysRemaining } = data;

//   return `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Subscription Expiring Soon</title>
// </head>
// <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; margin: 0;">
//     <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
//         <!-- Header -->
//         <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; position: relative;">
//             <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;">⚠️</div>
//             <h1 style="color: white; font-size: 28px; margin-bottom: 10px; margin-top: 0;">Subscription Expiring Soon!</h1>
//             <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0;">Your department subscription requires attention</p>
//         </div>

//         <!-- Content -->
//         <div style="padding: 40px 30px;">
//             <!-- Timer Container -->
//             <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; box-shadow: 0 10px 30px rgba(245, 87, 108, 0.3);">
//                 <div style="color: white; font-size: 18px; margin-bottom: 20px; font-weight: 600;">Time Remaining Until Expiry</div>
//                 <div style="display: inline-block; background: white; border-radius: 10px; padding: 15px 25px;">
//                     <span style="font-size: 32px; font-weight: bold; color: #667eea; display: block;">${daysRemaining}</span>
//                     <span style="font-size: 12px; color: #666; text-transform: uppercase;">Days</span>
//                 </div>
//             </div>

//             <!-- Subscription Details -->
//             <div style="background: #f8f9ff; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #667eea;">
//                 <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
//                     <span style="color: #666; font-weight: 500;">Department:</span>
//                     <span style="color: #333; font-weight: 600;">${departmentName}</span>
//                 </div>
//                 <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
//                     <span style="color: #666; font-weight: 500;">Subscription Name:</span>
//                     <span style="color: #333; font-weight: 600;">${subscriptionName}</span>
//                 </div>
//                 <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
//                     <span style="color: #666; font-weight: 500;">Price:</span>
//                     <span style="color: #333; font-weight: 600;">${currency} ${price}</span>
//                 </div>
//                 <div style="display: flex; justify-content: space-between; padding: 12px 0;">
//                     <span style="color: #666; font-weight: 500;">Expiry Date:</span>
//                     <span style="color: #f5576c; font-weight: 600; font-size: 18px;">${expiryDate}</span>
//                 </div>
//             </div>

//             <!-- CTA Button -->
//             <div style="text-align: center; margin: 30px 0;">
//                 <a href="http://localhost:5173/subscription" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
//                     Renew Subscription Now
//                 </a>
//             </div>

//             <!-- Warning Box -->
//             <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px;">
//                 <strong style="color: #856404;">⚡ Important:</strong>
//                 <p style="color: #856404; margin-top: 5px; font-size: 14px; margin-bottom: 0;">
//                     To avoid service interruption, please renew your subscription before the expiry date. 
//                     Contact your department administrator or our support team for assistance.
//                 </p>
//             </div>
//         </div>

//         <!-- Footer -->
//         <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; line-height: 1.6;">
//             <p style="margin: 0 0 5px 0;"><strong>Department Subscription Management System</strong></p>
//             <p style="margin: 0 0 15px 0;">This is an automated reminder. Please do not reply to this email.</p>
//             <p style="margin: 15px 0 0 0; font-size: 12px;">© 2025 Evince Development. All rights reserved.</p>
//         </div>
//     </div>
// </body>
// </html>
//   `;
// };


const generateExpiryEmailHTML = (data: EmailData): string => {
  const { subscriptionName, departmentName, price, currency, expiryDate, daysRemaining, url } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Expiring Soon</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .icon-circle {
      width: 80px;
      height: 80px;
      background: #fff;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      line-height: 1;
      padding-top: 17px;
      padding-left: 32px;
    }
    .header h1 {
      color: #fff;
      font-size: 26px;
      margin: 0 0 8px;
    }
    .header p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .timer {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      margin-bottom: 35px;
      box-shadow: 0 10px 30px rgba(245, 87, 108, 0.3);
    }
    .timer-label {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .timer-box {
      display: inline-block;
      background: #fff;
      border-radius: 10px;
      padding: 15px 30px;
    }
    .timer-days {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      display: block;
    }
    .timer-text {
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
    }
    .details {
      background: #f8f9ff;
      border-radius: 12px;
      padding: 25px;
      border-left: 5px solid #667eea;
      margin-bottom: 25px;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
      flex-wrap: wrap;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #555;
      font-weight: 500;
      min-width: 150px;
    }
    .value {
      color: #222;
      font-weight: 600;
      text-align: right;
      flex-grow: 1;
      word-break: break-word;
    }
    .highlight {
      color: #f5576c;
      font-size: 18px;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .cta a {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 15px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      color: #856404;
      font-size: 14px;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer p {
      margin: 5px 0;
    }
    @media screen and (max-width: 480px) {
      .content {
        padding: 25px 20px;
      }
      .timer {
        padding: 20px;
      }
      .timer-box {
        padding: 12px 25px;
      }
      .timer-days {
        font-size: 28px;
      }
      .label {
        font-size: 14px;
        min-width: 120px;
      }
      .value {
        font-size: 14px;
      }
      .cta a {
        padding: 12px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="icon-circle">⚠️</div>
      <h1>Subscription Expiring Soon!</h1>
      <p>Your department subscription requires attention</p>
    </div>

    <div class="content">
      <div class="timer">
        <div class="timer-label">Time Remaining Until Expiry</div>
        <div class="timer-box">
          <span class="timer-days">${daysRemaining}</span>
          <span class="timer-text">Days</span>
        </div>
      </div>

      <div class="details">
        <div class="details-row">
          <span class="label">Department:</span>
          <span class="value">${departmentName}</span>
        </div>
        <div class="details-row">
          <span class="label">Subscription Name:</span>
          <span class="value">${subscriptionName}</span>
        </div>
        <div class="details-row">
          <span class="label">Price:</span>
          <span class="value">${price} ${currency}</span>
        </div>
        <div class="details-row">
          <span class="label">Expiry Date:</span>
          <span class="value highlight">${expiryDate}</span>
        </div>
      </div>

      <div class="cta">
      <a href="${url}" target="_blank">Renew Subscription Now</a>
    </div>

      <div class="warning">
        <strong>⚡ Important:</strong>
        <p>
          To avoid service interruption, please renew your subscription before the expiry date.
          Contact your department administrator or our support team for assistance.
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>Department Subscription Management System</strong></p>
      <p>This is an automated reminder. Please do not reply to this email.</p>
      <p style="font-size:12px;">© 2025 Evince Development. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};


// ✅ Specialized function for subscription expiry emails
export const sendExpiryEmail = async (data: EmailData) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not configured in .env file");
  }

  const subject = `⚠️ Subscription Expiring in ${data.daysRemaining} Day${data.daysRemaining > 1 ? 's' : ''} - ${data.subscriptionName}`;
  const html = generateExpiryEmailHTML(data);
  const text = `Your subscription "${data.subscriptionName}" for ${data.departmentName} is expiring in ${data.daysRemaining} days on ${data.expiryDate}. Price: ${data.currency} ${data.price}`;

  return await sendMail(adminEmail, subject, text, html);
};

// ✅ Test email connection
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
};

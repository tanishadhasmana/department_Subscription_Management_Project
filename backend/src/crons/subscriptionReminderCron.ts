// src/crons/subscriptionReminderCron.ts
import cron from "node-cron";
import db from "../connection";
import { sendExpiryEmail } from "../utils/mailer";

interface SubscriptionData {
  id: number;
  subsc_name: string;
  subsc_price: number;
  subsc_currency: string;
  renew_date: string;
  department_name: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const calculateDaysUntilExpiry = (renewDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(renewDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const checkAndSendReminders = async () => {
  try {
    console.log("🔍 Checking for subscriptions expiring soon...");

    // Get all active subscriptions with renew dates
    const subscriptions: SubscriptionData[] = await db("subscriptions as s")
      .leftJoin("departments as d", "s.department_id", "d.id")
      .select(
        "s.id",
        "s.subsc_name",
        "s.subsc_price",
        "s.subsc_currency",
        "s.renew_date",
        "d.deptName as department_name"
      )
      .where("s.subsc_status", "Active")
      .whereNotNull("s.renew_date")
      .whereNull("s.deleted_at");

    console.log(`📊 Found ${subscriptions.length} active subscription(s) to check`);

    const reminders = [7, 3, 1]; // Days before expiry to send reminders
    let emailsSent = 0;

    for (const subscription of subscriptions) {
      const daysUntilExpiry = calculateDaysUntilExpiry(subscription.renew_date);

      console.log(
        `📅 Subscription: ${subscription.subsc_name} | Days until expiry: ${daysUntilExpiry}`
      );

      // Check if we should send a reminder for this subscription
      if (reminders.includes(daysUntilExpiry)) {
        console.log(
          `📧 Sending ${daysUntilExpiry}-day reminder for: ${subscription.subsc_name}`
        );

        try {
          await sendExpiryEmail({
            subscriptionName: subscription.subsc_name,
            departmentName: subscription.department_name || "N/A",
            price: subscription.subsc_price,
            currency: subscription.subsc_currency,
            expiryDate: formatDate(subscription.renew_date),
            daysRemaining: daysUntilExpiry,
          });

          emailsSent++;
          console.log(`✅ Email sent successfully for: ${subscription.subsc_name}`);
        } catch (error: any) {
          console.error(
            `❌ Failed to send email for subscription ${subscription.id}:`,
            error.message
          );
        }
      }
    }

    console.log(`✅ Reminder check complete. ${emailsSent} email(s) sent.`);
    return { checked: subscriptions.length, sent: emailsSent };
  } catch (error: any) {
    console.error("❌ Error in subscription reminder cron:", error);
    throw error;
  }
};

// Schedule cron job to run daily at 9:00 AM
export const startSubscriptionReminderCron = () => {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running scheduled subscription reminder check...");
    await checkAndSendReminders();
  }, {

    timezone: "Asia/Kolkata", // Set your timezone
  });

  console.log("⏰ Subscription reminder cron job started (runs daily at 9:00 AM IST)");
  
  // Optional: Run immediately on startup for testing
  // Uncomment the line below to test on server start
  checkAndSendReminders();
};



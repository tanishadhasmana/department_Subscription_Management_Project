// backend/src/crons/subscriptionStatusUpdateCron.ts
import cron from "node-cron";
import db from "../connection";

interface SubscriptionRecord {
  id: number;
  subsc_name: string;
  renew_date: string | null;
  subsc_status: string;
}

const calculateStatus = (renewDate: string | null): "Active" | "Inactive" => {
  if (!renewDate) {
    return "Active"; // Lifetime subscriptions stay Active
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewal = new Date(renewDate);
  renewal.setHours(0, 0, 0, 0);

  // If renewal date is in the past → Inactive
  // If renewal date is today or in future → Active
  return renewal < today ? "Inactive" : "Active";
};

export const updateSubscriptionStatuses = async () => {
  try {
    console.log("🔄 [cron] Starting subscription status update...");

    // ✅ Fetch ALL non-deleted subscriptions
    const subscriptions: SubscriptionRecord[] = await db("subscriptions")
      .select("id", "subsc_name", "renew_date", "subsc_status")
      .whereNull("deleted_at");

    console.log(`📊 [cron] Found ${subscriptions.length} subscription(s) to check`);

    let activeCount = 0;
    let inactiveCount = 0;
    let updatedCount = 0;

    // ✅ Process each subscription
    for (const subscription of subscriptions) {
      const calculatedStatus = calculateStatus(subscription.renew_date);
      const currentStatus = subscription.subsc_status;

      // ✅ Only update if status has changed
      if (currentStatus.toLowerCase() !== calculatedStatus.toLowerCase()) {
        await db("subscriptions").where({ id: subscription.id }).update({
          subsc_status: calculatedStatus,
          updated_at: db.fn.now(),
        });

        console.log(
          `✅ [cron] Updated: ${subscription.subsc_name} | ${currentStatus} → ${calculatedStatus}`
        );
        updatedCount++;
      }

      // Count for logging
      if (calculatedStatus === "Active") {
        activeCount++;
      } else {
        inactiveCount++;
      }
    }

    console.log(`✅ [cron] Subscription status update complete!`);
    console.log(`   📈 Active: ${activeCount} | 📉 Inactive: ${inactiveCount}`);
    console.log(`   🔄 Updated: ${updatedCount}`);

    return {
      total: subscriptions.length,
      active: activeCount,
      inactive: inactiveCount,
      updated: updatedCount,
    };
  } catch (error: any) {
    console.error(
      "❌ [cron] Error in subscription status update:",
      error?.message ?? error
    );
    throw error;
  }
};

export const startSubscriptionStatusUpdateCron = () => {
  // ✅ Runs every 12 minutes (you can change to "*/15 * * * *" for 15 minutes)
  const CRON_EXPR = "*/12 * * * *"; // Every 12 minutes

  console.log(`⏰ [cron] Subscription status update cron configured: ${CRON_EXPR}`);

  const task = cron.schedule(CRON_EXPR, async () => {
    console.log("[cron] ⏰ Running scheduled subscription status update...");
    await updateSubscriptionStatuses();
  });

  // ✅ Optional: Add manual run helper (for testing)
  (task as any).runNow = async () => {
    console.log("[cron] 🚀 Running subscription status update (manual run)...");
    try {
      await updateSubscriptionStatuses();
      console.log("[cron] ✅ Manual subscription status update completed.");
    } catch (err: any) {
      console.error(
        "[cron] ❌ Manual subscription status update failed:",
        err?.message ?? err
      );
    }
  };

  task.start();
  return task;
};
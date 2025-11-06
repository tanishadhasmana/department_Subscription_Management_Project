import { useEffect, useState } from "react";
import api from "../../lib/api";

interface Subscription {
  id: number;
  subsc_name: string;
  subsc_type: string;
  subsc_price: string;
  subsc_currency: string;
  subsc_status: string;
  department: string;
}

const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await api.get("/subscriptions");
        setSubscriptions(res.data.data);
      } catch (err) {
        console.error("Error fetching subscriptions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  if (loading) return <p>Loading subscriptions...</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Subscriptions</h2>
      <div className="overflow-x-auto bg-white rounded-2xl shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Currency</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{sub.subsc_name}</td>
                <td className="p-3">{sub.subsc_type}</td>
                <td className="p-3">{sub.subsc_price}</td>
                <td className="p-3">{sub.subsc_currency}</td>
                <td className="p-3">{sub.department || "-"}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      sub.subsc_status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {sub.subsc_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionList;

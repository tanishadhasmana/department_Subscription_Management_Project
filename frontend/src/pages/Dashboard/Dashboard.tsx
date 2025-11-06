import { useEffect, useState } from "react";
import api from "../../lib/api";

interface DeptData {
  deptName: string;
  subscriptionCount: number;
}

const Dashboard = () => {
  const [data, setData] = useState<DeptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard/department-subscriptions");
        setData(res.data.data);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Department-wise Subscriptions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-2xl p-6 text-center hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-medium text-gray-700">{item.deptName}</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{item.subscriptionCount}</p>
            <p className="text-gray-500 text-sm mt-1">Active Subscriptions</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

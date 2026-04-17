import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function OutreachDashboard() {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchLeads();
  }, [filter]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/cold-email/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let url = '/api/cold-email/leads?limit=100';
      if (filter !== 'all') {
        url += `&sequence_day=${filter}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setLeads(data.data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const sequenceDays = [
    { day: 0, label: 'Day 0: Welcome', color: 'bg-blue-100' },
    { day: 3, label: 'Day 3: Costs', color: 'bg-green-100' },
    { day: 7, label: 'Day 7: Value', color: 'bg-yellow-100' },
    { day: 14, label: 'Day 14: Pitch', color: 'bg-orange-100' },
    { day: 21, label: 'Day 21: Final', color: 'bg-red-100' },
  ];

  const getResponseRate = () => {
    if (!stats || stats.total_leads === 0) return 0;
    return ((stats.responded / stats.total_leads) * 100).toFixed(1);
  };

  const getConversionMetrics = () => {
    if (!stats) return { rate: '0%', count: 0 };
    return {
      rate: stats.total_leads > 0 ? ((stats.responded / stats.total_leads) * 100).toFixed(1) : '0',
      count: stats.responded || 0,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Outreach Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">Track your email sequence campaigns and engagement</p>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <MetricCard
            title="Total Leads"
            value={stats?.total_leads || 0}
            icon="👥"
            color="blue"
          />
          <MetricCard
            title="Response Rate"
            value={`${getResponseRate()}%`}
            icon="💬"
            color="green"
          />
          <MetricCard
            title="Unsubscribed"
            value={stats?.unsubscribed || 0}
            icon="❌"
            color="red"
          />
          <MetricCard
            title="Active in Sequence"
            value={(stats?.day_0_pending || 0) + (stats?.day_3_pending || 0) + (stats?.day_7_pending || 0) + (stats?.day_14_pending || 0)}
            icon="🚀"
            color="purple"
          />
        </div>

        {/* Sequence Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sequence Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {sequenceDays.map((seq, idx) => (
              <button
                key={seq.day}
                onClick={() => setFilter(seq.day === 0 && filter === 'all' ? 'all' : seq.day)}
                className={`p-4 rounded-lg text-center transition-all cursor-pointer ${
                  filter === seq.day
                    ? 'ring-2 ring-blue-500 scale-105'
                    : seq.day === 0 && filter === 'all'
                      ? 'ring-2 ring-blue-500 scale-105'
                      : ''
                } ${seq.color}`}
              >
                <div className="font-semibold text-gray-900">{seq.label}</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {seq.day === 0 ? stats?.day_0_pending : seq.day === 3 ? stats?.day_3_pending : seq.day === 7 ? stats?.day_7_pending : seq.day === 14 ? stats?.day_14_pending : stats?.day_21_completed || 0}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Cold Email Leads</h2>
            <p className="text-gray-600 mt-2">
              Showing {leads.length} leads {filter !== 'all' ? `at Day ${filter}` : 'in sequence'}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No leads found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Sequence Day
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Last Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead, idx) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.company_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.title}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            lead.sequence_day === 0
                              ? 'bg-blue-100 text-blue-800'
                              : lead.sequence_day === 3
                                ? 'bg-green-100 text-green-800'
                                : lead.sequence_day === 7
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : lead.sequence_day === 14
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                          }`}
                        >
                          Day {lead.sequence_day}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lead.response_received_at ? (
                          <span className="text-green-600 font-medium">✓ Responded</span>
                        ) : lead.unsubscribed_at ? (
                          <span className="text-red-600 font-medium">Unsubscribed</span>
                        ) : (
                          <span className="text-gray-600">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.last_email_sent_at
                          ? new Date(lead.last_email_sent_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Campaign Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <InsightCard
            title="Email Delivery"
            metric={`${stats?.total_leads || 0} leads`}
            subtitle="Total leads in active sequence"
            icon="📬"
          />
          <InsightCard
            title="Response Funnel"
            metric={`${getConversionMetrics().count} responses`}
            subtitle={`${getConversionMetrics().rate}% response rate`}
            icon="📈"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    red: 'bg-red-50 text-red-900',
    purple: 'bg-purple-50 text-purple-900',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`rounded-lg p-6 ${colors[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </motion.div>
  );
}

function InsightCard({ title, metric, subtitle, icon }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg p-6 shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{metric}</p>
      <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
    </motion.div>
  );
}

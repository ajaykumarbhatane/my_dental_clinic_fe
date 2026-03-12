import { useState, useEffect } from 'react';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';

const Dashboard = () => {
  const [stats, setStats] = useState([
    {
      title: 'Total Patients',
      value: '0',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Treatments',
      value: '0',
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      title: 'Upcoming Visits',
      value: '0',
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Treatments',
      value: '0',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ]);

  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data
      const [patientsRes, treatmentsRes, visitsRes] = await Promise.all([
        patientApi.getAll(),
        treatmentApi.getAll(),
        visitsApi.getAll(),
      ]);

      const patients = patientsRes.data || [];
      const treatments = treatmentsRes.data || [];
      const visits = visitsRes.data || [];

      // Calculate statistics
      const activeTreatments = treatments.filter(t => 
        ['scheduled', 'ongoing'].includes(t.status)
      ).length;

      const upcomingVisitsData = visits
        .filter(v => v.next_visit_date && new Date(v.next_visit_date) >= new Date())
        .sort((a, b) => new Date(a.next_visit_date) - new Date(b.next_visit_date))
        .slice(0, 10);

      // Update stats
      setStats([
        {
          title: 'Total Patients',
          value: patients.length.toString(),
          icon: Users,
          color: 'bg-blue-500',
        },
        {
          title: 'Active Treatments',
          value: activeTreatments.toString(),
          icon: UserCheck,
          color: 'bg-green-500',
        },
        {
          title: 'Upcoming Visits',
          value: upcomingVisitsData.length.toString(),
          icon: Calendar,
          color: 'bg-yellow-500',
        },
        {
          title: 'Total Treatments',
          value: treatments.length.toString(),
          icon: TrendingUp,
          color: 'bg-purple-500',
        },
      ]);

      setUpcomingVisits(upcomingVisitsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group bg-white rounded-xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">{stat.title}</p>
                  <div className="mt-3">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className={`${stat.color} rounded-xl p-3 shadow-md group-hover:shadow-lg transition-shadow`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Patients Month-wise</h3>
            <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Monthly</div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-300 mb-2">📊</div>
              <p className="text-gray-500 font-medium">Chart Placeholder</p>
              <p className="text-sm text-gray-400">Patients over time</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Treatment Distribution</h3>
            <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Analytics</div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-300 mb-2">📈</div>
              <p className="text-gray-500 font-medium">Chart Placeholder</p>
              <p className="text-sm text-gray-400">Treatment types distribution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Visits */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Upcoming Patient Visits</h3>
            <p className="text-sm text-gray-500 mt-1">Next appointments scheduled</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            📅
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading visits...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="text-2xl">⚠️</div>
            <p className="text-red-700">{error}</p>
          </div>
        ) : upcomingVisits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-5xl mb-4">🗓️</div>
            <p className="text-gray-500 font-medium">No upcoming visits</p>
            <p className="text-sm text-gray-400 mt-2">All appointments are up to date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Treatment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Next Visit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingVisits.map((visit, idx) => (
                  <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {visit.patient_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {visit.treatment_name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {new Date(visit.next_visit_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatAmount(visit.patient_payment_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
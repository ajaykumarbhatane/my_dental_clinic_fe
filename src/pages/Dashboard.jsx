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
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patients Month-wise</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart Placeholder - Patients over time
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Type Distribution</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart Placeholder - Treatment types pie chart
          </div>
        </div>
      </div>

      {/* Upcoming Visits */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Patient Visits</h3>
        {loading ? (
          <div className="flex justify-center items-center h-64">Loading...</div>
        ) : error ? (
          <div className="text-red-600 p-4">{error}</div>
        ) : upcomingVisits.length === 0 ? (
          <div className="text-center text-gray-500 p-4">No upcoming visits</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treatment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Visit Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {visit.patient_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {visit.treatment_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(visit.next_visit_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
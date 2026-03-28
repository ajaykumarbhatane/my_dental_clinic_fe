import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { clinicApi } from '../api/clinicApi';
import { formatDate, parseDateString } from '../utils/dateUtils';

// chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// register required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

  const navigate = useNavigate();

  // chart data states
  const [patientChartData, setPatientChartData] = useState(null); // bar chart data (patients per clinic)
  const [treatmentChartData, setTreatmentChartData] = useState(null);

  // helper utilities
  // helper that groups patients by clinic name
  const buildPatientChart = (patients, clinics = []) => {
    // create quick id→name map from clinics list
    const clinicNameMap = clinics.reduce((map, c) => {
      if (c.id) map[c.id] = c.name || `Clinic ${c.id}`;
      return map;
    }, {});

    const counts = {};
    patients.forEach((p) => {
      const clinicId = p.clinic || (p.clinic_id ? p.clinic_id : null);
      const name =
        (clinicId && clinicNameMap[clinicId]) ||
        p.clinic?.name ||
        'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Patients',
          data: Object.values(counts),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
        },
      ],
    };
  };

  const buildTreatmentChart = (treatments) => {
    const counts = {};
    treatments.forEach((t) => {
      // serializer provides type_of_treatment_name for convenience,
      // fall back to nested object if present
      const name = t.type_of_treatment_name || t.type_of_treatment?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
          ],
        },
      ],
    };
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data (add clinics for patient chart labels)
      const [patientsRes, treatmentsRes, visitsRes, clinicsRes] = await Promise.all([
        patientApi.getAll(),
        treatmentApi.getAll(),
        visitsApi.getAll(),
        clinicApi.getAll(),
      ]);

      const patients = patientsRes.data || [];
      const treatments = treatmentsRes.data || [];
      const visits = visitsRes.data || [];
      const clinics = (clinicsRes && clinicsRes.data) || [];

      // Calculate statistics
      const activeTreatments = treatments.filter(t => 
        ['scheduled', 'ongoing'].includes(t.status)
      ).length;

      const upcomingVisitsData = visits
        .filter(v => {
          const visitDate = parseDateString(v.next_visit_date);
          const today = new Date();
          today.setHours(0,0,0,0);
          return visitDate && visitDate >= today;
        })
        .sort((a, b) => {
          const dateA = parseDateString(a.next_visit_date);
          const dateB = parseDateString(b.next_visit_date);
          return (dateA ? dateA.getTime() : 0) - (dateB ? dateB.getTime() : 0);
        })
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

      // build charts
      setPatientChartData(buildPatientChart(patients, clinics));
      setTreatmentChartData(buildTreatmentChart(treatments));
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
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg p-4 sm:p-6 transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors truncate">{stat.title}</p>
                  <div className="mt-2 sm:mt-3">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className={`${stat.color} rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0`}>
                  <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
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
            <h3 className="text-lg font-bold text-gray-900">Patients per Clinic</h3>
            <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Current</div>
          </div>
          <div className="h-64">
            {patientChartData ? (
              <Bar
                data={patientChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading chart...
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Treatment Distribution</h3>
            <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Analytics</div>
          </div>
          <div className="h-64">
            {treatmentChartData ? (
              <Doughnut
                data={treatmentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right' } },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading chart...
              </div>
            )}
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
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Visit Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Next Visit Date
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingVisits.map((visit, idx) => (
                  <tr
                    key={visit.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(visit.treatment || visit.treatment_id ? `/treatments/${visit.treatment || visit.treatment_id}` : '#')}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {visit.patient_full_name || `${visit.patient_name || ''} ${visit.patient_last_name || ''}`.trim() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {visit.treatment_name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {visit.doctor_name || visit.doctor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {formatDate(visit.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {formatDate(visit.next_visit_date)}
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
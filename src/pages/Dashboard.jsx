import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';import Pagination from '../components/Pagination';
import { Users, UserCheck, Calendar, TrendingUp, Phone } from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
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
import { Doughnut, Line } from 'react-chartjs-2';

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
  const [upcomingPage, setUpcomingPage] = useState(1);
  const upcomingPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // chart data states
  const today = new Date();
  const [visitChartData, setVisitChartData] = useState(null); // line chart data (visits per month)
  const [treatmentChartData, setTreatmentChartData] = useState(null);
  const [visitChartLabels, setVisitChartLabels] = useState([]);
  const [visitChartSeries, setVisitChartSeries] = useState({ all: [] });
  const [selectedTreatment, setSelectedTreatment] = useState('all');
  const [selectedInterval, setSelectedInterval] = useState('daily');
  const [treatmentFilterOptions, setTreatmentFilterOptions] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateError, setDateError] = useState('');

  const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const monthValue = String(date.getMonth() + 1).padStart(2, '0');
    const dayValue = String(date.getDate()).padStart(2, '0');
    return `${year}-${monthValue}-${dayValue}`;
  };

  const todayString = toDateInputValue(today);
  const initialStartDate = toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
  const initialEndDate = todayString;

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [draftStartDate, setDraftStartDate] = useState(initialStartDate);
  const [draftEndDate, setDraftEndDate] = useState(initialEndDate);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const chartKey = `${selectedTreatment}-${selectedInterval}-${startDate}-${endDate}`;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const buildMonthGrid = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startIndex = ((firstDayOfMonth.getDay() + 6) % 7);
    const totalCells = Math.max(35, startIndex + daysInMonth);
    const cells = [];

    for (let i = 0; i < totalCells; i += 1) {
      const dayNumber = i - startIndex + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        cells.push(null);
      } else {
        cells.push(new Date(year, month, dayNumber));
      }
    }
    return cells;
  };

  const formatDay = (date) => {
    if (!date) return '';
    return toDateInputValue(date);
  };

  const isInDraftRange = (dateString) => {
    if (!draftStartDate || !draftEndDate) return false;
    return dateString >= draftStartDate && dateString <= draftEndDate;
  };

  const handlePickerDayClick = (dayDate) => {
    if (!dayDate) return;

    const dateString = formatDay(dayDate);
    if (dateString > todayString) return;
    const isSingleSelection = draftStartDate === draftEndDate;

    if (!draftStartDate || isSingleSelection) {
      if (!draftStartDate) {
        setDraftStartDate(dateString);
        setDraftEndDate(dateString);
        return;
      }
      if (dateString < draftStartDate) {
        setDraftStartDate(dateString);
        setDraftEndDate(draftStartDate);
        return;
      }
      setDraftStartDate(draftStartDate);
      setDraftEndDate(dateString);
      return;
    }

    if (dateString < draftStartDate) {
      setDraftEndDate(draftStartDate);
      setDraftStartDate(dateString);
      return;
    }

    if (dateString > draftEndDate) {
      setDraftEndDate(dateString);
      return;
    }

    setDraftStartDate(dateString);
    setDraftEndDate(dateString);
  };

  const previousPickerMonth = () => {
    const nextMonth = pickerMonth - 1;
    if (nextMonth < 0) {
      setPickerMonth(11);
      setPickerYear(pickerYear - 1);
    } else {
      setPickerMonth(nextMonth);
    }
  };

  const nextPickerMonth = () => {
    const nextMonth = pickerMonth + 1;
    if (nextMonth > 11) {
      setPickerMonth(0);
      setPickerYear(pickerYear + 1);
    } else {
      setPickerMonth(nextMonth);
    }
  };

  useEffect(() => {
    const valid = !startDate || !endDate || startDate <= endDate;
    if (!valid) {
      setDateError('Start date must be before end date.');
      return;
    }
    setDateError('');
    fetchDashboardData();
  }, [selectedTreatment, selectedInterval, startDate, endDate]);

  useEffect(() => {
    if (showDatePicker) {
      setDraftStartDate(startDate);
      setDraftEndDate(endDate);
    }
  }, [showDatePicker, startDate, endDate]);

  const fetchDashboardData = async () => {
      if (dateError) return;
      try {
        setLoading(true);
        setError(null);

        const params = {
          treatment: selectedTreatment,
          interval: selectedInterval,
          start_date: startDate,
          end_date: endDate,
        };

        const response = await dashboardApi.get(params);
        const data = response.data || {};
        const summary = data.summary || {};

        const totalPatients = summary.total_patients ?? 0;
        const totalVisits = summary.total_visits ?? 0;
        const activeTreatments = summary.active_treatments ?? 0;
        const totalTreatments = summary.total_treatments ?? 0;

        const options = [...new Set(['all', ...(summary.treatment_filter_options || [])])];
        if (selectedTreatment !== 'all' && !options.includes(selectedTreatment)) {
          options.push(selectedTreatment);
        }
        setTreatmentFilterOptions(options);
        if (!options.includes(selectedTreatment)) {
          setSelectedTreatment('all');
        }

        setStats([
          {
            title: 'Total Patients',
            value: totalPatients.toString(),
            icon: Users,
            color: 'bg-blue-500',
          },
          {
            title: 'Total Visits',
            value: totalVisits.toString(),
            icon: Calendar,
            color: 'bg-green-500',
          },
          {
            title: 'Active Treatments',
            value: activeTreatments.toString(),
            icon: UserCheck,
            color: 'bg-yellow-500',
          },
          {
            title: 'Total Treatments',
            value: totalTreatments.toString(),
            icon: TrendingUp,
            color: 'bg-purple-500',
          },
        ]);

        setUpcomingVisits(summary.upcoming_visits || []);
        setVisitChartLabels(summary.visit_chart?.labels || []);
        setVisitChartSeries(summary.visit_chart?.series || {});
        setVisitChartData({
          labels: summary.visit_chart?.labels || [],
          datasets: [
            {
              label: selectedTreatment === 'all' ? 'All Visits' : `${selectedTreatment} Visits`,
              data: summary.visit_chart?.series?.[selectedTreatment] || summary.visit_chart?.series?.all || [],
              fill: false,
              backgroundColor: 'rgba(59, 130, 246, 0.75)',
              borderColor: 'rgba(37, 99, 235, 1)',
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        });
        setTreatmentChartData({
          labels: summary.treatment_chart?.labels || [],
          datasets: [
            {
              data: summary.treatment_chart?.data || [],
              backgroundColor: [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
              ],
            },
          ],
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
  };

  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingVisits.length / upcomingPerPage));
  const paginatedUpcomingVisits = upcomingVisits.slice(
    (upcomingPage - 1) * upcomingPerPage,
    upcomingPage * upcomingPerPage
  );

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
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Patient Visits Trend</h3>
              <p className="text-sm text-gray-500">Filter by treatment and date range to compare visit trends.</p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex items-center gap-2">
                <label htmlFor="visitFilter" className="text-sm font-medium text-gray-700">Treatment:</label>
                <select
                  id="visitFilter"
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  value={selectedTreatment}
                  onChange={(e) => setSelectedTreatment(e.target.value)}
                >
                  {treatmentFilterOptions.map((option) => (
                    <option key={option} value={option}>{option === 'all' ? 'All Treatments' : option}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Interval:</label>
                <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 overflow-hidden">
                  {['daily', 'weekly', 'monthly'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedInterval(option)}
                      className={`px-3 py-1 text-sm font-medium transition ${selectedInterval === option ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Date range trend
                </button>
              </div>
              <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                {formatDate(startDate)} - {formatDate(endDate)}
              </div>
            </div>
          </div>
          {dateError && (
            <div className="mb-4 text-sm text-red-600">{dateError}</div>
          )}
          {showDatePicker && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
              onClick={() => setShowDatePicker(false)}
            >
              <div
                className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5 max-h-[calc(100vh-4rem)] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Select Date Range</p>
                    <h2 className="text-xl font-semibold text-slate-900">Date range trend</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-center gap-4 mb-5">
                  <button
                    type="button"
                    onClick={previousPickerMonth}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 hover:bg-slate-100"
                  >
                    ←
                  </button>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    <span>{monthNames[pickerMonth]}</span>
                    <span>{pickerYear}</span>
                  </div>
                  <button
                    type="button"
                    onClick={nextPickerMonth}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 hover:bg-slate-100"
                  >
                    →
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
                  {['M','T','W','T','F','S','S'].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {buildMonthGrid(pickerYear, pickerMonth).map((dateValue, index) => {
                    const dateString = dateValue ? formatDay(dateValue) : '';
                    const isSelected = dateValue && (dateString === draftStartDate || dateString === draftEndDate);
                    const isRangeSelected = dateValue && draftStartDate && draftEndDate && dateString >= draftStartDate && dateString <= draftEndDate;
                    const isRangeStart = dateValue && dateString === draftStartDate;
                    const isRangeEnd = dateValue && dateString === draftEndDate;
                    const rangeClass = isRangeSelected ? 'bg-orange-100 text-slate-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                    const selectedClass = isSelected ? 'bg-orange-500 text-white shadow-lg' : rangeClass;
                    const roundedClass = isSelected
                      ? 'rounded-full'
                      : isRangeStart && !isRangeEnd
                      ? 'rounded-l-full'
                      : isRangeEnd && !isRangeStart
                      ? 'rounded-r-full'
                      : isRangeSelected
                      ? 'rounded-none'
                      : 'rounded-2xl';
                    return (
                      <button
                        key={`${pickerYear}-${pickerMonth}-${index}`}
                        type="button"
                        disabled={!dateValue || (dateValue && formatDay(dateValue) > todayString)}
                        onClick={() => dateValue && handlePickerDayClick(dateValue)}
                        className={`h-10 text-sm transition ${!dateValue ? 'cursor-default bg-transparent' : formatDay(dateValue) > todayString ? 'cursor-not-allowed opacity-40 bg-slate-100 text-slate-400' : `cursor-pointer ${selectedClass} ${roundedClass}`}`}
                      >
                        {dateValue ? dateValue.getDate() : ''}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Selected range</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(draftStartDate)} – {formatDate(draftEndDate)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate(draftStartDate);
                        setEndDate(draftEndDate);
                        setPickerMonth(new Date(draftStartDate).getMonth());
                        setPickerYear(new Date(draftStartDate).getFullYear());
                        setShowDatePicker(false);
                      }}
                      className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="h-64">
            {visitChartData ? (
              <Line
                key={chartKey}
                data={visitChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed.y;
                          const label = context.label;
                          return `${label}: ${value} visit${value === 1 ? '' : 's'}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: '#374151', font: { size: 12 } },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        color: '#374151',
                        font: { size: 12 },
                      },
                    },
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
                key={chartKey}
                data={treatmentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        generateLabels: function(chart) {
                          const data = chart.data;
                          if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                              const value = data.datasets[0].data[i];
                              return {
                                text: `${label} (${value})`, // 🔥 ADD COUNT HERE
                                fillStyle: data.datasets[0].backgroundColor[i],
                                strokeStyle: data.datasets[0].backgroundColor[i],
                                index: i,
                              };
                            });
                          }
                          return [];
                        }
                      }
                    }
                  }
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
          <>
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
                    Mobile
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Next Visit Date
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUpcomingVisits.map((visit, idx) => (
                  <tr
                    key={visit.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(visit.treatment || visit.treatment_id ? `treatments/${visit.treatment || visit.treatment_id}` : '#')}
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
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {formatDate(visit.created_at)}
                    </td> */}
                    
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {visit.patient_mobile && (
                          <a
                            href={`tel:${visit.patient_mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <span className="text-gray-600">
                          {visit.patient_mobile || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {formatDate(visit.next_visit_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {upcomingTotalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={upcomingPage}
                totalPages={upcomingTotalPages}
                onPageChange={setUpcomingPage}
                itemCountText={`Showing ${((upcomingPage - 1) * upcomingPerPage) + 1} to ${Math.min(upcomingPage * upcomingPerPage, upcomingVisits.length)} of ${upcomingVisits.length} upcoming visits`}
              />
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
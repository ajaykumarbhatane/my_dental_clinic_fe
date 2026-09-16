import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import AnalyticsFilters from '../components/AnalyticsFilters';
import PatientVisitsTrend from '../components/PatientVisitsTrend';
import RevenueTrend from '../components/RevenueTrend';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Phone,
  Stethoscope,
  Sparkles,
  DollarSign,
  UserPlus,
  FileText,
  Pill,
  RefreshCw,
  Clock,
  ArrowRight,
  Filter,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { patientApi } from '../api/patientApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { useNotification } from '../context/NotificationContext';
import { formatDate, toISODate, parseDateString } from '../utils/dateUtils';
import { useTreatmentStatusChoices, getTreatmentStatusLabel } from '../utils/treatmentStatusUtils';
import LockedFeatureCard from '../components/common/LockedFeatureCard';

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
import { Doughnut } from 'react-chartjs-2';

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
  const navigate = useNavigate();
  const { showError } = useNotification();

  // Active Dashboard Tab State (Default: Today's Overview)
  const [activeDashboardTab, setActiveDashboardTab] = useState('today');

  // Date helper functions
  const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const monthValue = String(date.getMonth() + 1).padStart(2, '0');
    const dayValue = String(date.getDate()).padStart(2, '0');
    return `${year}-${monthValue}-${dayValue}`;
  };

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return 'Today';
    const parsed = parseDateString(timestamp);
    if (!parsed) return 'Today';
    if (typeof timestamp === 'string' && (timestamp.includes('T') || timestamp.includes(':'))) {
      return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return formatDate(parsed);
  };

  const today = new Date();
  const todayString = toDateInputValue(today);
  const initialMonthStartDate = toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
  const initialEndDate = todayString;
  const [initialVisitStartDate, initialVisitEndDate] = (() => {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return [toDateInputValue(start), toDateInputValue(end)];
  })();

  // ==========================================
  // TAB 1: CLINIC REVENUE STATES (PRESERVED)
  // ==========================================
  const [stats, setStats] = useState([
    { title: 'Total Patients', value: '0', icon: Users, color: 'bg-blue-500' },
    { title: 'Total Visits', value: '0', icon: Calendar, color: 'bg-green-500' },
    { title: 'Active Treatments', value: '0', icon: UserCheck, color: 'bg-yellow-500' },
    { title: 'Total Treatments', value: '0', icon: TrendingUp, color: 'bg-purple-500' },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscriptionLocked, setIsSubscriptionLocked] = useState(false);

  const [visitChartData, setVisitChartData] = useState([]);
  const [treatmentChartData, setTreatmentChartData] = useState(null);
  const [treatmentOptions, setTreatmentOptions] = useState(['all']);
  const [selectedTreatment, setSelectedTreatment] = useState('all');
  const [period, setPeriod] = useState('last_7_days');
  const [group, setGroup] = useState('daily');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateError, setDateError] = useState('');
  const [startDate, setStartDate] = useState(initialVisitStartDate);
  const [endDate, setEndDate] = useState(initialVisitEndDate);
  const [draftStartDate, setDraftStartDate] = useState(initialVisitStartDate);
  const [draftEndDate, setDraftEndDate] = useState(initialVisitEndDate);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState({
    today_revenue: 0,
    total_revenue: 0,
    average_revenue: 0,
    highest_revenue: 0,
    previous_total_revenue: 0,
    previous_average_revenue: 0,
    previous_highest_revenue: 0,
  });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState(null);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const chartKey = `${selectedTreatment}-${group}-${startDate}-${endDate}`;

  const { choices: treatmentStatusChoices } = useTreatmentStatusChoices();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ==========================================
  // TAB 2: TODAY'S OVERVIEW STATES & PAGINATION
  // ==========================================
  const TODAY_PER_PAGE = 5;
  const [todayActivities, setTodayActivities] = useState([]);
  const [allRecentActivities, setAllRecentActivities] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState(null);
  const [todayFilter, setTodayFilter] = useState('all');
  const [showRecentIfEmpty, setShowRecentIfEmpty] = useState(true);
  const [todayCurrentPage, setTodayCurrentPage] = useState(1);

  // ==========================================
  // TAB 3: UPCOMING VISITS STATES & PAGINATION
  // ==========================================
  const UPCOMING_PER_PAGE = 5;
  const [upcomingRange, setUpcomingRange] = useState('next_5_days');
  const [upcomingVisitsList, setUpcomingVisitsList] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState(null);
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState(1);

  // Reset pagination on filter or data changes
  useEffect(() => {
    setTodayCurrentPage(1);
  }, [todayFilter, todayActivities, allRecentActivities]);

  useEffect(() => {
    setUpcomingCurrentPage(1);
  }, [upcomingRange, upcomingVisitsList]);

  // Date range picker for upcoming custom range
  const [showUpcomingCustomPicker, setShowUpcomingCustomPicker] = useState(false);
  const [customUpcomingStart, setCustomUpcomingStart] = useState(todayString);
  const [customUpcomingEnd, setCustomUpcomingEnd] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 5);
    return toDateInputValue(d);
  });

  // Date picker grid helper
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

  const getLast7DaysRange = () => {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return [toDateInputValue(start), toDateInputValue(end)];
  };

  const getCurrentMonthRange = () => [initialMonthStartDate, initialEndDate];
  const getYearToDateRange = () => [toDateInputValue(new Date(today.getFullYear(), 0, 1)), initialEndDate];

  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value === 'last_7_days') {
      const [start, end] = getLast7DaysRange();
      setStartDate(start);
      setEndDate(end);
      setShowDatePicker(false);
      return;
    }
    if (value === 'current_month') {
      const [start, end] = getCurrentMonthRange();
      setStartDate(start);
      setEndDate(end);
      setShowDatePicker(false);
      return;
    }
    if (value === 'year_to_date') {
      const [start, end] = getYearToDateRange();
      setStartDate(start);
      setEndDate(end);
      setShowDatePicker(false);
      return;
    }
    if (value === 'custom_date_range') {
      setDraftStartDate(startDate);
      setDraftEndDate(endDate);
      setShowDatePicker(true);
    }
  };

  // Data fetching effects
  useEffect(() => {
    const valid = !startDate || !endDate || startDate <= endDate;
    if (!valid) {
      setDateError('Start date must be before end date.');
      return;
    }
    setDateError('');
    fetchDashboardData();
  }, [selectedTreatment, group, startDate, endDate, period]);

  useEffect(() => {
    const valid = !startDate || !endDate || startDate <= endDate;
    if (!valid) {
      setRevenueError('Start date must be before end date.');
      return;
    }

    if (startDate > todayString || endDate > todayString) {
      setRevenueError('Future dates are not allowed.');
      return;
    }

    setRevenueError(null);
    fetchRevenueTrend();
  }, [selectedTreatment, group, startDate, endDate, period]);

  // Fetch Today's Overview activity when tab is active
  useEffect(() => {
    if (activeDashboardTab === 'today') {
      fetchTodayOverviewData();
    }
  }, [activeDashboardTab]);

  // Fetch Upcoming Visits when range or tab changes
  useEffect(() => {
    if (activeDashboardTab === 'upcoming') {
      fetchUpcomingVisitsData();
    }
  }, [activeDashboardTab, upcomingRange, customUpcomingStart, customUpcomingEnd]);

  // 1. Fetch Revenue & Summary Dashboard Data (Preserved)
  const fetchDashboardData = async () => {
    if (dateError) return;
    try {
      setLoading(true);
      setError(null);

      const params = {
        treatment: selectedTreatment,
        interval: group,
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
      setTreatmentOptions(options);
      if (!options.includes(selectedTreatment)) {
        setSelectedTreatment('all');
      }

      setStats([
        { title: 'Total Patients', value: totalPatients.toString(), icon: Users, color: 'bg-blue-500' },
        { title: 'Total Visits', value: totalVisits.toString(), icon: Calendar, color: 'bg-green-500' },
        { title: 'Active Treatments', value: activeTreatments.toString(), icon: UserCheck, color: 'bg-yellow-500' },
        { title: 'Total Treatments', value: totalTreatments.toString(), icon: TrendingUp, color: 'bg-purple-500' },
      ]);

      const visitLabels = summary.visit_chart?.labels || [];
      const visitSeries = summary.visit_chart?.series || {};
      const selectedVisitSeries = visitSeries[selectedTreatment] || visitSeries.all || [];
      const formattedVisitChartData = visitLabels.map((label, index) => ({
        label,
        visits: selectedVisitSeries[index] ?? 0,
      }));
      setVisitChartData(formattedVisitChartData);
      setTreatmentChartData({
        labels: summary.treatment_chart?.labels || [],
        datasets: [
          {
            data: summary.treatment_chart?.data || [],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          },
        ],
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err?.response?.status === 403) {
        setIsSubscriptionLocked(true);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Revenue Trend (Preserved)
  const fetchRevenueTrend = async () => {
    if (revenueError) return;
    try {
      setRevenueLoading(true);
      const params = {
        period,
        group_by: group,
        revenue_type: 'all',
      };
      if (period === 'custom_date_range') {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      if (selectedTreatment && selectedTreatment !== 'all') {
        params.treatment_ids = [selectedTreatment];
      }

      const response = await dashboardApi.revenueTrend(params);
      const data = response.data || {};
      setRevenueSummary({
        today_revenue: data.today_revenue ?? 0,
        total_revenue: data.total_revenue ?? 0,
        average_revenue: data.average_revenue ?? 0,
        highest_revenue: data.highest_revenue ?? 0,
        previous_total_revenue: data.previous_total_revenue ?? 0,
        previous_average_revenue: data.previous_average_revenue ?? 0,
        previous_highest_revenue: data.previous_highest_revenue ?? 0,
      });
      setRevenueData(data.data || []);
    } catch (err) {
      console.error('Error fetching revenue trend:', err);
      setRevenueError('Failed to load revenue trend data');
    } finally {
      setRevenueLoading(false);
    }
  };

  // 3. Fetch Real Today's Activity Data from APIs (Fixed Date Parsing & Patient Metadata)
  const fetchTodayOverviewData = async () => {
    try {
      setTodayLoading(true);
      setTodayError(null);

      const todayList = [];
      const recentList = [];

      // Parallel API queries to get real records created/updated
      const [patientsRes, visitsRes, treatmentsRes, prescriptionsRes] = await Promise.allSettled([
        patientApi.getAll({ ordering: '-created_at', limit: 50 }),
        visitsApi.getAll({ ordering: '-created_at', limit: 50 }),
        treatmentApi.getAll({ ordering: '-created_at', limit: 50 }),
        prescriptionApi.getAll({ ordering: '-created_at', limit: 50 }),
      ]);

      const isToday = (dateVal) => {
        if (!dateVal) return false;
        const iso = toISODate(dateVal);
        return iso === todayString;
      };

      // Process Patients
      if (patientsRes.status === 'fulfilled') {
        const pList = Array.isArray(patientsRes.value.data) ? patientsRes.value.data : (patientsRes.value.data?.results || []);
        pList.forEach((pt) => {
          const ptName = (pt.full_name || `${pt.first_name || ''} ${pt.last_name || ''}`).trim() || 'Patient';
          const pId = pt.id ? String(pt.id) : null;
          const item = {
            id: `pt_${pt.id}`,
            type: 'patient',
            category: 'patient',
            patientId: pId,
            patientName: ptName,
            patientGender: pt.gender || '',
            patientAge: pt.age ? `${pt.age} yrs` : '',
            patientMobile: pt.mobile || '',
            icon: UserPlus,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            badgeBg: 'bg-blue-100/70 text-blue-700',
            title: 'New Patient Registered',
            name: ptName,
            subtitle: 'Patient registered in clinic',
            timestamp: pt.created_at || pt.date_added,
            dateIso: toISODate(pt.created_at || pt.date_added),
            link: `/app/patients/${pt.id}`,
            buttonText: 'View Patient',
          };
          
          if (isToday(pt.created_at || pt.date_added)) {
            todayList.push(item);
          }
          recentList.push(item);
        });
      }

      // Process Visits
      if (visitsRes.status === 'fulfilled') {
        const vList = Array.isArray(visitsRes.value.data) ? visitsRes.value.data : (visitsRes.value.data?.results || []);
        vList.forEach((v) => {
          const pName = (
            (v.patient_full_name && v.patient_full_name !== 'N/A' ? v.patient_full_name : null) ||
            (v.patient_name && v.patient_last_name ? `${v.patient_name} ${v.patient_last_name}` : v.patient_name) ||
            v.treatment_details?.patient_name ||
            'Patient'
          ).trim();
          const tName = v.treatment_name || v.treatment_details?.type_name || 'Clinic Visit';
          const pId = String(
            v.patient_id ||
            v.treatment_details?.patient_id ||
            v.patient ||
            v.patient_details?.id ||
            (v.treatment && typeof v.treatment === 'object' ? v.treatment.patient : null) ||
            ''
          );
          const rawDoc = v.doctor_name && v.doctor_name !== 'N/A'
            ? v.doctor_name
            : (v.treatment_details?.doctor_name ? v.treatment_details.doctor_name : null);
          const docName = rawDoc ? (rawDoc.startsWith('Dr.') ? rawDoc : `Dr. ${rawDoc}`) : null;

          const item = {
            id: `v_${v.id}`,
            type: 'visit',
            category: 'visit',
            patientId: pId || null,
            patientName: pName,
            patientGender: v.patient_gender || v.patient_details?.gender || '',
            patientAge: v.patient_age ? `${v.patient_age} yrs` : (v.patient_details?.age ? `${v.patient_details.age} yrs` : ''),
            patientMobile: v.patient_mobile || v.patient_details?.mobile || '',
            icon: Calendar,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            badgeBg: 'bg-emerald-100/70 text-emerald-800',
            title: 'Visit Recorded',
            name: pName,
            subtitle: `Procedure: ${tName}${docName ? ` • ${docName}` : ''}`,
            timestamp: v.created_at || v.visit_date,
            dateIso: toISODate(v.created_at || v.visit_date),
            link: v.treatment ? `/app/treatments/${v.treatment}` : (pId ? `/app/patients/${pId}` : '/app/patients'),
            buttonText: 'View Visit',
          };
          if (isToday(v.created_at || v.visit_date)) {
            todayList.push(item);
          }
          recentList.push(item);
        });
      }

      // Process Treatments
      if (treatmentsRes.status === 'fulfilled') {
        const trList = Array.isArray(treatmentsRes.value.data) ? treatmentsRes.value.data : (treatmentsRes.value.data?.results || []);
        trList.forEach((tr) => {
          const pName = (
            (tr.patient_full_name && tr.patient_full_name !== 'N/A' ? tr.patient_full_name : null) ||
            (tr.patient_name ? `${tr.patient_name} ${tr.patient_last_name || ''}` : null) ||
            'Patient'
          ).trim();
          const typeName = tr.type_of_treatment_name || tr.type_name || 'Dental Procedure';
          const pId = String(tr.patient_id || tr.patient || tr.patient_details?.id || '');
          const statusText = getTreatmentStatusLabel(tr.status, treatmentStatusChoices) || 'Ongoing';

          const item = {
            id: `tr_${tr.id}`,
            type: 'treatment',
            category: 'treatment',
            patientId: pId || null,
            patientName: pName,
            patientGender: tr.patient_gender || tr.patient_details?.gender || '',
            patientAge: tr.patient_age ? `${tr.patient_age} yrs` : (tr.patient_details?.age ? `${tr.patient_details.age} yrs` : ''),
            patientMobile: tr.patient_mobile || tr.patient_details?.mobile || '',
            icon: Stethoscope,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
            badgeBg: 'bg-indigo-100/70 text-indigo-800',
            title: 'Treatment Added',
            name: pName,
            subtitle: `${typeName}${tr.total_amount ? ` • ₹${tr.total_amount}` : ''} • ${statusText}`,
            timestamp: tr.created_at || tr.start_date,
            dateIso: toISODate(tr.created_at || tr.start_date),
            link: `/app/treatments/${tr.id}`,
            buttonText: 'View Treatment',
            secondaryLink: pId ? `/app/patients/${pId}` : null,
            secondaryButtonText: 'View Patient',
          };
          if (isToday(tr.created_at || tr.start_date)) {
            todayList.push(item);
          }
          recentList.push(item);
        });
      }

      // Process Prescriptions
      if (prescriptionsRes.status === 'fulfilled') {
        const rxList = Array.isArray(prescriptionsRes.value.data) ? prescriptionsRes.value.data : (prescriptionsRes.value.data?.results || []);
        rxList.forEach((rx) => {
          const pName = (
            (rx.patient_full_name && rx.patient_full_name !== 'N/A' ? rx.patient_full_name : null) ||
            rx.patient_name ||
            'Patient'
          ).trim();
          const pId = String(rx.patient_id || rx.patient || rx.patient_details?.id || '');
          const item = {
            id: `rx_${rx.id}`,
            type: 'prescription',
            category: 'prescription',
            patientId: pId || null,
            patientName: pName,
            patientGender: rx.patient_gender || rx.patient_details?.gender || '',
            patientAge: rx.patient_age ? `${rx.patient_age} yrs` : (rx.patient_details?.age ? `${rx.patient_details.age} yrs` : ''),
            patientMobile: rx.patient_mobile || rx.patient_details?.mobile || '',
            icon: Pill,
            color: 'text-purple-600 bg-purple-50 border-purple-200',
            badgeBg: 'bg-purple-100/70 text-purple-800',
            title: 'Prescription Created',
            name: pName,
            subtitle: rx.diagnosis || 'Prescription medications issued',
            timestamp: rx.created_at || rx.date,
            dateIso: toISODate(rx.created_at || rx.date),
            link: pId ? `/app/patients/${pId}` : '/app/patients',
            buttonText: 'View Prescription',
          };
          if (isToday(rx.created_at || rx.date)) {
            todayList.push(item);
          }
          recentList.push(item);
        });
      }

      const sortByTime = (arr) => arr.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setTodayActivities(sortByTime(todayList));
      setAllRecentActivities(sortByTime(recentList));
    } catch (err) {
      console.error('Error fetching today overview:', err);
      setTodayError('Unable to load today\'s activity feed.');
    } finally {
      setTodayLoading(false);
    }
  };

  // 4. Fetch Upcoming Visits Data (Multi-source & Fixed Date Parsing)
  const fetchUpcomingVisitsData = async () => {
    try {
      setUpcomingLoading(true);
      setUpcomingError(null);

      let endDays = 5;
      if (upcomingRange === 'next_7_days') endDays = 7;
      if (upcomingRange === 'next_14_days') endDays = 14;
      if (upcomingRange === 'next_30_days') endDays = 30;

      let rangeStart = todayString;
      let rangeEnd = (() => {
        const d = new Date(today);
        d.setDate(d.getDate() + endDays);
        return toDateInputValue(d);
      })();

      if (upcomingRange === 'custom') {
        rangeStart = customUpcomingStart;
        rangeEnd = customUpcomingEnd;
      }

      // Query both dashboard summary API and direct visits API in parallel
      const [dashRes, visitsRes] = await Promise.allSettled([
        dashboardApi.get({ start_date: rangeStart, end_date: rangeEnd }),
        visitsApi.getAll({ limit: 100 }),
      ]);

      let rawList = [];

      if (dashRes.status === 'fulfilled') {
        const dashVisits = dashRes.value?.data?.summary?.upcoming_visits || [];
        rawList = rawList.concat(dashVisits);
      }

      if (visitsRes.status === 'fulfilled') {
        const allVisits = Array.isArray(visitsRes.value.data)
          ? visitsRes.value.data
          : (visitsRes.value.data?.results || []);
        rawList = rawList.concat(allVisits);
      }

      // Deduplicate visits by ID
      const seenMap = new Map();
      const uniqueVisits = [];

      rawList.forEach((v) => {
        if (!v || !v.id) return;
        if (!seenMap.has(v.id)) {
          seenMap.set(v.id, true);
          uniqueVisits.push(v);
        }
      });

      // Filter upcoming visits within date range using robust toISODate
      const filtered = uniqueVisits.filter((v) => {
        const visitDate = v.next_visit_date || v.visit_date;
        if (!visitDate) return false;
        const isoDate = toISODate(visitDate);
        if (!isoDate || isoDate === 'N/A') return false;
        return isoDate >= rangeStart && isoDate <= rangeEnd;
      });

      setUpcomingVisitsList(filtered);
    } catch (err) {
      console.error('Error fetching upcoming visits:', err);
      setUpcomingError('Unable to load upcoming visits.');
    } finally {
      setUpcomingLoading(false);
    }
  };

  // Group Upcoming Visits strictly by DATE (DATE ONLY, NO TIME)
  const groupedUpcomingVisits = (() => {
    const groupsMap = {};
    upcomingVisitsList.forEach((visit) => {
      const rawDate = visit.next_visit_date || visit.visit_date;
      const isoDateStr = toISODate(rawDate);
      if (!isoDateStr || isoDateStr === 'N/A') return;

      if (!groupsMap[isoDateStr]) {
        groupsMap[isoDateStr] = [];
      }
      groupsMap[isoDateStr].push(visit);
    });

    const sortedDates = Object.keys(groupsMap).sort((a, b) => a.localeCompare(b));
    return sortedDates.map((dStr) => {
      const parsed = parseDateString(dStr);
      let formatted = formatDate(dStr);
      if (parsed) {
        formatted = parsed.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      return {
        dateStr: dStr,
        formattedDate: formatted,
        visits: groupsMap[dStr],
      };
    });
  })();

  const getFilterLabel = () => {
    if (period === 'custom_date_range') {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (period === 'last_7_days') return 'Last 7 days';
    if (period === 'current_month') return 'Current month';
    if (period === 'year_to_date') return 'Year to date';
    return 'Selected range';
  };

  // Group Today's Activities by unique Patient ID or Patient Name
  const groupActivitiesByPatient = (activitiesList, filterCategory = 'all') => {
    if (!Array.isArray(activitiesList) || activitiesList.length === 0) return [];

    // 1. Filter by category dropdown if not 'all'
    const filtered = activitiesList.filter((act) => {
      if (filterCategory === 'all') return true;
      return act.category === filterCategory;
    });

    const groupsList = [];

    const cleanPid = (id) => (id && id !== 'undefined' && id !== 'null' && id !== '') ? String(id) : null;
    const cleanName = (name) => (name || '').toLowerCase().trim().replace(/^(dr\.|mr\.|mrs\.|ms\.)\s*/i, '');

    filtered.forEach((act) => {
      const actPid = cleanPid(act.patientId);
      const actName = cleanName(act.patientName);

      // Try to find an existing patient group to merge into
      let targetGroup = null;

      if (actPid) {
        targetGroup = groupsList.find((g) => g.patientId && String(g.patientId) === actPid);
      }

      if (!targetGroup && actName) {
        targetGroup = groupsList.find((g) => {
          const gName = cleanName(g.patientName);
          if (!gName) return false;
          if (gName === actName) return true;
          // Sub-string/full-name match check (e.g. "Mahesh" vs "Mahesh Mule")
          if (gName.startsWith(actName + ' ') || actName.startsWith(gName + ' ')) return true;
          return false;
        });
      }

      if (targetGroup) {
        // Merge metadata if missing
        if (!targetGroup.patientId && actPid) targetGroup.patientId = actPid;
        if (!targetGroup.patientGender && act.patientGender) targetGroup.patientGender = act.patientGender;
        if (!targetGroup.patientAge && act.patientAge) targetGroup.patientAge = act.patientAge;
        if (!targetGroup.patientMobile && act.patientMobile) targetGroup.patientMobile = act.patientMobile;

        // Keep the fullest/longest name available for display
        if (act.patientName && act.patientName.trim().length > targetGroup.patientName.trim().length) {
          targetGroup.patientName = act.patientName.trim();
        }

        if (act.timestamp) {
          if (!targetGroup.mostRecentTimestamp || new Date(act.timestamp) > new Date(targetGroup.mostRecentTimestamp)) {
            targetGroup.mostRecentTimestamp = act.timestamp;
          }
        }

        // Avoid adding duplicate activity items
        if (!targetGroup.activities.some((item) => item.id === act.id)) {
          targetGroup.activities.push(act);
        }
      } else {
        // Create a new patient group card
        groupsList.push({
          patientId: actPid,
          patientName: act.patientName ? act.patientName.trim() : 'Patient',
          patientGender: act.patientGender || '',
          patientAge: act.patientAge || '',
          patientMobile: act.patientMobile || '',
          mostRecentTimestamp: act.timestamp || null,
          activities: [act],
        });
      }
    });

    // Sort activities inside each patient card: newest -> oldest
    groupsList.forEach((group) => {
      group.activities.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    });

    // Sort patient groups: patient with the most recent activity comes first
    groupsList.sort((a, b) => {
      if (!a.mostRecentTimestamp) return 1;
      if (!b.mostRecentTimestamp) return -1;
      return new Date(b.mostRecentTimestamp) - new Date(a.mostRecentTimestamp);
    });

    return groupsList;
  };

  const activeActivitiesSource = (todayActivities.length > 0 || !showRecentIfEmpty) 
    ? todayActivities 
    : allRecentActivities;

  const groupedPatientList = groupActivitiesByPatient(activeActivitiesSource, todayFilter);
  const todayTotalPages = Math.ceil(groupedPatientList.length / TODAY_PER_PAGE);
  const paginatedPatientList = groupedPatientList.slice((todayCurrentPage - 1) * TODAY_PER_PAGE, todayCurrentPage * TODAY_PER_PAGE);

  const upcomingTotalPages = Math.ceil(groupedUpcomingVisits.length / UPCOMING_PER_PAGE);
  const paginatedUpcomingVisits = groupedUpcomingVisits.slice((upcomingCurrentPage - 1) * UPCOMING_PER_PAGE, upcomingCurrentPage * UPCOMING_PER_PAGE);

  if (isSubscriptionLocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <LockedFeatureCard
          featureName="Dashboard"
          description="Your clinic does not have an active subscription plan. Upgrade your plan to access clinic analytics, overview widgets, and revenue details."
          compact={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* DASHBOARD HEADER & TAB SELECTOR (STICKY WITH DYNAMIC BG COLORS) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-md border border-slate-200/80 space-y-4 transition-all">
        
        {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Clinic Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] mt-0.5 font-medium">
              {activeDashboardTab === 'today' && "Everything that happened in your clinic today."}
              {activeDashboardTab === 'revenue' && "Financial analytics, collection trends, and treatment distribution."}
              {activeDashboardTab === 'upcoming' && "Scheduled patient visits grouped by date."}
            </p>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100/90 px-3.5 py-2 rounded-xl border border-slate-200/90 self-start sm:self-auto flex items-center gap-2 shadow-xs">
            <Clock size={15} className="text-[#2563EB]" />
            <span>Today: {formatDate(todayString)}</span>
          </div>
        </div> */}

        {/* THREE SEGMENTED DASHBOARD TABS WITH DISTINCT BG COLORS */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-100/90 p-2 rounded-2xl border border-slate-200/80" role="tablist">
            
            {/* TAB 1: TODAY'S OVERVIEW (BLUE THEME) */}
            <button
              role="tab"
              aria-selected={activeDashboardTab === 'today'}
              onClick={() => setActiveDashboardTab('today')}
              className={`py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border ${
                activeDashboardTab === 'today'
                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/30 scale-[1.01]'
                  : 'bg-blue-50/80 text-blue-700 hover:bg-blue-100/90 border-blue-200/60'
              }`}
            >
              <Sparkles size={16} className={activeDashboardTab === 'today' ? 'text-white' : 'text-[#2563EB]'} />
              <span className="truncate">Today's Overview</span>
            </button>

            {/* TAB 2: CLINIC REVENUE (EMERALD/GREEN THEME) */}
            <button
              role="tab"
              aria-selected={activeDashboardTab === 'revenue'}
              onClick={() => setActiveDashboardTab('revenue')}
              className={`py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border ${
                activeDashboardTab === 'revenue'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30 scale-[1.01]'
                  : 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/90 border-emerald-200/60'
              }`}
            >
              <DollarSign size={16} className={activeDashboardTab === 'revenue' ? 'text-white' : 'text-emerald-600'} />
              <span className="truncate">Revenue and Analytics</span>
            </button>

            {/* TAB 3: UPCOMING VISITS (PURPLE/INDIGO THEME) */}
            <button
              role="tab"
              aria-selected={activeDashboardTab === 'upcoming'}
              onClick={() => setActiveDashboardTab('upcoming')}
              className={`py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border ${
                activeDashboardTab === 'upcoming'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/30 scale-[1.01]'
                  : 'bg-purple-50/80 text-purple-700 hover:bg-purple-100/90 border-purple-200/60'
              }`}
            >
              <Calendar size={16} className={activeDashboardTab === 'upcoming' ? 'text-white' : 'text-purple-600'} />
              <span className="truncate">Upcoming Visits</span>
            </button>

          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* SECTION 1: TODAY'S OVERVIEW (TAB 1 REDESIGNED & HARDENED) */}
      {/* ========================================================= */}
      {activeDashboardTab === 'today' && (
        <div className="space-y-4 sm:space-y-5 animate-in">
          
          {/* Top 4 Today Operational KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {(() => {
              const listToCount = todayActivities.length > 0 ? todayActivities : allRecentActivities;
              const isRecent = todayActivities.length === 0 && showRecentIfEmpty;
              const labelSuffix = isRecent ? '(Recent)' : '(Today)';

              const todayStats = [
                {
                  title: "Today's New Patients",
                  value: listToCount.filter(a => a.type === 'patient').length.toString(),
                  subtext: `Registered ${labelSuffix}`,
                  icon: UserPlus,
                  color: 'bg-blue-500/10 text-blue-600 border border-blue-200/60',
                },
                {
                  title: 'Visits Recorded',
                  value: listToCount.filter(a => a.type === 'visit').length.toString(),
                  subtext: `Scheduled & Logged ${labelSuffix}`,
                  icon: Calendar,
                  color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/60',
                },
                {
                  title: 'Treatments Added',
                  value: listToCount.filter(a => a.type === 'treatment').length.toString(),
                  subtext: `Procedures Logged ${labelSuffix}`,
                  icon: Stethoscope,
                  color: 'bg-indigo-500/10 text-indigo-600 border border-indigo-200/60',
                },
                {
                  title: 'Prescriptions Issued',
                  value: listToCount.filter(a => a.type === 'prescription').length.toString(),
                  subtext: `Issued ${labelSuffix}`,
                  icon: Pill,
                  color: 'bg-sky-500/10 text-sky-600 border border-sky-200/60',
                },
              ];

              return todayStats.map((stat, idx) => {
                const IconComp = stat.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase truncate">
                        {stat.title}
                      </span>
                      <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${stat.color} flex-shrink-0`}>
                        <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                        {stat.subtext}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* 2-Column Responsive Layout Grid (8 Cols Left / 4 Cols Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            
            {/* Left Column (8 Cols): Real-time Patient Activity Feed */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Controls Bar Header */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Sparkles size={18} className="text-[#2563EB]" />
                  <span>Today's Real Activity Feed</span>
                  {todayActivities.length === 0 && allRecentActivities.length > 0 && showRecentIfEmpty && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200/60">
                      Showing Recent Activities
                    </span>
                  )}
                </div>

                {/* Category Filter & Refresh */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1">
                    <Filter size={14} className="text-slate-400" />
                    <select
                      value={todayFilter}
                      onChange={(e) => setTodayFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Activity</option>
                      <option value="patient">Patients</option>
                      <option value="visit">Visits</option>
                      <option value="treatment">Treatments</option>
                      <option value="prescription">Prescriptions</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={fetchTodayOverviewData}
                    className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0"
                    title="Refresh Activity"
                  >
                    <RefreshCw size={16} className={todayLoading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Activity Feed Body */}
              {todayLoading ? (
                <div className="bg-white rounded-xl sm:rounded-2xl p-12 border border-slate-200/90 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2563EB]" />
                  <p className="text-sm font-semibold text-slate-600">Gathering today's clinic activity...</p>
                </div>
              ) : todayError ? (
                <div className="bg-rose-50 border border-rose-200/90 rounded-xl sm:rounded-2xl p-5 flex items-center justify-between text-rose-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-rose-600" />
                    <span className="text-xs sm:text-sm font-medium">{todayError}</span>
                  </div>
                  <button
                    onClick={fetchTodayOverviewData}
                    className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : groupedPatientList.length === 0 ? (
                <div className="bg-white rounded-xl sm:rounded-2xl p-10 border border-slate-200/90 text-center space-y-3 shadow-xs">
                  <div className="text-3xl">✨</div>
                  <h3 className="text-base font-bold text-slate-900">No Activity Recorded Today</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No patient activities matching your filter were recorded for today's date ({formatDate(todayString)}).
                  </p>

                  {allRecentActivities.length > 0 && !showRecentIfEmpty && (
                    <button
                      onClick={() => setShowRecentIfEmpty(true)}
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-blue-700 transition mt-2"
                    >
                      View Recent Clinic Activities ({allRecentActivities.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedPatientList.map((group) => {
                    const patientUrl = group.patientId ? `/app/patients/${group.patientId}` : '/app/patients';
                    const isRecentGroup = todayActivities.length === 0 && showRecentIfEmpty;

                    return (
                      <div
                        key={group.patientId ? `group_${group.patientId}` : `group_${group.patientName}`}
                        className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all overflow-hidden"
                      >
                        {/* PATIENT CARD HEADER */}
                        <div className="bg-slate-50/80 p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[#2563EB] font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                              <Users size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                  {group.patientName}
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200/60">
                                  {group.activities.length} {group.activities.length === 1 ? 'activity' : 'activities'} {isRecentGroup ? 'recent' : 'today'}
                                </span>
                              </div>

                              {(group.patientGender || group.patientAge || group.patientMobile) && (
                                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                  {group.patientGender && <span className="capitalize">{group.patientGender}</span>}
                                  {group.patientGender && group.patientAge && <span>•</span>}
                                  {group.patientAge && <span>{group.patientAge}</span>}
                                  {group.patientMobile && (group.patientGender || group.patientAge) && <span>•</span>}
                                  {group.patientMobile && <span>📞 {group.patientMobile}</span>}
                                </p>
                              )}
                            </div>
                          </div>

                          {group.patientId && (
                            <button
                              onClick={() => navigate(patientUrl)}
                              className="px-3 py-1.5 bg-white hover:bg-[#2563EB] text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs self-start sm:self-auto"
                            >
                              <span>View Patient</span>
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>

                        {/* ACTIVITIES LIST INSIDE PATIENT CARD */}
                        <div className="p-3.5 sm:p-4 space-y-2.5">
                          {group.activities.map((act) => {
                            const IconC = act.icon;
                            return (
                              <div
                                key={act.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50/60 hover:bg-slate-100/80 border border-slate-100 transition-all group/item"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className={`p-2 rounded-xl border ${act.color} flex-shrink-0 mt-0.5`}>
                                    <IconC size={15} />
                                  </div>
                                  
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        {act.title}
                                      </span>
                                      {act.timestamp && (
                                        <span className="text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                                          {formatActivityTime(act.timestamp)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 group-hover/item:text-[#2563EB] transition-colors truncate">
                                      {act.subtitle}
                                    </p>
                                  </div>
                                </div>

                                {act.link && (
                                  <button
                                    onClick={() => navigate(act.link)}
                                    className="px-2.5 py-1 bg-white hover:bg-[#2563EB] text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 self-end sm:self-auto flex-shrink-0 shadow-2xs"
                                  >
                                    <span>{act.buttonText}</span>
                                    <ChevronRight size={12} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Today's Overview Pagination */}
                  {todayTotalPages > 1 && (
                    <div className="pt-3 border-t border-slate-200/80">
                      <Pagination
                        currentPage={todayCurrentPage}
                        totalPages={todayTotalPages}
                        onPageChange={(page) => {
                          setTodayCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        itemCountText={`${((todayCurrentPage - 1) * TODAY_PER_PAGE) + 1} - ${Math.min(todayCurrentPage * TODAY_PER_PAGE, groupedPatientList.length)} of ${groupedPatientList.length} patient records`}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right Column (4 Cols): Today's Desk Operational Summary & Quick Actions */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Doctor & Clinic Desk Status Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Clinic Desk Active</h4>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                    {formatDate(todayString)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Doctor on Duty:</span>
                    <span className="font-bold text-slate-900">Dr. Swati Lahane</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Activities Today:</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {todayActivities.length} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Clinical Actions Widget */}
              <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quick Clinical Actions</h4>
                
                <button
                  onClick={() => navigate('/app/patients?add=true')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-100 transition-all text-xs font-semibold group"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={15} />
                    <span>Register New Patient</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/app/treatments')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-100 transition-all text-xs font-semibold group"
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope size={15} />
                    <span>View Treatments & Procedures</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/app/patients')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-200/80 transition-all text-xs font-semibold group"
                >
                  <span className="flex items-center gap-2">
                    <Users size={15} />
                    <span>All Patient Records</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: CLINIC REVENUE (TAB 2 REDESIGNED) */}
      {/* ========================================================= */}
      {activeDashboardTab === 'revenue' && (
        <div className="space-y-4 sm:space-y-5 animate-in">
          
          {/* Header & Filter Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Clinic Revenue</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  Analytics
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Track collections, financial performance, and treatment distribution.</p>
            </div>

            {/* Filter Bar */}
            <div className="w-full lg:w-auto">
              <AnalyticsFilters
                period={period}
                group={group}
                selectedTreatment={selectedTreatment}
                treatmentOptions={treatmentOptions}
                onPeriodChange={handlePeriodChange}
                onGroupChange={setGroup}
                onTreatmentChange={setSelectedTreatment}
                onOpenDateRange={() => {
                  setDraftStartDate(startDate);
                  setDraftEndDate(endDate);
                  setShowDatePicker(true);
                }}
                customDateRangeLabel={`${formatDate(startDate)} - ${formatDate(endDate)}`}
              />
            </div>
          </div>

          {/* Primary Revenue KPIs & Main Trend Chart Card */}
          <RevenueTrend
            data={revenueData}
            summary={revenueSummary}
            loading={revenueLoading}
            error={revenueError}
          />

          {/* 2-Column Responsive Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            
            {/* Left Column (7 Cols): Treatment Revenue Distribution & Breakdown */}
            <div className="lg:col-span-7 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Treatment Revenue Distribution</h3>
                  <p className="text-xs text-slate-500">Revenue breakdown across procedure categories</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Procedures
                </span>
              </div>

              {/* Treatment Breakdown Content */}
              {(() => {
                const labels = treatmentChartData?.labels || [];
                const values = treatmentChartData?.datasets?.[0]?.data || [];
                const colors = treatmentChartData?.datasets?.[0]?.backgroundColor || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                const totalValue = values.reduce((a, b) => a + b, 0);

                if (loading) {
                  return (
                    <div className="h-48 animate-pulse rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Loading distribution...
                    </div>
                  );
                }

                if (labels.length === 0 || values.length === 0 || totalValue === 0) {
                  return (
                    <div className="h-48 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                      <span className="text-2xl mb-1">📊</span>
                      <p className="text-xs font-semibold text-slate-800">No procedure breakdown for this period</p>
                      <p className="mt-1 text-[11px] text-slate-500">Log procedures or change date range to see distribution.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center min-h-[190px]">
                    {/* Compact Donut Chart (5 Cols) */}
                    <div className="sm:col-span-5 h-40 sm:h-44 relative flex items-center justify-center">
                      <Doughnut
                        key={chartKey}
                        data={treatmentChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${ctx.raw} procedures`,
                              },
                            },
                          },
                          cutout: '72%',
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
                        <span className="text-base sm:text-lg font-bold text-slate-900">{totalValue}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Procedures</span>
                      </div>
                    </div>

                    {/* Progress Bar Breakdown List (7 Cols) */}
                    <div className="sm:col-span-7 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {labels.map((label, idx) => {
                        const count = values[idx] || 0;
                        const pct = totalValue > 0 ? Math.round((count / totalValue) * 100) : 0;
                        const barColor = colors[idx % colors.length];

                        return (
                          <div key={label} className="p-2 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: barColor }} />
                                <span className="truncate">{label}</span>
                              </span>
                              <span className="font-bold text-slate-900 flex-shrink-0">
                                {count} <span className="text-[10px] font-normal text-slate-500">({pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: barColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column (5 Cols): Clinical Stats & Visit Volume */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              {/* 4 Summary Stats Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">{stat.title}</span>
                        <div className={`${stat.color} rounded-lg p-1.5 shadow-2xs flex-shrink-0`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Compact Patient Visits Volume Chart */}
              <PatientVisitsTrend chartData={visitChartData} loading={loading} error={dateError || error} />
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: UPCOMING VISITS (TAB 3 - DATE ONLY, NO TIME) */}
      {/* ========================================================= */}
      {activeDashboardTab === 'upcoming' && (
        <div className="space-y-6 animate-in">
          
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Calendar size={18} className="text-[#2563EB]" />
              <span>Upcoming Patient Visits (Date Only)</span>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={upcomingRange}
                onChange={(e) => {
                  setUpcomingRange(e.target.value);
                  if (e.target.value === 'custom') {
                    setShowUpcomingCustomPicker(true);
                  }
                }}
                className="form-select text-xs font-semibold py-2 px-3 rounded-xl border-slate-200 text-slate-700 bg-slate-50 focus:bg-white"
              >
                <option value="next_5_days">Next 5 Days (Default)</option>
                <option value="next_7_days">Next 7 Days</option>
                <option value="next_14_days">Next 14 Days</option>
                <option value="next_30_days">Next 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>

              <button
                onClick={fetchUpcomingVisitsData}
                className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-colors"
                title="Refresh Visits"
              >
                <RefreshCw size={16} className={upcomingLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Upcoming Visits Content */}
          {upcomingLoading ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2563EB]" />
              <p className="text-sm font-semibold text-slate-600">Loading upcoming patient visits...</p>
            </div>
          ) : upcomingError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center justify-between text-red-800">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600" />
                <span className="text-sm font-medium">{upcomingError}</span>
              </div>
              <button
                onClick={fetchUpcomingVisitsData}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          ) : groupedUpcomingVisits.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
              <div className="text-4xl">🗓️</div>
              <h3 className="text-lg font-bold text-slate-900">No Upcoming Visits Scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No patient visits scheduled in the selected date range ({upcomingRange.replace('_', ' ')}).
              </p>

              {upcomingRange === 'next_5_days' && (
                <button
                  onClick={() => setUpcomingRange('next_30_days')}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition"
                >
                  Expand Range to Next 30 Days
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {paginatedUpcomingVisits.map((groupItem) => (
                <div key={groupItem.dateStr} className="space-y-3">
                  
                  {/* DATE GROUP HEADER (DATE ONLY, NO TIME) */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-[#2563EB]" />
                      <h3 className="text-base font-extrabold text-slate-900">
                        {groupItem.formattedDate}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                      {groupItem.visits.length} {groupItem.visits.length === 1 ? 'upcoming visit' : 'upcoming visits'}
                    </span>
                  </div>

                  {/* Patient Visit Cards (NO TIME DISPLAYED ANYWHERE) */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {groupItem.visits.map((visit) => {
                      const patientName = visit.patient_full_name || `${visit.patient_name || ''} ${visit.patient_last_name || ''}`.trim() || 'Patient';
                      const treatmentName = visit.treatment_name || visit.treatment_details?.type_name || 'Dental Procedure';
                      const doctorName = visit.doctor_name || visit.doctor?.name || 'Dr. Swati Lahane';

                      return (
                        <div
                          key={visit.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                <Users size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                                  {patientName}
                                </h4>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                  <Stethoscope size={13} className="text-blue-500" />
                                  <span>{treatmentName}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <UserCheck size={14} className="text-slate-400" />
                              <span>Doctor: <strong className="text-slate-800">{doctorName}</strong></span>
                            </div>

                            {visit.patient_mobile && visit.patient_mobile !== 'N/A' && (
                              <a
                                href={`tel:${visit.patient_mobile}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Phone size={12} />
                                <span>{visit.patient_mobile}</span>
                              </a>
                            )}
                          </div>

                          {/* Action Navigation Button */}
                          <div className="pt-1 flex items-center gap-2">
                            <button
                              onClick={() => navigate(visit.treatment || visit.treatment_id ? `/app/treatments/${visit.treatment || visit.treatment_id}` : '/app/patients')}
                              className="w-full py-2 bg-slate-50 hover:bg-[#2563EB] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                            >
                              <span>View Details</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}

              {/* Upcoming Visits Pagination */}
              {upcomingTotalPages > 1 && (
                <div className="pt-4 border-t border-slate-200/80">
                  <Pagination
                    currentPage={upcomingCurrentPage}
                    totalPages={upcomingTotalPages}
                    onPageChange={(page) => {
                      setUpcomingCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    itemCountText={`${((upcomingCurrentPage - 1) * UPCOMING_PER_PAGE) + 1} - ${Math.min(upcomingCurrentPage * UPCOMING_PER_PAGE, groupedUpcomingVisits.length)} of ${groupedUpcomingVisits.length} visit date groups`}
                  />
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* REVENUE DATE RANGE PICKER MODAL (PRESERVED) */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 modal-backdrop-instant"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5 max-h-[calc(100vh-4rem)] overflow-y-auto modal-content-instant"
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
              {['M','T','W','T','F','S','S'].map((day, dIdx) => (
                <div key={dIdx}>{day}</div>
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

      {/* UPCOMING VISITS CUSTOM DATE RANGE PICKER MODAL */}
      {showUpcomingCustomPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 modal-backdrop-instant"
          onClick={() => setShowUpcomingCustomPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 modal-content-instant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Upcoming Visits Custom Range</h3>
              <button
                onClick={() => setShowUpcomingCustomPicker(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label text-xs">From Date</label>
                <input
                  type="date"
                  value={customUpcomingStart}
                  onChange={(e) => setCustomUpcomingStart(e.target.value)}
                  className="input2 w-full text-sm"
                />
              </div>
              <div>
                <label className="label text-xs">To Date</label>
                <input
                  type="date"
                  value={customUpcomingEnd}
                  onChange={(e) => setCustomUpcomingEnd(e.target.value)}
                  className="input2 w-full text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpcomingCustomPicker(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpcomingCustomPicker(false);
                  fetchUpcomingVisitsData();
                }}
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
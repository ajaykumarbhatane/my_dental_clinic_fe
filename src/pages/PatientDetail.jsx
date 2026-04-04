import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Edit,
  ArrowLeft,
  Plus,
  FileText,
  ClipboardList,
  Calendar,
  Users,
  DollarSign,
  Clock,
  X,
  UploadCloud,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { formatDate, parseDateString, toISODate, toDDMMYYYY } from '../utils/dateUtils';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [allVisits, setAllVisits] = useState([]);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [treatmentDrawerOpen, setTreatmentDrawerOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  const [isAddingTreatment, setIsAddingTreatment] = useState(false);
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [treatmentFormData, setTreatmentFormData] = useState({
    type_of_treatment: '',
    status: 'scheduled',
    estimated_duration_months: '',
    planned_amount: '',
    initial_findings: '',
    treatment_plan: '',
    treatment_notes: '',
    braces_type: '',
    cap_type: ''
  });
  const [submittingTreatment, setSubmittingTreatment] = useState(false);
  const [visitFormData, setVisitFormData] = useState({
    next_visit_date: '',
    treatment_notes: '',
    patient_complaints: '',
    patient_payment_amount: '',
    patient_payment_type: 'cash',
    payment_note: ''
  });

  const formatAmount = (amount) => {
    if (amount === 0 || amount) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return 'N/A';
  };

  const calculateTotals = () => {
    const totalTreatments = treatments.length;
    const totalVisits = allVisits.length;
    const totalPaid = allVisits.reduce((sum, v) => sum + Number(v.patient_payment_amount || 0), 0);
    const totalPlanned = treatments.reduce((sum, t) => sum + Number(t.planned_amount || 0), 0);
    const pendingAmount = Math.max(0, totalPlanned - totalPaid);

    return { totalTreatments, totalVisits, totalPaid, pendingAmount, totalPlanned };
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    setSubmittingVisit(true);

    try {
      if (!visitFormData.next_visit_date) {
        alert('Please select a visit date');
        setSubmittingVisit(false);
        return;
      }

      const payload = {
        treatment: selectedTreatment.id,
        next_visit_date: toISODate(visitFormData.next_visit_date),
        treatment_notes: visitFormData.treatment_notes || null,
        patient_complaints: visitFormData.patient_complaints || null,
        patient_payment_amount: visitFormData.patient_payment_amount ? parseInt(visitFormData.patient_payment_amount, 10) : null,
        patient_payment_type: visitFormData.patient_payment_type || null,
        payment_note: visitFormData.payment_note || null
      };

      await visitsApi.create(payload);
      setIsAddingVisit(false);
      setVisitFormData({
        next_visit_date: '',
        treatment_notes: '',
        patient_complaints: '',
        patient_payment_amount: '',
        patient_payment_type: 'cash',
        payment_note: ''
      });
      await loadData();
      alert('Visit added successfully!');
    } catch (error) {
      console.error('Error creating visit:', error);
      alert(error.response?.data?.detail || 'Error creating visit');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault();
    setSubmittingTreatment(true);

    try {
      // Validate required fields
      if (!treatmentFormData.type_of_treatment) {
        alert('Please select a treatment type');
        setSubmittingTreatment(false);
        return;
      }

      const payload = {
        patient: id, // Use the patient ID from URL params
        type_of_treatment: treatmentFormData.type_of_treatment,
        status: treatmentFormData.status,
        estimated_duration_months: treatmentFormData.estimated_duration_months ? parseInt(treatmentFormData.estimated_duration_months, 10) : null,
        planned_amount: treatmentFormData.planned_amount ? parseFloat(treatmentFormData.planned_amount) : null,
        initial_findings: treatmentFormData.initial_findings || null,
        treatment_plan: treatmentFormData.treatment_plan || null,
        treatment_notes: treatmentFormData.treatment_notes || null,
        braces_type: treatmentFormData.braces_type || null,
        cap_type: treatmentFormData.cap_type || null
      };

      await treatmentApi.create(payload);
      setIsAddingTreatment(false);
      setTreatmentFormData({
        type_of_treatment: '',
        status: 'scheduled',
        estimated_duration_months: '',
        planned_amount: '',
        initial_findings: '',
        treatment_plan: '',
        treatment_notes: '',
        braces_type: '',
        cap_type: ''
      });
      await loadData();
      alert('Treatment added successfully!');
    } catch (error) {
      console.error('Error creating treatment:', error);
      alert(error.response?.data?.detail || 'Error creating treatment');
    } finally {
      setSubmittingTreatment(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const patientResponse = await patientApi.getById(id);
      const treatmentsResponse = await treatmentApi.getByPatient(id);
      const treatmentTypesResponse = await treatmentApi.getTypes();

      const patientData = patientResponse.data;
      const treatmentsData = treatmentsResponse.data?.results || treatmentsResponse.data || [];
      const treatmentTypesData = treatmentTypesResponse.data?.results || treatmentTypesResponse.data || [];

      setPatient(patientData);
      setTreatments(treatmentsData);
      setTreatmentTypes(treatmentTypesData);

      const visitPromises = treatmentsData.map((t) => visitsApi.getByTreatment(t.id));
      const visitResponses = visitPromises.length > 0 ? await Promise.all(visitPromises) : [];

      const visitsFlattened = visitResponses.flatMap((resp) => {
        const vData = resp.data?.results || resp.data || [];
        return Array.isArray(vData) ? vData : [];
      });

      setAllVisits(visitsFlattened);

      const now = new Date();
      const upcoming = visitsFlattened
        .filter((v) => {
          if (!v.next_visit_date) return false;
          const next = parseDateString(v.next_visit_date);
          return next && next >= now;
        })
        .sort((a, b) => new Date(a.next_visit_date) - new Date(b.next_visit_date))
        .slice(0, 10);

      setUpcomingVisits(upcoming);
    } catch (error) {
      console.error('Error loading patient detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tab = query.get('tab');
    setActiveTab(tab === 'treatments' || tab === 'visits' ? tab : 'overview');
    loadData();
  }, [id, location.search]);

  const getVisitsForTreatment = (treatmentId) => {
    return allVisits.filter(
      (v) => String(v.treatment) === String(treatmentId) || String(v.treatment_id) === String(treatmentId)
    );
  };

  const treatmentProgress = (treatment) => {
    const visits = getVisitsForTreatment(treatment.id);
    const planned = Number(treatment.estimated_duration_months || 0);
    if (!planned || planned === 0) return 0;
    return Math.min(100, Math.round((visits.length / planned) * 100));
  };

  const closeDrawer = () => {
    setTreatmentDrawerOpen(false);
    setSelectedTreatment(null);
  };

  const handleViewTreatment = (treatment) => {
    navigate(`/app/treatments/${treatment.id}`, {
      state: {
        fromPatientDetail: true,
        patientId: patient?.id,
        returnTab: 'treatments'
      }
    });
  };

  const { totalTreatments, totalVisits, totalPaid, pendingAmount } = calculateTotals();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-72">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center text-gray-500">Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{patient.first_name} {patient.last_name}</h1>
          <div className="flex gap-2 flex-wrap items-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" /> {patient.gender || 'N/A'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(patient.date_of_birth) || 'N/A'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddingTreatment(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Treatment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
            <p className="mt-1 font-semibold text-gray-900">{patient.mobile || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase font-semibold">Secondary Phone</p>
            <p className="mt-1 font-semibold text-gray-900">{patient.secondary_mobile || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
            <p className="mt-1 text-sm text-gray-700">{patient.address || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 md:col-span-2 lg:col-span-1">
            <p className="text-xs text-gray-500 uppercase font-semibold">Medical History</p>
            <p className="mt-1 text-sm text-gray-700">{patient.medical_history || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 md:col-span-2 lg:col-span-1">
            <p className="text-xs text-gray-500 uppercase font-semibold">Dental History</p>
            <p className="mt-1 text-sm text-gray-700">{patient.dental_history || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 md:col-span-2 lg:col-span-1">
            <p className="text-xs text-gray-500 uppercase font-semibold">Assigned Doctor</p>
            <p className="mt-1 text-sm text-gray-700">{patient.assigned_doctor || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 mb-4">
          {['overview', 'treatments', 'visits'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[{
                title: 'Total Treatments',
                value: totalTreatments,
                icon: ClipboardList,
                className: 'bg-indigo-50 text-indigo-700'
              }, {
                title: 'Total Visits',
                value: totalVisits,
                icon: Calendar,
                className: 'bg-blue-50 text-blue-700'
              }, {
                title: 'Total Paid',
                value: formatAmount(totalPaid),
                icon: DollarSign,
                className: 'bg-green-50 text-green-700'
              }, {
                title: 'Pending Amount',
                value: formatAmount(pendingAmount),
                icon: AlertCircle,
                className: 'bg-yellow-50 text-yellow-700'
              }].map((card) => (
                <div key={card.title} className="p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg ${card.className}`}><card.icon className="w-4 h-4"/></span>
                    <p className="text-xs font-semibold text-gray-500 uppercase">{card.title}</p>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Visits</h3>
                <span className="text-xs text-gray-500">Next 10 events</span>
              </div>
              {upcomingVisits.length === 0 ? (
                <p className="mt-4 text-gray-500">No upcoming visits scheduled.</p>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100">
                  {upcomingVisits.map((visit) => (
                    <li key={visit.id} className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {formatDate(visit.next_visit_date)} - {visit.treatment_name || 'Treatment'}
                          </p>
                          <p className="text-xs text-gray-500">{visit.patient_complaints || 'No notes'}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{visit.patient_payment_type || 'N/A'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'treatments' && (
          <div className="w-full flex flex-col gap-5">

            {treatments.length === 0 ? (
              <div className="p-10 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
                <p className="text-gray-500">No treatments found for this patient.</p>
              </div>
            ) : (
              treatments.map((treatment) => {
                const visits = getVisitsForTreatment(treatment.id);
                const progress = treatmentProgress(treatment);

                const statusClass =
                  treatment.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : treatment.status === 'ongoing'
                    ? 'bg-blue-100 text-blue-700'
                    : treatment.status === 'scheduled'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700';

                return (
                  <div
                    key={treatment.id}
                    onClick={() => handleViewTreatment(treatment)}
                    className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Accent line */}
                    <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 rounded-l-2xl"></div>

                    {/* HEADER */}
                    {/* HEADER */}
                    <div className="flex justify-between items-center">

                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">
                          {treatment.type_of_treatment_name || "Untitled"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Treatment</p>
                      </div>

                      {/* RIGHT SIDE ACTIONS */}
                      <div className="flex items-center gap-2">

                        {/* ADD VISIT BUTTON 🔥 */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();   // VERY IMPORTANT (prevents card click)
                            setSelectedTreatment(treatment);
                            setTreatmentDrawerOpen(false);
                            setIsAddingVisit(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Visit
                        </button>

                        {/* STATUS */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                          {treatment.status || "N/A"}
                        </span>

                      </div>
                    </div>

                    {/* MAIN SECTION */}
                    {/* MAIN SECTION */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

                      {/* LEFT CONTENT */}
                      <div className="md:col-span-8 space-y-3">

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase">Treatment Plan</p>
                            <p className="text-sm font-medium text-gray-800">
                              {treatment.treatment_plan || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-gray-400 uppercase">Notes</p>
                            <p className="text-sm font-medium text-gray-800">
                              {treatment.treatment_notes || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* TAGS */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {treatment.cap_type && (
                            <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-700">
                              {treatment.cap_type}
                            </span>
                          )}

                          <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-50 text-blue-700">
                            {visits.length} visits
                          </span>
                        </div>
                      </div>

                      {/* RIGHT COMPACT PANEL 🔥 */}
                      <div className="md:col-span-4">

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-3">

                          <div>
                            <p className="text-[11px] text-gray-400 uppercase">Cost</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatAmount(treatment.planned_amount)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-gray-400 uppercase">Duration</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {treatment.estimated_duration_months
                                ? `${treatment.estimated_duration_months} months`
                                : "N/A"}
                            </p>
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* PROGRESS */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>

                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Filter by treatment</span>
              </div>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                onChange={(e) => {
                  const treatmentId = e.target.value;
                  if (treatmentId === 'all') {
                    setSelectedTreatment(null);
                  } else {
                    setSelectedTreatment(treatments.find((t) => String(t.id) === treatmentId));
                    setTreatmentDrawerOpen(true);
                  }
                }}
              >
                <option value="all">All Treatments</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>{t.type_of_treatment_name || `Treatment ${t.id}`}</option>
                ))}
              </select>
            </div>

            {allVisits.length === 0 ? (
              <div className="p-6 text-center bg-white border border-gray-200 rounded-lg">No visits found for this patient.</div>
            ) : (
              <div className="overflow-x-auto bg-white border border-gray-100 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Visit Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Treatment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allVisits.map((visit) => (
                      <tr key={visit.id}>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(visit.next_visit_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{visit.treatment_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{visit.treatment_notes || visit.patient_complaints || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{visit.patient_payment_amount ? formatAmount(visit.patient_payment_amount) : 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{visit.patient_payment_type || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => {
                          const related = treatments.find((t) => String(t.id) === String(visit.treatment) || String(t.id) === String(visit.treatment_id));
                          if (related) {
                            handleViewTreatment(related);
                          }
                        }}>
                          View Treatment
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {treatmentDrawerOpen && selectedTreatment && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer}></div>
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTreatment.type_of_treatment_name || 'Treatment Detail'}</h3>
                <p className="text-sm text-gray-500">Status: {selectedTreatment.status || 'N/A'}</p>
              </div>
              <button onClick={closeDrawer} className="p-2 rounded-md hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                <p className="text-sm text-gray-500">Treatment Header</p>
                <p className="text-lg font-semibold text-gray-900">{selectedTreatment.type_of_treatment_name || 'N/A'}</p>
                <p className="text-xs text-gray-600">Duration: {selectedTreatment.estimated_duration_months ? `${selectedTreatment.estimated_duration_months} months` : 'N/A'} • Cost: {formatAmount(selectedTreatment.planned_amount)}</p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700">Patient Info</p>
                <p className="text-sm text-gray-600">{patient.first_name} {patient.last_name} • {patient.mobile || 'N/A'}</p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Treatment Plan</p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{selectedTreatment.treatment_plan || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-gray-100 rounded-lg">
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-lg font-semibold text-gray-900">{formatAmount(selectedTreatment.planned_amount)}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded-lg">
                  <p className="text-xs text-gray-500">Paid Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{formatAmount(getVisitsForTreatment(selectedTreatment.id).reduce((s, v) => s + Number(v.patient_payment_amount || 0), 0))}</p>
                </div>
                <div className="p-3 border border-gray-100 rounded-lg col-span-2">
                  <p className="text-xs text-gray-500">Pending Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{formatAmount(Math.max(0, Number(selectedTreatment.planned_amount || 0) - getVisitsForTreatment(selectedTreatment.id).reduce((s, v) => s + Number(v.patient_payment_amount || 0), 0)))}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700">Progress</p>
                <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${treatmentProgress(selectedTreatment)}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{treatmentProgress(selectedTreatment)}% completed</p>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-semibold text-gray-900">Treatment Timeline</h4>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => {
                      setTreatmentDrawerOpen(false);
                      setIsAddingVisit(true);
                    }} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100"><Plus className="w-3.5 h-3.5" /> Add Visit</button>
                    <button type="button" onClick={() => alert('Upload images flow TBD')} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100"><UploadCloud className="w-3.5 h-3.5" /> Upload Images</button>
                  </div>
                </div>
                {getVisitsForTreatment(selectedTreatment.id).length === 0 ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">No visits for this treatment.</div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {getVisitsForTreatment(selectedTreatment.id).map((visit) => (
                      <li key={visit.id} className="border border-gray-100 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{formatDate(visit.next_visit_date)}</p>
                            <p className="text-xs text-gray-500">{visit.patient_complaints || 'No complaints'}</p>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{visit.patient_payment_type || 'N/A'}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p><strong>Notes:</strong> {visit.treatment_notes || 'N/A'}</p>
                          <p><strong>Paid:</strong> {visit.patient_payment_amount ? formatAmount(visit.patient_payment_amount) : 'N/A'}</p>
                          <p><strong>Payment Note:</strong> {visit.payment_note || 'N/A'}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingTreatment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Treatment</h3>
              <button
                onClick={() => setIsAddingTreatment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTreatment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Type * <span className="text-xs text-red-600">{!treatmentFormData.type_of_treatment ? '(Required)' : ''}</span></label>
                <select
                  required
                  value={treatmentFormData.type_of_treatment}
                  onChange={(e) => setTreatmentFormData({...treatmentFormData, type_of_treatment: e.target.value})}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !treatmentFormData.type_of_treatment ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Treatment Type</option>
                  {treatmentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>

                {/* conditional options based on selected type */}
                {treatmentTypes.find(type => type.id === treatmentFormData.type_of_treatment)?.name?.toLowerCase().includes('ortho') ||
                 treatmentTypes.find(type => type.id === treatmentFormData.type_of_treatment)?.name?.toLowerCase().includes('braces') && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">Braces Type</label>
                    <select
                      value={treatmentFormData.braces_type}
                      onChange={(e) => setTreatmentFormData({...treatmentFormData, braces_type: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="metal">Metal</option>
                      <option value="ceramic">Ceramic</option>
                    </select>
                  </div>
                )}
                {treatmentTypes.find(type => type.id === treatmentFormData.type_of_treatment)?.name?.toLowerCase().includes('root canal') && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700">Cap Type</label>
                    <select
                      value={treatmentFormData.cap_type}
                      onChange={(e) => setTreatmentFormData({...treatmentFormData, cap_type: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="metal">Metal</option>
                      <option value="ceramic">Ceramic</option>
                      <option value="cadcam">CAD/CAM</option>
                      <option value="zirconia">Zirconia</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status *</label>
                  <select
                    required
                    value={treatmentFormData.status}
                    onChange={(e) => setTreatmentFormData({...treatmentFormData, status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {treatmentTypes.find(type => type.id === treatmentFormData.type_of_treatment)?.name?.toLowerCase().includes('root canal')
                      ? 'Estimated Visits'
                      : 'Estimated Duration (Months)'}
                  </label>
                  <input
                    type="number"
                    value={treatmentFormData.estimated_duration_months}
                    onChange={(e) => setTreatmentFormData({...treatmentFormData, estimated_duration_months: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      treatmentTypes.find(type => type.id === treatmentFormData.type_of_treatment)?.name?.toLowerCase().includes('root canal')
                        ? 'e.g., 5'
                        : 'e.g., 3'
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={treatmentFormData.planned_amount}
                  onChange={(e) => setTreatmentFormData({...treatmentFormData, planned_amount: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Findings</label>
                <textarea
                  value={treatmentFormData.initial_findings}
                  onChange={(e) => setTreatmentFormData({...treatmentFormData, initial_findings: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe initial findings..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Plan</label>
                <textarea
                  value={treatmentFormData.treatment_plan}
                  onChange={(e) => setTreatmentFormData({...treatmentFormData, treatment_plan: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe treatment plan..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Notes</label>
                <textarea
                  value={treatmentFormData.treatment_notes}
                  onChange={(e) => setTreatmentFormData({...treatmentFormData, treatment_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingTreatment(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTreatment || !treatmentFormData.type_of_treatment}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submittingTreatment ? 'Adding...' : 'Add Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingVisit && selectedTreatment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Visit</h3>
              <button
                onClick={() => setIsAddingVisit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddVisit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Visit Date * <span className="text-xs text-red-600">{!visitFormData.next_visit_date ? '(Required)' : ''}</span></label>
                <input
                  type="date"
                  required
                  value={toISODate(visitFormData.next_visit_date)}
                  onChange={(e) => setVisitFormData({
                    ...visitFormData,
                    next_visit_date: e.target.value ? toDDMMYYYY(e.target.value) : ''
                  })}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !visitFormData.next_visit_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Notes</label>
                <textarea
                  value={visitFormData.treatment_notes}
                  onChange={(e) => setVisitFormData({...visitFormData, treatment_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add treatment notes..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Complaints</label>
                <textarea
                  value={visitFormData.patient_complaints}
                  onChange={(e) => setVisitFormData({...visitFormData, patient_complaints: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Document patient complaints..."
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={visitFormData.patient_payment_amount}
                    onChange={(e) => setVisitFormData({...visitFormData, patient_payment_amount: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                  <select
                    value={visitFormData.patient_payment_type}
                    onChange={(e) => setVisitFormData({...visitFormData, patient_payment_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Note</label>
                <textarea
                  value={visitFormData.payment_note}
                  onChange={(e) => setVisitFormData({...visitFormData, payment_note: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any payment notes..."
                  rows="2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingVisit(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVisit || !visitFormData.next_visit_date}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submittingVisit ? 'Adding...' : 'Add Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;

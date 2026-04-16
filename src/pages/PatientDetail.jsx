import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Edit,
  ArrowLeft,
  ArrowRight,
  Plus,
  Users,
  X,
  UploadCloud,
} from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { userApi } from '../api/userApi';
import { formatDate, parseDateString, toISODate, toDDMMYYYY } from '../utils/dateUtils';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientsPage = parseInt(queryParams.get('page') || 1, 10);
  const searchTerm = queryParams.get('search') || '';

  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [allVisits, setAllVisits] = useState([]);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('patient_info');

  const [loading, setLoading] = useState(true);
  const [treatmentDrawerOpen, setTreatmentDrawerOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [isEditingTreatment, setIsEditingTreatment] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);

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
  const [doctors, setDoctors] = useState([]);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientFormData, setPatientFormData] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    gender: '',
    date_of_birth: '',
    address: '',
    medical_history: '',
    dental_history: '',
    user: ''
  });
  const [submittingPatient, setSubmittingPatient] = useState(false);

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

  const openEditTreatmentModal = (treatment) => {
    setEditingTreatment(treatment);
    setIsEditingTreatment(true);
    setIsAddingTreatment(false);
    setTreatmentFormData({
      type_of_treatment: treatment.type_of_treatment ? String(treatment.type_of_treatment) : (treatment.type_of_treatment_id ? String(treatment.type_of_treatment_id) : ''),
      status: treatment.status || 'scheduled',
      estimated_duration_months: treatment.estimated_duration_months || '',
      planned_amount: treatment.planned_amount || '',
      initial_findings: treatment.initial_findings || '',
      treatment_plan: treatment.treatment_plan || '',
      treatment_notes: treatment.treatment_notes || '',
      braces_type: treatment.braces_type || '',
      cap_type: treatment.cap_type || ''
    });
  };

  const closeTreatmentModal = () => {
    setIsAddingTreatment(false);
    setIsEditingTreatment(false);
    setEditingTreatment(null);
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
  };

  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    setSubmittingTreatment(true);

    try {
      if (!treatmentFormData.type_of_treatment) {
        alert('Please select a treatment type');
        setSubmittingTreatment(false);
        return;
      }

      const payload = {
        status: treatmentFormData.status,
        estimated_duration_months: treatmentFormData.estimated_duration_months ? parseInt(treatmentFormData.estimated_duration_months, 10) : null,
        planned_amount: treatmentFormData.planned_amount ? parseFloat(treatmentFormData.planned_amount) : null,
        initial_findings: treatmentFormData.initial_findings || null,
        treatment_plan: treatmentFormData.treatment_plan || null,
        treatment_notes: treatmentFormData.treatment_notes || null,
        braces_type: treatmentFormData.braces_type || null,
        cap_type: treatmentFormData.cap_type || null
      };

      if (isEditingTreatment && editingTreatment) {
        await treatmentApi.update(editingTreatment.id, payload);
        alert('Treatment updated successfully!');
      } else {
        await treatmentApi.create({
          ...payload,
          patient: id,
          type_of_treatment: treatmentFormData.type_of_treatment
        });
        alert('Treatment added successfully!');
      }

      closeTreatmentModal();
      await loadData();
    } catch (error) {
      console.error('Error saving treatment:', error);
      alert(error.response?.data?.detail || 'Error saving treatment');
    } finally {
      setSubmittingTreatment(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await userApi.getAll();
      const doctorsData = Array.isArray(response.data)
        ? response.data
        : response.data.results ?? [];
      setDoctors(doctorsData);
      return doctorsData;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  };

  const getUserId = (user) => {
    if (user == null || user === '') return null;
    if (typeof user === 'object') return user.id ?? null;
    return String(user);
  };

  const findDoctorIdByAssignedDoctor = (assignedDoctor, doctorList = []) => {
    if (!assignedDoctor || doctorList.length === 0) return null;
    const normalizedAssignedName = assignedDoctor.replace(/^Dr\.\s*/i, '').trim().toLowerCase();
    const matchedDoctor = doctorList.find((doctor) => {
      const doctorName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim().toLowerCase();
      return doctorName === normalizedAssignedName;
    });
    return matchedDoctor?.id ?? null;
  };

  const openEditPatientModal = async () => {
    let doctorsList = doctors;
    if (doctorsList.length === 0) {
      doctorsList = await fetchDoctors();
    }

    const assignedDoctorId = getUserId(patient.user)
      ?? findDoctorIdByAssignedDoctor(patient.assigned_doctor, doctorsList);
    const defaultDoctorId = assignedDoctorId ?? (doctorsList[0]?.id ?? null);

    setPatientFormData({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      mobile: patient.mobile || '',
      gender: patient.gender || '',
      date_of_birth: patient.date_of_birth ? toISODate(patient.date_of_birth) : '',
      address: patient.address || '',
      medical_history: patient.medical_history || '',
      dental_history: patient.dental_history || '',
      user: defaultDoctorId != null ? String(defaultDoctorId) : ''
    });
    setIsEditingPatient(true);
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    setSubmittingPatient(true);

    try {
      const selectedUserId = patientFormData.user
        ? getUserId(patientFormData.user)
        : getUserId(patient?.user);

      const payload = {
        first_name: patientFormData.first_name,
        last_name: patientFormData.last_name,
        mobile: patientFormData.mobile || null,
        gender: patientFormData.gender,
        date_of_birth: patientFormData.date_of_birth || null,
        address: patientFormData.address || null,
        medical_history: patientFormData.medical_history || null,
        dental_history: patientFormData.dental_history || null,
      };

      if (selectedUserId !== null) {
        payload.user = selectedUserId;
      }

      await patientApi.update(id, payload);
      setIsEditingPatient(false);
      await loadData();
      alert('Patient updated successfully!');
    } catch (error) {
      console.error('Error updating patient:', error);
      alert(error.response?.data?.detail || 'Error updating patient');
    } finally {
      setSubmittingPatient(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientResponse, treatmentsResponse, treatmentTypesResponse] = await Promise.all([
        patientApi.getById(id),
        treatmentApi.getByPatient(id),
        treatmentApi.getTypes(),
      ]);

      const patientData = patientResponse.data;
      const treatmentsData = treatmentsResponse.data?.results || treatmentsResponse.data || [];
      const treatmentTypesData = treatmentTypesResponse.data?.results || treatmentTypesResponse.data || [];

      setPatient(patientData);
      setTreatments(treatmentsData);
      setTreatmentTypes(treatmentTypesData);

      const visitsResponse = await visitsApi.getByPatient(id, { page_size: 200 });
      const visitsFlattened = visitsResponse.data?.results || visitsResponse.data || [];
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
    setActiveTab(tab === 'treatments' || tab === 'visits' || tab === 'patient_info' ? tab : 'patient_info');
    loadData();
    fetchDoctors();
  }, [id]);

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

  const getTreatmentPaymentTotals = (treatment) => {
    const visits = getVisitsForTreatment(treatment.id);
    const totalAmount = Number(treatment.planned_amount || 0);
    const paidAmount = visits.reduce((sum, visit) => sum + Number(visit.patient_payment_amount || 0), 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    return { totalAmount, paidAmount, remainingAmount };
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

  const calculateTotals = () => {
    const totalTreatments = treatments.length;
    const totalVisits = allVisits.length;
    const totalPaid = allVisits.reduce(
      (sum, visit) => sum + Number(visit.patient_payment_amount || 0),
      0
    );
    const totalAmount = treatments.reduce(
      (sum, treatment) => sum + Number(treatment.planned_amount || 0),
      0
    );
    const pendingAmount = Math.max(0, totalAmount - totalPaid);

    return { totalTreatments, totalVisits, totalPaid, pendingAmount };
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 px-4 lg:px-0">
        <Link
          to={`/app/patients${
            searchTerm || patientsPage > 1
              ? `?${new URLSearchParams({
                  ...(searchTerm && { search: searchTerm }),
                  ...(patientsPage > 1 && { page: patientsPage })
                }).toString()}`
              : ''
          }`}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all patients
        </Link>
        
      </div>

      <div className="px-4 lg:px-0">
        <main className="space-y-6">
          <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Patient</p>
                <h1 className="text-xl font-bold text-gray-900">{patient.first_name} {patient.last_name}</h1>
                <p className="mt-1 text-sm text-gray-600">{patient.mobile || 'N/A'}</p>
              </div>
              <button
                onClick={() => {
                  closeTreatmentModal();
                  setIsAddingTreatment(true);
                }}
                className="w-full md:w-auto rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/50 hover:from-blue-700 hover:to-sky-700 transition"
              >
                <Plus className="inline w-4 h-4 mr-2" />
                Add Treatment
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-gray-150 p-5 shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-4">
              {['patient_info', 'treatments', 'visits'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'patient_info' ? 'Patient Info' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'patient_info' && (
            <section className="rounded-[20px] border border-gray-200 bg-white shadow-sm p-5" aria-labelledby="patient-info-heading">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p id="patient-info-heading" className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Patient Info</p>
                    <h2 className="text-lg font-bold text-gray-900">{patient.first_name} {patient.last_name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={openEditPatientModal}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Patient
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-3 border border-blue-100">
                    <p className="text-[10px] uppercase tracking-widest text-blue-600 font-semibold">Phone</p>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">{patient.mobile || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-3 border border-purple-100">
                    <p className="text-[10px] uppercase tracking-widest text-purple-600 font-semibold">Gender</p>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">{patient.gender || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 border border-emerald-100 col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">Doctor</p>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">
                      {patient.assigned_doctor ||
                        (patient.user && `${patient.user.first_name || ''} ${patient.user.last_name || ''}`.trim()) ||
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-gray-200 p-4 space-y-3">
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Born</p>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">{formatDate(patient.date_of_birth) || 'N/A'}</p>
                  </div>
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Location</p>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">{patient.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-2">Clinical Overview</p>
                    <div className="space-y-2">
                      <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Medical History</p>
                        <p className="mt-1 text-xs text-gray-700">{patient.medical_history || 'No history'}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Dental History</p>
                        <p className="mt-1 text-xs text-gray-700">{patient.dental_history || 'No history'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div>
            {activeTab === 'treatments' && (
              <div className="space-y-5">
                {treatments.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <p className="text-gray-500">No treatments found for this patient.</p>
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm max-h-[calc(100vh-300px)] overflow-y-auto">
                    <div className="space-y-3">
                      {treatments.map((treatment) => {
                        const visits = getVisitsForTreatment(treatment.id);
                        const progress = treatmentProgress(treatment);
                        const { totalAmount, paidAmount, remainingAmount } = getTreatmentPaymentTotals(treatment);

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
                            <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 rounded-l-2xl"></div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <div>
                                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                                  {treatment.type_of_treatment_name || 'Untitled'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Treatment</p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${statusClass}`}>
                                  {treatment.status || 'N/A'}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditTreatmentModal(treatment);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition active:scale-95"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTreatment(treatment);
                                    setTreatmentDrawerOpen(false);
                                    setIsAddingVisit(true);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  Visit
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewTreatment(treatment);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center rounded-full border border-blue-200 bg-white p-2 text-blue-600 shadow-sm transition hover:bg-blue-50"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                              <div className="md:col-span-8 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[11px] text-gray-400 uppercase">Treatment Plan</p>
                                    <p className="text-sm font-medium text-gray-800">
                                      {treatment.treatment_plan || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-gray-400 uppercase">Notes</p>
                                    <p className="text-sm font-medium text-gray-800">
                                      {treatment.treatment_notes || 'N/A'}
                                    </p>
                                  </div>
                                </div>

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

                              <div className="md:col-span-4">
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-3">
                                  <div>
                                    <p className="text-[11px] text-gray-400 uppercase">Total Amount</p>
                                    <p className="text-lg font-bold text-gray-900">
                                      {formatAmount(totalAmount)}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-lg bg-white border border-gray-100 p-3">
                                      <p className="text-[11px] text-gray-400 uppercase">Paid</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatAmount(paidAmount)}
                                      </p>
                                    </div>
                                    <div className="rounded-lg bg-white border border-gray-100 p-3 col-span-2">
                                      <p className="text-[11px] text-gray-400 uppercase">Remaining</p>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {formatAmount(remainingAmount)}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-gray-400 uppercase">Duration</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {treatment.estimated_duration_months
                                        ? `${treatment.estimated_duration_months} months`
                                        : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

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
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="space-y-3 px-1">
                {allVisits.length === 0 ? (
                  <div className="p-6 text-center bg-white border border-gray-200 rounded-lg">No visits found for this patient.</div>
                ) : (
                  <div className="space-y-3">
                    {allVisits.map((visit) => (
                      <div
                        key={visit.id}
                        onClick={() => {
                          const related = treatments.find(
                            (t) =>
                              String(t.id) === String(visit.treatment) ||
                              String(t.id) === String(visit.treatment_id)
                          );
                          if (related) handleViewTreatment(related);
                        }}
                        className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:bg-blue-50/30"
                      >
                        <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition" />
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition">
                              {visit.treatment_name || 'Treatment'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {formatDate(visit.next_visit_date)}
                            </p>
                          </div>
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {visit.patient_payment_type || 'N/A'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {visit.treatment_notes || visit.patient_complaints || 'No notes'}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-green-600">
                            {visit.patient_payment_amount
                              ? formatAmount(visit.patient_payment_amount)
                              : 'No Payment'}
                          </p>
                          <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
                            View →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {isEditingPatient && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsEditingPatient(false)} />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Edit Patient</h3>
                  <p className="text-sm text-gray-500">Update patient details and assigned doctor</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPatient(false)}
                  className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditPatient} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      required
                      value={patientFormData.first_name}
                      onChange={(e) => setPatientFormData({ ...patientFormData, first_name: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      required
                      value={patientFormData.last_name}
                      onChange={(e) => setPatientFormData({ ...patientFormData, last_name: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile</label>
                    <input
                      value={patientFormData.mobile}
                      onChange={(e) => setPatientFormData({ ...patientFormData, mobile: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      required
                      value={patientFormData.gender}
                      onChange={(e) => setPatientFormData({ ...patientFormData, gender: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={patientFormData.date_of_birth}
                      onChange={(e) => setPatientFormData({ ...patientFormData, date_of_birth: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Doctor</label>
                    <select
                      required
                      value={patientFormData.user}
                      onChange={(e) => setPatientFormData({ ...patientFormData, user: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select doctor</option>
                      {doctors.length > 0 ? (
                        doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.first_name} {doctor.last_name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No doctors available</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={patientFormData.address}
                    onChange={(e) => setPatientFormData({ ...patientFormData, address: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medical History</label>
                    <textarea
                      value={patientFormData.medical_history}
                      onChange={(e) => setPatientFormData({ ...patientFormData, medical_history: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dental History</label>
                    <textarea
                      value={patientFormData.dental_history}
                      onChange={(e) => setPatientFormData({ ...patientFormData, dental_history: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingPatient(false)}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPatient}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submittingPatient ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
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

      {(isAddingTreatment || isEditingTreatment) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{isEditingTreatment ? 'Edit Treatment' : 'Add New Treatment'}</h3>
              <button
                onClick={closeTreatmentModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveTreatment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Type * <span className="text-xs text-red-600">{!treatmentFormData.type_of_treatment ? '(Required)' : ''}</span></label>
                {isEditingTreatment ? (
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 py-2 px-3 text-gray-700">
                    {treatmentTypes.find(type => String(type.id) === String(treatmentFormData.type_of_treatment))?.name || 'Unknown'}
                  </div>
                ) : (
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
                )}

                {/* conditional options based on selected type */}

                {/* conditional options based on selected type */}
                {treatmentTypes.find(type => String(type.id) === String(treatmentFormData.type_of_treatment))?.name?.toLowerCase().includes('ortho') ||
                 treatmentTypes.find(type => String(type.id) === String(treatmentFormData.type_of_treatment))?.name?.toLowerCase().includes('braces') && (
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
                {treatmentTypes.find(type => String(type.id) === String(treatmentFormData.type_of_treatment))?.name?.toLowerCase().includes('root canal') && (
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
                    {treatmentTypes.find(type => String(type.id) === String(treatmentFormData.type_of_treatment))?.name?.toLowerCase().includes('root canal')
                      ? 'Estimated Visits'
                      : 'Estimated Duration (Months)'}
                  </label>
                  <input
                    type="number"
                    value={treatmentFormData.estimated_duration_months}
                    onChange={(e) => setTreatmentFormData({...treatmentFormData, estimated_duration_months: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      treatmentTypes.find(type => String(type.id) === String(treatmentFormData.type_of_treatment))?.name?.toLowerCase().includes('root canal')
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
                  onClick={closeTreatmentModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTreatment || !treatmentFormData.type_of_treatment}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submittingTreatment ? (isEditingTreatment ? 'Saving...' : 'Adding...') : (isEditingTreatment ? 'Update Treatment' : 'Add Treatment')}
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

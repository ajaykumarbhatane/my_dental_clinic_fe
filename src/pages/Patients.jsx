import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Phone, X } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { clinicApi } from '../api/clinicApi';
import { userApi } from '../api/userApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/dateUtils';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add Patient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');
  const [formData, setFormData] = useState({
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
  const [treatmentFormData, setTreatmentFormData] = useState({
    type_of_treatment: '',
    status: 'scheduled',
    estimated_duration_months: '',
    planned_amount: '',
    initial_findings: '',
    treatment_plan: '',
    treatment_notes: ''
  });
  const [visitFormData, setVisitFormData] = useState({
    next_visit_date: '',
    treatment_notes: '',
    patient_complaints: '',
    patient_payment_amount: '',
    patient_payment_type: 'cash',
    payment_note: ''
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchPatients(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage]);

  // Fetch clinics, doctors, and treatment types when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchClinics();
      fetchDoctors();
      fetchTreatmentTypes();
      setCurrentStep(1);
      setStepError('');
    }
  }, [showAddModal]);

  const fetchPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = { page };
      if (search) params.search = search;

      const res = await patientApi.getAll(params);

      setPatients(res.data.results || res.data);
      setTotalCount(res.data.count || res.data.length);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 10));
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinics for dropdown
  const fetchClinics = async () => {
    try {
      const response = await clinicApi.getAll();
      setClinics(normalizeListResponse(response.data));
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  // Normalize API list responses
  const normalizeListResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    return [];
  };

  const serializePayload = (payload) => {
    return Object.entries(payload).reduce((acc, [key, value]) => {
      if (value === '' || value === undefined) return acc;
      acc[key] = value;
      return acc;
    }, {});
  };

  const extractErrorMessage = (error) => {
    const data = error?.response?.data;
    if (!data) return error?.message || 'Unknown error';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.join(', ');
    return Object.entries(data)
      .map(([field, value]) => {
        const message = Array.isArray(value) ? value.join(', ') : value;
        return `${field}: ${message}`;
      })
      .join(' | ');
  };

  // Fetch doctors for dropdown
  const fetchDoctors = async () => {
    try {
      const response = await userApi.getAll();
      setDoctors(normalizeListResponse(response.data));
      if (user) {
        setFormData(prev => ({ ...prev, user: user.id }));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // Fetch treatment types for step 2
  const fetchTreatmentTypes = async () => {
    try {
      const response = await treatmentApi.getTypes();
      setTreatmentTypes(normalizeListResponse(response.data));
    } catch (error) {
      console.error('Error fetching treatment types:', error);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setStepError('');
    setFormData({
      first_name: '',
      last_name: '',
      mobile: '',
      gender: '',
      date_of_birth: '',
      address: '',
      medical_history: '',
      dental_history: '',
      user: user ? user.id : ''
    });
    setTreatmentFormData({
      type_of_treatment: '',
      status: 'scheduled',
      estimated_duration_months: '',
      planned_amount: '',
      initial_findings: '',
      treatment_plan: '',
      treatment_notes: ''
    });
    setVisitFormData({
      next_visit_date: '',
      treatment_notes: '',
      patient_complaints: '',
      patient_payment_amount: '',
      patient_payment_type: 'cash',
      payment_note: ''
    });
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.gender || !formData.user) {
        return 'Please complete all required patient fields and doctor selection.';
      }
    }
    if (step === 2) {
      if (!treatmentFormData.type_of_treatment) {
        return 'Please select a treatment type to continue.';
      }
    }
    if (step === 3) {
      if (!visitFormData.next_visit_date) {
        return 'Please select the initial visit date.';
      }
    }
    return '';
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError('');
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setStepError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      handleNext();
      return;
    }

    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }

    setIsSubmitting(true);

    try {
      const patientPayload = serializePayload({
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile: formData.mobile,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        medical_history: formData.medical_history,
        dental_history: formData.dental_history,
        user: formData.user
      });

      const patientResponse = await patientApi.create(patientPayload);
      const patientId = patientResponse.data.id;

      const treatmentPayload = {
        patient: patientId,
        type_of_treatment: treatmentFormData.type_of_treatment,
        status: treatmentFormData.status,
        estimated_duration_months: treatmentFormData.estimated_duration_months || null,
        planned_amount: treatmentFormData.planned_amount || null,
        initial_findings: treatmentFormData.initial_findings,
        treatment_plan: treatmentFormData.treatment_plan,
        treatment_notes: treatmentFormData.treatment_notes
      };

      const treatmentResponse = await treatmentApi.create(serializePayload(treatmentPayload));
      const treatmentId = treatmentResponse.data.id;

      const visitPayload = serializePayload({
        treatment: treatmentId,
        next_visit_date: visitFormData.next_visit_date,
        treatment_notes: visitFormData.treatment_notes,
        patient_complaints: visitFormData.patient_complaints,
        patient_payment_amount: visitFormData.patient_payment_amount || null,
        patient_payment_type: visitFormData.patient_payment_type,
        payment_note: visitFormData.payment_note
      });

      await visitsApi.create(visitPayload);

      resetModal();
      setShowAddModal(false);
      fetchPatients(currentPage, searchTerm);
    } catch (error) {
      console.error('Error creating patient/treatment/visit:', error);
      const message = extractErrorMessage(error);
      setStepError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTreatmentChange = (e) => {
    const { name, value } = e.target;
    setTreatmentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVisitChange = (e) => {
    const { name, value } = e.target;
    setVisitFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ DELETE FUNCTION
  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeletingPatient(true);

    try {
      await patientApi.delete(patientToDelete.id);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      fetchPatients(currentPage, searchTerm);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete patient");
    } finally {
      setIsDeletingPatient(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPatientToDelete(null);
  };

  // if (loading) {
  //   return <div className="flex justify-center items-center h-40">Loading...</div>;
  // }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow hover:shadow-lg transition-shadow"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* 🔥 FULL WIDTH SEARCH + HEADER */}
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

  {/* LEFT: Search */}
  <div className="relative w-full">
    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

    <input
      type="text"
      placeholder="Search patients by name or mobile..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-12 pr-10 py-3 text-sm border-2 border-gray-200 rounded-xl
                 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                 transition-all duration-200 shadow-sm"
    />

    {/* ❌ Clear Button */}
    {searchTerm && (
      <button
        onClick={() => setSearchTerm('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
      >
        ✕
      </button>
    )}
  </div>

</div>

      {/* Table Container */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full">

            {/* Header */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-sm text-gray-600">
                <th className="px-5 py-3 text-left font-semibold">Patient</th>
                <th className="px-5 py-3 text-left font-semibold">Mobile</th>
                <th className="px-5 py-3 text-left font-semibold">Doctor</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-400">
                    No patients found
                  </td>
                </tr>
                ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => navigate(`${patient.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition"
                >

                  {/* Patient */}
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">
                      {patient.first_name} <br /> {patient.last_name}
                    </span>
                  </td>

                  {/* Mobile */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {patient.mobile && (
                        <a
                          href={`tel:${patient.mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <span className="text-gray-600">
                        {patient.mobile || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Doctor */}
                  <td className="px-5 py-3 text-gray-600">
                    {patient.assigned_doctor || 'N/A'}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(patient.created_at)}
                  </td>

                  {/* Actions */}
                  <td
                    className="px-5 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-3">

                      <Eye className="w-4 h-4 text-blue-600 cursor-pointer" />

                      <Edit className="w-4 h-4 text-yellow-600 cursor-pointer" />

                      <Trash2
                        className="w-4 h-4 text-red-600 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(patient);
                        }}
                      />

                    </div>
                  </td>

                </tr>
                      )
                
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemCountText={`${((currentPage - 1) * 10) + 1} - ${Math.min(currentPage * 10, totalCount)} of ${totalCount}`}
            />
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Step {currentStep}: {currentStep === 1 ? 'Patient Information' : currentStep === 2 ? 'Treatment Details' : 'Initial Visit'}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {currentStep === 1
                    ? 'Fill in the patient information'
                    : currentStep === 2
                      ? 'Add treatment details'
                      : 'Schedule the initial visit'}
                </p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetModal(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-3 gap-3 items-center">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center text-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {step}
                    </div>
                    <span className="text-xs text-gray-500">
                      {step === 1 ? 'Patient' : step === 2 ? 'Treatment' : 'Visit'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                />
              </div>
            </div>

            {stepError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {stepError}
              </div>
            )}

            <form onSubmit={handleAddPatient} className="space-y-4">
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Selection *</label>
                    <select
                      name="user"
                      value={formData.user}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter patient first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter patient last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter patient mobile"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter patient address"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                    <textarea
                      name="medical_history"
                      value={formData.medical_history}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter medical history"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dental History</label>
                    <textarea
                      name="dental_history"
                      value={formData.dental_history}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter dental history"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Type *</label>
                    <select
                      name="type_of_treatment"
                      value={treatmentFormData.type_of_treatment}
                      onChange={handleTreatmentChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Treatment Type</option>
                      {treatmentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      name="status"
                      value={treatmentFormData.status}
                      onChange={handleTreatmentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (Months)</label>
                    <input
                      type="number"
                      name="estimated_duration_months"
                      value={treatmentFormData.estimated_duration_months}
                      onChange={handleTreatmentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned Amount (₹)</label>
                    <input
                      type="number"
                      name="planned_amount"
                      value={treatmentFormData.planned_amount}
                      onChange={handleTreatmentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Findings</label>
                    <textarea
                      name="initial_findings"
                      value={treatmentFormData.initial_findings}
                      onChange={handleTreatmentChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe initial findings..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
                    <textarea
                      name="treatment_plan"
                      value={treatmentFormData.treatment_plan}
                      onChange={handleTreatmentChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe treatment plan..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Notes</label>
                    <textarea
                      name="treatment_notes"
                      value={treatmentFormData.treatment_notes}
                      onChange={handleTreatmentChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Visit Date *</label>
                    <input
                      type="date"
                      name="next_visit_date"
                      value={visitFormData.next_visit_date}
                      onChange={handleVisitChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Notes</label>
                    <textarea
                      name="treatment_notes"
                      value={visitFormData.treatment_notes}
                      onChange={handleVisitChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add treatment notes..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient Complaints</label>
                    <textarea
                      name="patient_complaints"
                      value={visitFormData.patient_complaints}
                      onChange={handleVisitChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Document patient complaints..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹)</label>
                    <input
                      type="number"
                      name="patient_payment_amount"
                      value={visitFormData.patient_payment_amount}
                      onChange={handleVisitChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                    <select
                      name="patient_payment_type"
                      value={visitFormData.patient_payment_type}
                      onChange={handleVisitChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Note</label>
                    <textarea
                      name="payment_note"
                      value={visitFormData.payment_note}
                      onChange={handleVisitChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any payment notes..."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1) {
                      setShowAddModal(false);
                      resetModal();
                    } else {
                      handlePrevious();
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  {currentStep === 1 ? 'Cancel' : 'Previous'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : currentStep < 3
                      ? 'Next'
                      : 'Create Patient, Treatment & Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {showDeleteModal && patientToDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-red-900">Delete Patient</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Are you sure you want to delete <span className="font-medium text-gray-900">{patientToDelete.first_name} {patientToDelete.last_name}</span>?
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              This will permanently remove the patient and all associated treatments, visits, and records. This action cannot be undone.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingPatient}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingPatient ? 'Deleting...' : 'Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
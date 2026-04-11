import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { userApi } from '../api/userApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { formatDate, toISODate, toDDMMYYYY } from '../utils/dateUtils';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
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
  const [visitFormData, setVisitFormData] = useState({
    next_visit_date: '',
    treatment_notes: '',
    patient_complaints: '',
    patient_payment_amount: '',
    patient_payment_type: 'cash',
    payment_note: ''
  });
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
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPatients(currentPage, searchTerm);
  }, [currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchPatients(1, searchTerm);
      } else {
        fetchPatients(1, '');
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchDoctors();
    fetchTreatmentTypes();
  }, []);

  const fetchPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = { page };
      if (search) {
        params.search = search;
      }
      const response = await patientApi.getAll(params);
      setPatients(response.data.results || response.data);
      setTotalCount(response.data.count || response.data.length);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / 10));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await userApi.getAll();
      const doctorsData = Array.isArray(response.data)
        ? response.data
        : response.data.results ?? [];
      setDoctors(doctorsData);
      // Auto-select current user if available
      if (user) {
        setFormData(prev => ({...prev, user: user.id}));
      } else if (doctorsData.length > 0) {
        setFormData(prev => ({...prev, user: doctorsData[0].id}));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchTreatmentTypes = async () => {
    try {
      const response = await treatmentApi.getTypes();
      const treatmentTypesData = response.data?.results || response.data || [];
      setTreatmentTypes(Array.isArray(treatmentTypesData) ? treatmentTypesData : []);
    } catch (error) {
      console.error('Error fetching treatment types:', error);
    }
  };

  const selectedType = Array.isArray(treatmentTypes)
    ? treatmentTypes.find(t => t.id === treatmentFormData.type_of_treatment)
    : null;
  const selectedTypeName = selectedType ? selectedType.name : '';

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate all steps
    if (!formData.first_name || !formData.last_name || !formData.gender) {
      alert('Please fill in all required patient fields');
      setSubmitting(false);
      setCurrentStep(1);
      return;
    }
    if (!treatmentFormData.type_of_treatment) {
      alert('Please select a treatment type');
      setSubmitting(false);
      setCurrentStep(2);
      return;
    }
    if (!visitFormData.next_visit_date) {
      alert('Please select a next visit date');
      setSubmitting(false);
      setCurrentStep(3);
      return;
    }

    try {
      // Step 1: Create patient
      const patientPayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile: formData.mobile || null,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth ? toISODate(formData.date_of_birth) : null,
        address: formData.address || null,
        medical_history: formData.medical_history || null,
        dental_history: formData.dental_history || null,
        user: formData.user || null
      };

      const patientResponse = await patientApi.create(patientPayload);
      const patientId = patientResponse.data.id;

      // Step 2: Create treatment
      const treatmentPayload = {
        patient: patientId,
        type_of_treatment: treatmentFormData.type_of_treatment,
        status: treatmentFormData.status,
        estimated_duration_months: treatmentFormData.estimated_duration_months || null,
        planned_amount: treatmentFormData.planned_amount || null,
        initial_findings: treatmentFormData.initial_findings || null,
        treatment_plan: treatmentFormData.treatment_plan || null,
        treatment_notes: treatmentFormData.treatment_notes || null,
        braces_type: treatmentFormData.braces_type || null,
        cap_type: treatmentFormData.cap_type || null
      };

      const treatmentResponse = await treatmentApi.create(treatmentPayload);
      const treatmentId = treatmentResponse.data.id;

      // Step 3: Create visit
      const visitPayload = {
        treatment: treatmentId,
        next_visit_date: visitFormData.next_visit_date ? toISODate(visitFormData.next_visit_date) : null,
        treatment_notes: visitFormData.treatment_notes || null,
        patient_complaints: visitFormData.patient_complaints || null,
        patient_payment_amount: visitFormData.patient_payment_amount || null,
        patient_payment_type: visitFormData.patient_payment_type,
        payment_note: visitFormData.payment_note || null
      };

      await visitsApi.create(visitPayload);

      // Reset modal and forms
      setShowAddModal(false);
      setCurrentStep(1);
      setFormData({
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
      setVisitFormData({
        next_visit_date: '',
        treatment_notes: '',
        patient_complaints: '',
        patient_payment_amount: '',
        patient_payment_type: 'cash',
        payment_note: ''
      });
      fetchPatients(); // Refresh the list
      alert('Patient, treatment, and visit created successfully!');
    } catch (error) {
      console.error('Error creating patient/treatment/visit:', error);
      alert(error.response?.data?.detail || 'Error creating patient/treatment/visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.first_name || !formData.last_name || !formData.gender) {
        alert('Please fill in all required fields: First Name, Last Name, and Gender');
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (!treatmentFormData.type_of_treatment) {
        alert('Please select a treatment type');
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await patientApi.delete(patientToDelete.id);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      alert(`Patient ${patientToDelete.first_name} ${patientToDelete.last_name} deleted successfully`);
      fetchPatients(currentPage); // Refresh the list
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert(error.response?.data?.detail || 'Error deleting patient');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and view all patient records</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setCurrentStep(1);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white min-w-0">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            className="flex-1 min-w-0 form-select text-sm font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Patient Records</h2>
              <p className="text-sm text-gray-500 mt-1">Browse records while search, filters and pagination remain fixed.</p>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-28rem)] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Assigned Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-gray-500 font-medium">No patients found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => navigate(`${patient.id}`)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          📱 {patient.mobile}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                          {patient.gender || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(patient.date_of_birth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {patient.assigned_doctor || (patient.user && (patient.user.first_name || patient.user.last_name) ? `Dr. ${patient.user.first_name || ''} ${patient.user.last_name || ''}`.trim() : 'N/A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {formatDate(patient.created_at)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-2">
                          <Link
                            to={`${patient.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(patient)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemCountText={`Showing ${((currentPage - 1) * 10) + 1} to ${Math.min(currentPage * 10, totalCount)} of ${totalCount} patients`}
            />
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {currentStep === 1 && 'Step 1: Patient Information'}
                  {currentStep === 2 && 'Step 2: Treatment Details'}
                  {currentStep === 3 && 'Step 3: Initial Visit'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {currentStep === 1 && 'Fill in the patient information'}
                  {currentStep === 2 && 'Add treatment details'}
                  {currentStep === 3 && 'Schedule the initial visit'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <div className={`flex-1 h-1 ${
                  currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddPatient} className="p-6 space-y-5">
              {currentStep === 1 && (
                <>
                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Doctor Selection</label>
                    <select
                      value={formData.user}
                      onChange={(e) => setFormData({...formData, user: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    >
                      <option value="">Optional - Select Doctor</option>
                      {(Array.isArray(doctors) ? doctors : []).map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Patient Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Enter patient first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Enter patient last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Mobile</label>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Gender *</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={toISODate(formData.date_of_birth)}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value ? toDDMMYYYY(e.target.value) : ''})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                    <textarea
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Enter patient address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Medical History</label>
                    <textarea
                      rows={3}
                      value={formData.medical_history}
                      onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Enter medical history"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Dental History</label>
                    <textarea
                      rows={3}
                      value={formData.dental_history}
                      onChange={(e) => setFormData({...formData, dental_history: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Enter dental history"
                    />
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Treatment Type *</label>
                      <select
                        required
                        value={treatmentFormData.type_of_treatment}
                        onChange={(e) => setTreatmentFormData({...treatmentFormData, type_of_treatment: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      >
                        <option value="">Select Treatment Type</option>
                        {treatmentTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                      <select
                        value={treatmentFormData.status}
                        onChange={(e) => setTreatmentFormData({...treatmentFormData, status: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional fields based on treatment type */}
                  {(selectedTypeName.toLowerCase().includes('ortho') || selectedTypeName.toLowerCase().includes('braces')) && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Braces Type</label>
                      <select
                        value={treatmentFormData.braces_type}
                        onChange={(e) => setTreatmentFormData({...treatmentFormData, braces_type: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      >
                        <option value="">Select Type</option>
                        <option value="metal">Metal</option>
                        <option value="ceramic">Ceramic</option>
                      </select>
                    </div>
                  )}

                  {selectedTypeName.toLowerCase().includes('root canal') && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Cap Type</label>
                      <select
                        value={treatmentFormData.cap_type}
                        onChange={(e) => setTreatmentFormData({...treatmentFormData, cap_type: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {selectedTypeName.toLowerCase().includes('root canal')
                          ? 'Estimated Visits'
                          : 'Estimated Duration (Months)'}
                      </label>
                      <input
                        type="number"
                        value={treatmentFormData.estimated_duration_months}
                        onChange={(e) => setTreatmentFormData({...treatmentFormData, estimated_duration_months: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder={
                          selectedTypeName.toLowerCase().includes('root canal')
                            ? 'e.g., 5'
                            : 'e.g., 3'
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Planned Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={treatmentFormData.planned_amount}
                        onChange={(e) => setTreatmentFormData({...treatmentFormData, planned_amount: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="e.g., 5000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Initial Findings</label>
                    <textarea
                      rows={3}
                      value={treatmentFormData.initial_findings}
                      onChange={(e) => setTreatmentFormData({...treatmentFormData, initial_findings: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Describe initial findings..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Treatment Plan</label>
                    <textarea
                      rows={3}
                      value={treatmentFormData.treatment_plan}
                      onChange={(e) => setTreatmentFormData({...treatmentFormData, treatment_plan: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Describe treatment plan..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Treatment Notes</label>
                    <textarea
                      rows={3}
                      value={treatmentFormData.treatment_notes}
                      onChange={(e) => setTreatmentFormData({...treatmentFormData, treatment_notes: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Next Visit Date *</label>
                    <input
                      type="date"
                      required
                      value={toISODate(visitFormData.next_visit_date)}
                      onChange={(e) => setVisitFormData({
                        ...visitFormData,
                        next_visit_date: e.target.value ? toDDMMYYYY(e.target.value) : ''
                      })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Treatment Notes</label>
                    <textarea
                      rows={3}
                      value={visitFormData.treatment_notes}
                      onChange={(e) => setVisitFormData({...visitFormData, treatment_notes: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Add treatment notes..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Patient Complaints</label>
                    <textarea
                      rows={3}
                      value={visitFormData.patient_complaints}
                      onChange={(e) => setVisitFormData({...visitFormData, patient_complaints: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Document patient complaints..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Payment Amount (₹)</label>
                      <input
                        type="number"
                        value={visitFormData.patient_payment_amount}
                        onChange={(e) => setVisitFormData({...visitFormData, patient_payment_amount: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="e.g., 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Payment Type</label>
                      <select
                        value={visitFormData.patient_payment_type}
                        onChange={(e) => setVisitFormData({...visitFormData, patient_payment_type: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Payment Note</label>
                    <textarea
                      rows={2}
                      value={visitFormData.payment_note}
                      onChange={(e) => setVisitFormData({...visitFormData, payment_note: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                      placeholder="Add any payment notes..."
                    />
                  </div>
                </>
              )}

              {/* Modal Footer */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {submitting ? 'Creating...' : 'Create Patient, Treatment & Visit'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {showDeleteModal && patientToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 px-6 py-4">
              <h3 className="text-xl font-bold text-red-900">Delete Patient</h3>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-center text-gray-600 mb-2">
                Are you sure you want to delete <span className="font-bold text-gray-900">{patientToDelete.first_name} {patientToDelete.last_name}</span>?
              </p>
              <p className="text-center text-sm text-red-600 font-semibold mb-4">
                ⚠️ This action will also delete all associated treatments, visits, and images. This cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPatientToDelete(null);
                }}
                disabled={isDeleting}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
              >
                {isDeleting ? 'Deleting...' : 'Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
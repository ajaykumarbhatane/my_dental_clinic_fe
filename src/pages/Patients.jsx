import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Phone, X } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { clinicApi } from '../api/clinicApi';
import { userApi } from '../api/userApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/dateUtils';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [treatmentFilter, setTreatmentFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [filterDoctors, setFilterDoctors] = useState([]);
  const [filterTreatments, setFilterTreatments] = useState([]);

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

  // Prescription State
  const [prescriptionFormData, setPrescriptionFormData] = useState({
    treatment: '',
    complaints: '',
    diagnosis: '',
    instructions: '',
    next_visit_date: '',
    x_ray: false,
  });
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [clinicMedicines, setClinicMedicines] = useState([]);
  const [itemSearchOpenId, setItemSearchOpenId] = useState(null);
  const [createdPatientId, setCreatedPatientId] = useState(null);
  const [createdTreatmentId, setCreatedTreatmentId] = useState(null);
  const dropdownRef = useRef(null);
  const newItemRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();

  // Normalize API list responses
  const normalizeListResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    return [];
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page') || '1', 10);
    const search = params.get('search') || '';
    const treatment = params.get('treatment') || '';
    const doctor = params.get('doctor') || '';

    if (!Number.isNaN(page) && page > 0) {
      setCurrentPage(page);
    }

    if (search !== searchTerm) {
      setSearchTerm(search);
    }

    if (search !== debouncedSearchTerm) {
      setDebouncedSearchTerm(search);
    }

    if (treatment !== treatmentFilter) {
      setTreatmentFilter(treatment);
    }

    if (doctor !== doctorFilter) {
      setDoctorFilter(doctor);
    }
  }, [location.search]);

  useEffect(() => {
    fetchPatients(currentPage, debouncedSearchTerm, treatmentFilter, doctorFilter);
  }, [currentPage, debouncedSearchTerm, treatmentFilter, doctorFilter]);

  

useEffect(() => {
  if (isFirstLoad) {
    setIsFirstLoad(false);
    return;
  }

  const timer = setTimeout(() => {
    const params = new URLSearchParams(location.search);

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    } else {
      params.delete('search');
    }

    params.delete('page');

    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true }
    );

    setDebouncedSearchTerm(searchTerm);
  }, 400);

  return () => clearTimeout(timer);
}, [searchTerm]);

  // Load filter options (doctors and treatment types)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [doctorsRes, treatmentsRes] = await Promise.all([
          userApi.getAll(),
          treatmentApi.getTypes()
        ]);
        setFilterDoctors(normalizeListResponse(doctorsRes.data));
        setFilterTreatments(normalizeListResponse(treatmentsRes.data));
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch clinics, doctors, and treatment types when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchClinics();
      fetchDoctors();
      fetchTreatmentTypes();
      fetchClinicMedicines();
      setCurrentStep(1);
      setStepError('');
    }
  }, [showAddModal]);

  const fetchPatients = async (page = 1, search = '', treatment = '', doctor = '') => {
    try {
      setLoading(true);
      const params = {};
      if (page > 1) params.page = page;
      if (search) params.search = search;
      if (treatment) params.type_of_treatment = treatment;
      if (doctor) params.user = doctor;

      const res = await patientApi.getAll(params);

      setPatients(res.data.results || res.data);
      setTotalCount(res.data.count || res.data.length);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 10));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(location.search);
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  };

  const handleFilterChange = (filterType, value) => {
  const params = new URLSearchParams(location.search);

  if (value) {
    params.set(filterType, value);
  } else {
    params.delete(filterType);
  }

  params.delete('page');

  navigate(
    {
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : '',
    },
    { replace: true }
  );
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

  const serializePayload = (payload) => {
    return Object.entries(payload).reduce((acc, [key, value]) => {
      if (value === '' || value === undefined) return acc;
      acc[key] = value;
      return acc;
    }, {});
  };

  const extractErrorMessage = (error) => {
    const data = error?.response?.data || error;
    if (!data) return 'Unknown error';
    if (typeof data === 'string') return data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
    if (Array.isArray(data)) return data.join(', ');
    if (typeof data === 'object') {
      const nested = data.error || data.detail || data;
      if (typeof nested === 'string') return nested;
      if (nested?.message) return nested.message;
      return Object.entries(nested)
        .map(([field, value]) => {
          if (Array.isArray(value)) return `${field}: ${value.join(', ')}`;
          if (typeof value === 'object') return `${field}: ${JSON.stringify(value)}`;
          return `${field}: ${value}`;
        })
        .join(' | ');
    }
    return String(data);
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
    setPrescriptionFormData({
      treatment: '',
      complaints: '',
      diagnosis: '',
      instructions: '',
      next_visit_date: '',
      x_ray: false,
    });
    setPrescriptionItems([]);
    setCreatedPatientId(null);
    setCreatedTreatmentId(null);
    setItemSearchOpenId(null);
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
    if (step === 4) {
      if (prescriptionItems.length === 0) {
        return 'Please add at least one medicine to the prescription.';
      }
    }
    return '';
  };

  const selectedTreatmentTypeName = treatmentTypes.find((type) => String(type.id) === String(treatmentFormData.type_of_treatment))?.name || '';

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError('');
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setStepError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    
    // Handle step navigation
    if (currentStep < 4) {
      if (currentStep === 3) {
        // At step 3, validate and create patient/treatment/visit, then go to step 4
        const error = validateStep(currentStep);
        if (error) {
          setStepError(error);
          return;
        }

        setIsSubmitting(true);
        try {
          // Create patient
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
          setCreatedPatientId(patientId);

          // Create treatment
          const treatmentPayload = {
            patient: patientId,
            type_of_treatment: treatmentFormData.type_of_treatment,
            status: treatmentFormData.status,
            estimated_duration_months: treatmentFormData.estimated_duration_months || null,
            planned_amount: treatmentFormData.planned_amount || null,
            initial_findings: treatmentFormData.initial_findings,
            treatment_plan: treatmentFormData.treatment_plan,
            treatment_notes: treatmentFormData.treatment_notes,
            braces_type: treatmentFormData.braces_type || null,
            cap_type: treatmentFormData.cap_type || null
          };

          const treatmentResponse = await treatmentApi.create(serializePayload(treatmentPayload));
          const treatmentId = treatmentResponse.data.id;
          setCreatedTreatmentId(treatmentId);

          // Create visit
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

          // Initialize prescription form with auto-filled data (including treatment instruction)
          const treatmentInstruction = treatmentResponse?.data?.type_of_treatment_instruction || treatmentResponse?.data?.type_of_treatment?.treatment_instruction || '';
          setPrescriptionFormData(prev => ({
            ...prev,
            treatment: treatmentId,
            complaints: visitFormData.patient_complaints || '',
            next_visit_date: visitFormData.next_visit_date || '',
            instructions: treatmentInstruction,
          }));

          // Initialize prescription items with one empty row
          setPrescriptionItems([{
            localId: Math.random().toString(36).substr(2, 9),
            medicine: null,
            custom_medicine_name: '',
            search: '',
            dosage: '6',
            frequency: '1-0-1',
            duration: '3 Days',
            before_after_food: 'after_food',
            notes: '',
            sequence: 1,
            highlightedId: null
          }]);

          // Move to step 4
          setCurrentStep(4);
          setStepError('');
        } catch (error) {
          console.error('Error creating patient/treatment/visit:', error);
          const message = extractErrorMessage(error);
          setStepError(message);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // Steps 1-2: just navigate
        handleNext();
      }
    } else {
      // Step 4: Create prescription
      const error = validateStep(currentStep);
      if (error) {
        setStepError(error);
        return;
      }

      setIsSubmitting(true);
      try {
        // Prepare prescription items
        const prescriptionItemsPayload = prescriptionItems.map((item, index) => ({
          medicine: item.medicine?.id ?? null,
          custom_medicine_name: item.custom_medicine_name || null,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          before_after_food: item.before_after_food,
          notes: item.notes || null,
          sequence: index + 1
        }));

        // Create prescription
        const prescriptionPayload = {
          patient: createdPatientId,
          treatment: createdTreatmentId || prescriptionFormData.treatment,
          complaints: prescriptionFormData.complaints || null,
          diagnosis: prescriptionFormData.diagnosis || null,
          instructions: prescriptionFormData.instructions || null,
          next_visit_date: prescriptionFormData.next_visit_date || visitFormData.next_visit_date,
          x_ray: prescriptionFormData.x_ray || false,
          items: prescriptionItemsPayload
        };

        const printWindow = window.open('', '_blank');
        const response = await prescriptionApi.create(prescriptionPayload, true);
        const createdPrescription = response.data;

        if (createdPrescription?.pdf_url) {
          if (printWindow) {
            printWindow.location.href = createdPrescription.pdf_url;
          } else {
            window.open(createdPrescription.pdf_url, '_blank');
          }
        } else if (printWindow) {
          printWindow.close();
        }

        showSuccess('Patient, treatment, visit, and prescription created successfully!');
        resetModal();
        setShowAddModal(false);
        fetchPatients(currentPage, searchTerm);
      } catch (error) {
        console.error('Error creating prescription:', error);
        const message = extractErrorMessage(error);
        setStepError(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSkipPrescription = () => {
    if (!createdPatientId) {
      setStepError('Cannot skip prescription before the patient and visit are created.');
      return;
    }

    setStepError('');
    showSuccess('Patient, treatment, and visit created successfully without a prescription.');
    resetModal();
    setShowAddModal(false);
    fetchPatients(currentPage, searchTerm);
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

  // Prescription Helper Functions
  const getClinicMedicineOptions = (query) => {
    if (!query) return clinicMedicines;
    return clinicMedicines.filter((medicine) => {
      const searchText = `${medicine.medicine_name} ${medicine.strength || ''} ${medicine.form || ''}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  };

  const handlePrescriptionItemChange = (index, field, value) => {
    setPrescriptionItems(items =>
      items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleMedicineSelect = (index, medicine) => {
    setPrescriptionItems(items =>
      items.map((item, idx) =>
        idx === index
          ? {
              ...item,
              medicine,
              search: medicine.medicine_name,
              highlightedId: null
            }
          : item
      )
    );
    setItemSearchOpenId(null);
  };

  const updatePrescriptionItem = (index, changes) => {
    setPrescriptionItems((items) =>
      items.map((item, idx) => (idx === index ? { ...item, ...changes } : item))
    );
  };

  const handleAddPrescriptionRow = () => {
    setPrescriptionItems(items => [
      ...items,
      {
        localId: Math.random().toString(36).substr(2, 9),
        medicine: null,
        custom_medicine_name: '',
        search: '',
        dosage: '6',
        frequency: '1-0-1',
        duration: '3 Days',
        before_after_food: 'after_food',
        notes: '',
        sequence: items.length + 1,
        highlightedId: null
      }
    ]);
  };

  const handleRemovePrescriptionRow = (index) => {
    setPrescriptionItems(items => items.filter((_, idx) => idx !== index));
  };

  // Fetch clinic medicines when modal opens
  const fetchClinicMedicines = async () => {
    try {
      const response = await prescriptionApi.getClinicMedicines();
      setClinicMedicines(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Error fetching clinic medicines:', error);
    }
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
          {/* LEFT: Search */}
          <div className="relative w-full lg:flex-1">
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

  {/* RIGHT: Filters */}
  <div className="flex gap-3 w-full lg:w-auto">
    {/* Treatment Filter */}
    <select
      value={treatmentFilter}
      onChange={(e) => handleFilterChange('treatment', e.target.value)}
      className="flex-1 lg:flex-none px-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                 transition-all duration-200 shadow-sm bg-white"
    >
      <option value="">All Treatments</option>
      {filterTreatments.map((treatment) => (
        <option key={treatment.id} value={treatment.id}>
          {treatment.name}
        </option>
      ))}
    </select>

    {/* Doctor Filter */}
    <select
      value={doctorFilter}
      onChange={(e) => handleFilterChange('doctor', e.target.value)}
      className="flex-1 lg:flex-none px-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                 transition-all duration-200 shadow-sm bg-white"
    >
      <option value="">All Doctors</option>
      {filterDoctors.map((doctor) => (
        <option key={doctor.id} value={doctor.id}>
          {doctor.first_name} {doctor.last_name}
        </option>
      ))}
    </select>
  </div>

  <button
    onClick={() => setShowAddModal(true)}
    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow hover:shadow-lg transition-shadow w-full lg:w-auto"
  >
    <Plus className="w-4 h-4" />
    Add Patient
  </button>
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
                <th className="px-5 py-3 text-left font-semibold">Treatments</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">
                    No patients found
                  </td>
                </tr>
                ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
                    if (currentPage > 1) params.set('page', currentPage.toString());
                    // Use Link component's 'to' property syntax or navigate with proper object
                    navigate({ 
                      pathname: `${patient.id}`,
                      search: params.toString() ? `?${params.toString()}` : '' 
                    });
                  }}
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

                  {/* Treatments */}
                  <td className="px-5 py-3 text-gray-600">
                    {patient.treatment_summary || (patient.treatment_count > 0 ? `${patient.treatment_count} treatments` : 'No treatments')}
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
              onPageChange={handlePageChange}
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
                <h3 className="text-lg font-medium text-gray-900">Step {currentStep}: {currentStep === 1 ? 'Patient Information' : currentStep === 2 ? 'Treatment Details' : currentStep === 3 ? 'Initial Visit' : 'Create Prescription'}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {currentStep === 1
                    ? 'Fill in the patient information'
                    : currentStep === 2
                      ? 'Add treatment details'
                      : currentStep === 3
                        ? 'Schedule the initial visit'
                        : 'Add medicines for the patient'}
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
              <div className="grid grid-cols-4 gap-3 items-center">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex flex-col items-center text-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {step}
                    </div>
                    <span className="text-xs text-gray-500">
                      {step === 1 ? 'Patient' : step === 2 ? 'Treatment' : step === 3 ? 'Visit' : 'Rx'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
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
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>

                  {(selectedTreatmentTypeName.toLowerCase().includes('ortho') || selectedTreatmentTypeName.toLowerCase().includes('braces')) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Braces Type</label>
                      <select
                        name="braces_type"
                        value={treatmentFormData.braces_type}
                        onChange={handleTreatmentChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="metal">Metal</option>
                        <option value="ceramic">Ceramic</option>
                      </select>
                    </div>
                  )}

                  {selectedTreatmentTypeName.toLowerCase().includes('root canal') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cap Type</label>
                      <select
                        name="cap_type"
                        value={treatmentFormData.cap_type}
                        onChange={handleTreatmentChange}
                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedTreatmentTypeName.toLowerCase().includes('root canal')
                        ? 'Estimated Visits'
                        : 'Estimated Duration (Months)'}
                    </label>
                    <input
                      type="number"
                      name="estimated_duration_months"
                      value={treatmentFormData.estimated_duration_months}
                      onChange={handleTreatmentChange}
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={selectedTreatmentTypeName.toLowerCase().includes('root canal') ? 'e.g., 5' : 'e.g., 3'}
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
                      <option value="online">Online</option>
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

              {currentStep === 4 && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {/* Treatment Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment (Auto-filled)</label>
                    <input
                      type="text"
                      disabled
                      value={treatmentTypes.find(t => String(t.id) === String(treatmentFormData.type_of_treatment))?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Patient Complaints */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient Complaints</label>
                    <textarea
                      value={prescriptionFormData.complaints}
                      onChange={(e) => setPrescriptionFormData(prev => ({...prev, complaints: e.target.value}))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter patient complaints..."
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                    <textarea
                      value={prescriptionFormData.diagnosis}
                      onChange={(e) => setPrescriptionFormData(prev => ({...prev, diagnosis: e.target.value}))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter diagnosis..."
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                      value={prescriptionFormData.instructions}
                      onChange={(e) => setPrescriptionFormData(prev => ({...prev, instructions: e.target.value}))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter instructions..."
                    />
                  </div>

                  {/* Next Visit Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Visit Date</label>
                    <input
                      type="date"
                      value={prescriptionFormData.next_visit_date || visitFormData.next_visit_date}
                      onChange={(e) => setPrescriptionFormData(prev => ({...prev, next_visit_date: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Medicines */}
                  <div className="bg-white rounded-2xl border p-4 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Medicines</h3>
                    </div>
                    <div className="space-y-3">
                      {prescriptionItems.map((item, index) => (
                        <div
                          key={item.localId}
                          className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] gap-3 border rounded-2xl p-3 bg-slate-50 items-center"
                        >
                          {/* ===== MODERN MEDICINE DROPDOWN ===== */}
                          <div className="relative md:col-span-2">
                            <input
                              ref={itemSearchOpenId === index ? newItemRef : null}
                              type="text"
                              placeholder="Search Medicine..."
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                              value={item.search}
                              onChange={(e) => {
                                handlePrescriptionItemChange(index, 'search', e.target.value);
                                setItemSearchOpenId(index);
                              }}
                              onFocus={() => setItemSearchOpenId(index)}
                              onKeyDown={(e) => {
                                const filtered = getClinicMedicineOptions(item.search);
                                if (!filtered.length) return;
                                let current = filtered.findIndex(
                                  (m) => String(m.id) === String(item.highlightedId)
                                );
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  const next = filtered[current + 1] || filtered[0];
                                  updatePrescriptionItem(index, { highlightedId: next.id });
                                }
                                if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  const prev = filtered[current - 1] || filtered[filtered.length - 1];
                                  updatePrescriptionItem(index, { highlightedId: prev.id });
                                }
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const selected = filtered.find(
                                    (m) => String(m.id) === String(item.highlightedId)
                                  ) || filtered[0];
                                  handleMedicineSelect(index, selected);
                                }
                                if (e.key === 'Escape') {
                                  setItemSearchOpenId(null);
                                }
                              }}
                            />
                            {/* Dropdown */}
                            {itemSearchOpenId === index && (
                              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
                                <div className="h-48 overflow-y-scroll py-2 custom-scrollbar">
                                  {getClinicMedicineOptions(item.search).length > 0 ? (
                                    getClinicMedicineOptions(item.search).map((medicine) => {
                                      const active = String(item.highlightedId) === String(medicine.id);
                                      return (
                                        <button
                                          key={medicine.id}
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleMedicineSelect(index, medicine);
                                          }}
                                          onMouseEnter={() =>
                                            updatePrescriptionItem(index, {
                                              highlightedId: medicine.id,
                                            })
                                          }
                                          className={`w-full px-4 py-3 text-left transition ${
                                            active
                                              ? 'bg-blue-600 text-white'
                                              : 'hover:bg-slate-50 text-slate-800'
                                          }`}
                                        >
                                          <div className="font-semibold">
                                            {medicine.medicine_name}
                                          </div>
                                          <div
                                            className={`text-xs mt-1 ${
                                              active
                                                ? 'text-blue-100'
                                                : 'text-slate-500'
                                            }`}
                                          >
                                            {medicine.strength || 'Standard'} •{' '}
                                            {medicine.form || 'Tablet'}
                                          </div>
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <div className="px-4 py-4 text-sm text-slate-500 text-center">
                                      No medicine found
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <input
                            placeholder="Enter Qty"
                            className="input-ui min-w-0"
                            value={item.dosage}
                            onChange={(e) => handlePrescriptionItemChange(index, 'dosage', e.target.value)}
                          />

                          <select
                            className="input-ui min-w-0"
                            value={item.frequency}
                            onChange={(e) =>
                              handlePrescriptionItemChange(index, 'frequency', e.target.value)
                            }
                          >
                            <option>1-0-1</option>
                            <option>0-1-0</option>
                            <option>1-0-0</option>
                            <option>0-0-1</option>
                            <option>1-1-1</option>
                            <option>1-1-0</option>
                            <option>0-1-1</option>
                          </select>

                          <select
                            className="input-ui min-w-0"
                            value={item.duration}
                            onChange={(e) =>
                              handlePrescriptionItemChange(index, 'duration', e.target.value)
                            }
                          >
                            <option>1 Day</option>
                            <option>2 Days</option>
                            <option>3 Days</option>
                            <option>4 Days</option>
                            <option>5 Days</option>
                            <option>6 Days</option>
                            <option>7 Days</option>
                            <option>8 Days</option>
                            <option>9 Days</option>
                            <option>10 Days</option>
                            <option>11 Days</option>
                            <option>12 Days</option>
                            <option>13 Days</option>
                            <option>14 Days</option>
                            <option>15 Days</option>
                          </select>

                          <select
                            className="input-ui min-w-0"
                            value={item.before_after_food}
                            onChange={(e) =>
                              handlePrescriptionItemChange(index, 'before_after_food', e.target.value)
                            }
                          >
                            <option value="before_food">जेवणाआगोदर</option>
                            <option value="afternoon">दुपारी</option>
                            <option value="after_food">जेवणानंतर</option>
                            <option value="anytime">कधीही</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemovePrescriptionRow(index)}
                            className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPrescriptionRow}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"
                    >
                      + Add Medicine
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
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
                <div className="flex items-center gap-3 justify-end">
                  {currentStep === 4 && (
                    <button
                      type="button"
                      onClick={handleSkipPrescription}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Skip Prescription
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : currentStep < 3
                        ? 'Next'
                        : currentStep === 3
                          ? 'Create & Continue for Prescription'
                          : 'Create Prescription'}
                  </button>
                </div>
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
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Phone, User, Stethoscope, Calendar, X, ArrowLeft, ArrowRight, Check, CheckCircle2, AlertCircle, MapPin, UserCheck, CreditCard, ClipboardList, Pill, FileText, Sparkles } from 'lucide-react';
import PrescriptionAIReviewModal from '../components/PrescriptionAIReviewModal';
import { patientApi } from '../api/patientApi';
import { clinicApi } from '../api/clinicApi';
import { userApi } from '../api/userApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import normalizeApiError from '../utils/errorUtils';
import ChoiceSelect from '../components/ChoiceSelect';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/dateUtils';
import FilterSelect from "../components/FilterSelect";

const Patients = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialSearch = params.get('search') || '';
  const initialPage = parseInt(params.get('page') || '1', 10) || 1;
  const initialTreatment = params.get('treatment') || '';
  const initialDoctor = params.get('doctor') || '';

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [treatmentFilter, setTreatmentFilter] = useState(initialTreatment);
  const [doctorFilter, setDoctorFilter] = useState(initialDoctor);
  const [filterDoctors, setFilterDoctors] = useState([]);
  const [filterTreatments, setFilterTreatments] = useState([]);

  // Add Patient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const modalBodyRef = useRef(null);
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
    status: 'ongoing',
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
  const [clinicLanguage, setClinicLanguage] = useState('english');
  const [medicineFilter, setMedicineFilter] = useState('');
  const [itemSearchOpenId, setItemSearchOpenId] = useState(null);
  const [createdPatientId, setCreatedPatientId] = useState(null);
  const [createdTreatmentId, setCreatedTreatmentId] = useState(null);
  const dropdownRef = useRef(null);
  const newItemRef = useRef(null);

  const navigate = useNavigate();
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
    const page = parseInt(params.get('page') || '1', 10) || 1;
    const search = params.get('search') || '';
    const treatment = params.get('treatment') || '';
    const doctor = params.get('doctor') || '';

    setCurrentPage(page);
    setSearchTerm(search);
    setDebouncedSearchTerm(search);
    setTreatmentFilter(treatment);
    setDoctorFilter(doctor);

    fetchPatients(page, search, treatment, doctor);
  }, [location.search]);

  

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
        const n = normalizeApiError(error);
        console.error('Error loading filter options:', { status: n.status, type: n.type });
        showError(n.message);
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

  // Lock body scroll when Add Patient modal is open
  useEffect(() => {
    if (showAddModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showAddModal]);

  useEffect(() => {
    if (showAddModal) {
      const timer = setTimeout(() => {
        if (modalBodyRef.current) {
          if (stepError) {
            const invalidElem = modalBodyRef.current.querySelector('[aria-invalid="true"], :invalid, .border-red-500');
            if (invalidElem) {
              invalidElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
              try { invalidElem.focus({ preventScroll: true }); } catch (e) {}
            } else {
              modalBodyRef.current.scrollTop = 0;
            }
          } else {
            modalBodyRef.current.scrollTop = 0;
          }
        }
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [currentStep, showAddModal, stepError]);

  // Listen for assistant open add patient event and load prefill from sessionStorage
  useEffect(() => {
    const handler = () => {
      try {
        const raw = sessionStorage.getItem('assistant_add_patient_prefill');
        if (raw) {
          const parsed = JSON.parse(raw);
          // Apply prefill to form states but do not overwrite existing user edits
          if (parsed.patient) setFormData(prev => ({ ...prev, ...parsed.patient }));
          if (parsed.treatment) setTreatmentFormData(prev => ({ ...prev, ...parsed.treatment }));
          if (parsed.visit) setVisitFormData(prev => ({ ...prev, ...parsed.visit }));
          // Remove prefill after consumption to avoid reuse
          try { sessionStorage.removeItem('assistant_add_patient_prefill'); } catch (e) { console.error(e); }
        }
      } catch (e) {
        console.error('Failed to load assistant prefill', e);
      }
      setShowAddModal(true);
    };
    window.addEventListener('assistant:open_add_patient', handler);
    return () => window.removeEventListener('assistant:open_add_patient', handler);
  }, []);

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
        const n = normalizeApiError(err);
        console.error("Fetch error:", { status: n.status, type: n.type });
        setPatients([]);
        setTotalCount(0);
        setTotalPages(1);
        showError(n.message);
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
      const clinicsList = normalizeListResponse(response.data);
      setClinics(clinicsList);
      const preferredClinic = clinicsList[0] || null;
      setClinicLanguage(preferredClinic?.prescription_language || 'english');
    } catch (error) {
      const n = normalizeApiError(error);
      console.error('Error fetching clinics:', { status: n.status });
      showError(n.message);
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
    try {
      const n = normalizeApiError(error);
      if (n.fieldErrors && Object.keys(n.fieldErrors).length > 0) {
        return Object.entries(n.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(' | ');
      }
      return n.message || 'An error occurred';
    } catch (e) {
      return 'An error occurred';
    }
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
      const n = normalizeApiError(error);
      console.error('Error fetching doctors:', { status: n.status });
      showError(n.message);
    }
  };

  // Fetch treatment types for step 2
  const fetchTreatmentTypes = async () => {
    try {
      const response = await treatmentApi.getTypes();
      setTreatmentTypes(normalizeListResponse(response.data));
    } catch (error) {
      const n = normalizeApiError(error);
      console.error('Error fetching treatment types:', { status: n.status });
      showError(n.message);
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
      status: 'ongoing',
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

  const getTodayISO = () => new Date().toISOString().slice(0, 10);

  const validateStep = (step) => {
    const today = getTodayISO();

    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.gender || !formData.user) {
        return 'Please complete all required patient fields and doctor selection.';
      }
      if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
        return 'Patient mobile number must be exactly 10 digits.';
      }
      if (formData.date_of_birth && formData.date_of_birth > today) {
        return 'Date of birth cannot be in the future.';
      }
    }
    if (step === 2) {
      if (!treatmentFormData.type_of_treatment) {
        return 'Please select a treatment type to continue.';
      }
      if (treatmentFormData.estimated_duration_months && (Number(treatmentFormData.estimated_duration_months) < 1 || Number(treatmentFormData.estimated_duration_months) > 30)) {
        return 'Estimated Duration must be between 1 and 30 months.';
      }
    }
    if (step === 3) {
      if (!visitFormData.next_visit_date) {
        return 'Please select the initial visit date.';
      }
      if (visitFormData.next_visit_date < today) {
        return 'Next visit date cannot be in the past.';
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
          const selectedTypeObj = treatmentTypes.find((tt) => String(tt.id) === String(treatmentFormData.type_of_treatment));
          const selectedTypeName = (selectedTypeObj?.name || '').toLowerCase();
          const isOrtho = selectedTypeName.includes('ortho') || selectedTypeName.includes('braces');
          const isRootCanal = selectedTypeName.includes('root canal');

          const treatmentPayload = {
            patient: patientId,
            type_of_treatment: treatmentFormData.type_of_treatment,
            status: treatmentFormData.status,
            estimated_duration_months: treatmentFormData.estimated_duration_months || null,
            planned_amount: treatmentFormData.planned_amount || null,
            initial_findings: treatmentFormData.initial_findings,
            treatment_plan: treatmentFormData.treatment_plan,
            treatment_notes: treatmentFormData.treatment_notes,
            braces_type: isOrtho ? (treatmentFormData.braces_type || (treatmentFormData.cap_type ? treatmentFormData.cap_type : null)) : null,
            cap_type: isRootCanal ? (treatmentFormData.cap_type || null) : null
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
          const treatmentInstruction = treatmentResponse?.data?.treatment_translated_instruction || treatmentResponse?.data?.type_of_treatment_instruction || treatmentResponse?.data?.type_of_treatment?.treatment_instruction || '';
          setPrescriptionFormData(prev => ({
            ...prev,
            treatment: treatmentId,
            complaints: visitFormData.patient_complaints || '',
            next_visit_date: visitFormData.next_visit_date || '',
            instructions: treatmentInstruction,
          }));

          // Start with no prescription rows; only checked medicines are sent
          setPrescriptionItems([]);

          // Move to step 4
          setCurrentStep(4);
          setStepError('');
        } catch (error) {
          const n = normalizeApiError(error);
          console.error('Error creating patient/treatment/visit:', { status: n.status, type: n.type });
          const message = n.fieldErrors && Object.keys(n.fieldErrors).length > 0
            ? Object.entries(n.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(' | ')
            : n.message;
          setStepError(message);
          showError(message);
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
        // Prepare only selected prescription items; ignore blank rows
        const prescriptionItemsPayload = prescriptionItems
          .filter((item) => item.medicine?.id || (item.custom_medicine_name || '').trim())
          .map((item, index) => ({
            medicine: item.medicine?.id ?? null,
            custom_medicine_name: item.custom_medicine_name?.trim() || null,
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
        const n = normalizeApiError(error);
        console.error('Error creating prescription:', { status: n.status, type: n.type });
        const message = n.fieldErrors && Object.keys(n.fieldErrors).length > 0
          ? Object.entries(n.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : n.message;
        setStepError(message);
        showError(message);
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

    if (name === 'mobile') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: sanitized
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTreatmentChange = (e) => {
    const { name, value } = e.target;

    if (name === 'estimated_duration_months') {
      const digits = value.replace(/\D/g, '');
      const clamped = digits === '' ? '' : String(Math.min(Math.max(Number(digits), 1), 30));
      setTreatmentFormData(prev => ({
        ...prev,
        [name]: clamped
      }));
      return;
    }

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

  // Name validation: only letters, spaces, hyphens and apostrophes allowed
  const isNameInvalid = (name) => {
    if (!name) return false;
    return /\d/.test(name) || /[^A-Za-z\s'\-]/.test(name);
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
        before_after_food: 'AFTER_FOOD',
        notes: '',
        sequence: items.length + 1,
        highlightedId: null
      }
    ]);
  };

  const handleRemovePrescriptionRow = (index) => {
    setPrescriptionItems(items => items.filter((_, idx) => idx !== index));
  };

  // Medicine selection helpers (checkbox list)
  const isMedicineSelected = (medId) => {
    return prescriptionItems.some((i) => String(i.medicine?.id) === String(medId));
  };

  const handleToggleMedicine = (med, qty = 1) => {
    const exists = isMedicineSelected(med.id);
    if (exists) {
      setPrescriptionItems(items => items.filter(i => String(i.medicine?.id) !== String(med.id)));
    } else {
      setPrescriptionItems(items => [
        ...items,
        {
          localId: Math.random().toString(36).substr(2, 9),
          medicine: med,
          custom_medicine_name: '',
          search: med.medicine_name,
          dosage: String(qty),
          frequency: '1-0-1',
          duration: '3 Days',
          before_after_food: 'AFTER_FOOD',
          notes: '',
          sequence: items.length + 1,
          highlightedId: null
        }
      ]);
    }
  };

  const handleMedicineQtyChange = (medId, qty) => {
    setPrescriptionItems(items =>
      items.map(it =>
        String(it.medicine?.id) === String(medId) ? { ...it, dosage: String(Math.max(1, qty)) } : it
      )
    );
  };

  const getSelectedPrescriptionItem = (medId) => {
    return prescriptionItems.find((item) => String(item.medicine?.id) === String(medId));
  };

  // Fetch clinic medicines when modal opens
  const fetchClinicMedicines = async () => {
    try {
      const response = await prescriptionApi.getClinicMedicines();
      setClinicMedicines(response.data?.results || response.data || []);
    } catch (error) {
        const n = normalizeApiError(error);
        console.error('Error fetching clinic medicines:', { status: n.status });
        showError(n.message);
    }
  };

  const applyAiDraftToPrescription = (draft) => {
    if (!draft) return;
    // Map diagnosis
    setPrescriptionFormData((prev) => ({ ...prev, diagnosis: draft.diagnosis || prev.diagnosis }));
    // Map treatment_summary into instructions
    if (draft.treatment_summary) {
      setPrescriptionFormData((prev) => ({ ...prev, instructions: (prev.instructions ? prev.instructions + '\n' : '') + draft.treatment_summary }));
    }
    if (draft.instructions && draft.instructions.length > 0) {
      const instText = draft.instructions.join('\n');
      setPrescriptionFormData((prev) => ({ ...prev, instructions: (prev.instructions ? prev.instructions + '\n' : '') + instText }));
    }
    // Map medicines
    if (Array.isArray(draft.medications)) {
      const mapped = draft.medications.map((m, idx) => {
        const found = m.medicine_id ? clinicMedicines.find((cm) => String(cm.id) === String(m.medicine_id)) : null;
        return {
          localId: Math.random().toString(36).substr(2, 9),
          medicine: found || null,
          custom_medicine_name: found ? '' : (m.name || ''),
          search: found ? (found.medicine_name || '') : (m.name || ''),
          dosage: m.dosage || '',
          frequency: m.frequency || '1-0-1',
          duration: m.duration || '',
          before_after_food: m.timing || 'AFTER_FOOD',
          notes: m.notes || '',
          sequence: idx + 1,
          highlightedId: null
        };
      });
      setPrescriptionItems(mapped.length > 0 ? mapped : [
        {
          localId: Math.random().toString(36).substr(2, 9),
          medicine: null,
          custom_medicine_name: '',
          search: '',
          dosage: '6',
          frequency: '1-0-1',
          duration: '3 Days',
          before_after_food: 'AFTER_FOOD',
          notes: '',
          sequence: 1,
          highlightedId: null
        }
      ]);
    }
    setIsAiReviewOpen(false);
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
      const n = normalizeApiError(error);
      console.error("Delete failed:", { status: n.status });
      showError(n.message || 'We could not delete this patient. Please try again.');
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
    <div className="space-y-3">

      <div className="flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="min-w-0 flex-1 lg:w-auto md:w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                window.innerWidth < 640
                  ? "Search..."
                  : "Search patients by name or mobile..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl"
            />
          </div>
        </div>

        {/* Treatment */}
        <div className="shrink-0 w-[88px] sm:w-[90px] md:w-[170px]">
          <FilterSelect
            value={treatmentFilter}
            placeholder="All Treatments"
            options={[
              { value: "", label: "All Treatments" },
              ...filterTreatments.map((t) => ({ value: t.id, label: t.name })),
            ]}
            onChange={(value) => handleFilterChange("treatment", value)}
          />
        </div>

        {/* Doctor */}
        {/* <div className="shrink-0 w-[88px] sm:w-[90px] md:w-[170px]">
          <FilterSelect
            value={doctorFilter}
            placeholder="All Doctors"
            options={[
              { value: "", label: "All Doctors" },
              ...filterDoctors.map((d) => ({
                value: d.id,
                label: `${d.first_name} ${d.last_name}`,
              })),
            ]}
            onChange={(value) => handleFilterChange("doctor", value)}
          />
        </div> */}

          <button
        onClick={() => {
          try { sessionStorage.removeItem('assistant_add_patient_prefill'); } catch (e) { console.error(e); }
          setShowAddModal(true);
        }}
  className="
    hidden
    md:flex
    shrink-0
    px-6
    lg:px-7
    py-3
    min-w-[170px]
    rounded-xl
    bg-gradient-to-r
    from-blue-600
    to-blue-700
    text-white
    font-medium
    items-center
    justify-center
    gap-2
    shadow-sm
    hover:shadow-lg
    hover:from-blue-700
    hover:to-blue-800
    transition-all
    duration-200
  "
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
          {/* Mobile card view */}
          <div className="space-y-4 p-4 md:hidden">
            {loading ? (
              <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Loading patients...
              </div>
            ) : patients.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No patients found
              </div>
            ) : (
              patients.map((patient) => {
                const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
                const treatmentInfo = patient.treatment_summary || (patient.treatment_count > 0 ? `${patient.treatment_count} treatments` : 'No treatments');

                return (
                  <div
                    key={patient.id}
                    onClick={() => {
                      const params = new URLSearchParams(location.search);
                      if (currentPage > 1) {
                        params.set('page', currentPage.toString());
                      } else {
                        params.delete('page');
                      }
                      navigate({
                        pathname: `${patient.id}`,
                        search: params.toString() ? `?${params.toString()}` : ''
                      });
                    }}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {patientName || 'Unknown Patient'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(patient);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${patientName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                        <Stethoscope className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="truncate">{treatmentInfo}</span>
                      </div>

                      <a
                        href={`tel:${patient.mobile || ''}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        <Phone className="h-4 w-4 text-green-600 shrink-0" />
                        <span>{patient.mobile || 'N/A'}</span>
                      </a>

                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                        <Calendar className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>Created At: {formatDate(patient.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block">
            <table className="min-w-full">

              {/* Header */}
              <thead className="sticky top-0 z-10 bg-blue-50 border-b border-blue-100">
                <tr className="text-sm text-slate-700">
                  <th className="px-5 py-3 text-left font-semibold">Patient</th>
                  <th className="px-5 py-3 text-left font-semibold">Mobile</th>
                  <th className="px-5 py-3 text-left font-semibold">Treatments</th>
                  <th className="px-5 py-3 text-left font-semibold">Created At</th>
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
                      onClick={() => {
                        const params = new URLSearchParams(location.search);
                        if (currentPage > 1) {
                          params.set('page', currentPage.toString());
                        } else {
                          params.delete('page');
                        }
                        navigate({ 
                          pathname: `${patient.id}`,
                          search: params.toString() ? `?${params.toString()}` : '' 
                        });
                      }}
                      className="group cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-md hover:scale-[1.002]">

                      {/* Patient */}
                      <td className="px-5 py-3">
                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {patient.first_name} <br /> {patient.last_name}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="px-5 py-3">
                        {patient.mobile ? (
                          <a
                            href={`tel:${patient.mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md group-hover:bg-blue-600 transition-colors">
                              <Phone className="w-4 h-4" />
                            </div>

                            <span className="text-gray-600 group-hover:text-blue-600 transition-colors">
                              {patient.mobile}
                            </span>
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Doctor */}
                      {/* <td className="px-5 py-3 text-gray-600">
                        {patient.assigned_doctor || 'N/A'}
                      </td> */}

                      {/* Treatments */}
                      <td className="px-5 py-3 text-gray-600">
                        {patient.treatment_summary || (patient.treatment_count > 0 ? `${patient.treatment_count} treatments` : 'No treatments')}
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(patient.created_at)}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-3">

                          <Eye className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-125 transition-transform" />

<Edit className="w-4 h-4 text-amber-600 cursor-pointer hover:scale-125 transition-transform" />

<Trash2
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteClick(patient);
  }}
  className="w-4 h-4 text-red-600 cursor-pointer hover:scale-125 transition-transform" />

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
      {/* Mobile Floating Add Button */}
<button
  onClick={() => setShowAddModal(true)}
  className="
    md:hidden
    fixed
    bottom-[calc(7rem+env(safe-area-inset-bottom,0px))]
    right-6
    z-40

    h-12
    w-12
    rounded-full

    bg-gradient-to-br
    from-blue-500
    via-blue-600
    to-blue-700

    text-white

    border
    border-white/30

    shadow-[0_12px_30px_rgba(37,99,235,0.45)]

    backdrop-blur-md

    flex
    items-center
    justify-center

    transition-all
    duration-300

    active:scale-95
    hover:scale-110
  "
  aria-label="Add Patient"
>
    <Plus className="w-6 h-6 stroke-[2.5]" />
</button>      {/* Add Patient Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="w-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] sm:w-full sm:h-auto sm:min-h-0 sm:max-h-[85dvh] sm:max-w-3xl lg:max-w-4xl bg-white sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden relative border-0 sm:border sm:border-slate-200">
            
            {/* STICKY HEADER */}
            <header className="flex-shrink-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                    aria-label="Go to previous step"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    Add Patient
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Step {currentStep} of 4 · {
                      currentStep === 1 ? 'Patient Information' :
                      currentStep === 2 ? 'Treatment Details' :
                      currentStep === 3 ? 'Initial Visit Schedule' :
                      'Prescription & Medication'
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowAddModal(false); resetModal(); }}
                className="w-10 h-10 flex items-center justify-center -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* COMPACT PROGRESS STEPPER */}
            <div className="flex-shrink-0 bg-slate-50/90 border-b border-slate-100 py-2.5 px-3 sm:px-6 z-10">
              <div className="max-w-xs sm:max-w-md mx-auto">
                <div className="flex items-center justify-between relative px-2">
                  {/* Progress Line */}
                  <div className="absolute top-3.5 left-5 right-5 h-[2px] bg-slate-200 -z-0" />
                  <div
                    className="absolute top-3.5 left-5 h-[2px] bg-blue-600 transition-all duration-300 -z-0"
                    style={{
                      width: `${((currentStep - 1) / 3) * 100}%`,
                    }}
                  />

                  {[
                    { id: 1, name: 'Patient' },
                    { id: 2, name: 'Treatment' },
                    { id: 3, name: 'Visit' },
                    { id: 4, name: 'Rx' },
                  ].map((stepItem) => {
                    const isCompleted = currentStep > stepItem.id;
                    const isActive = currentStep === stepItem.id;

                    return (
                      <div
                        key={stepItem.id}
                        className={`flex flex-col items-center relative z-10 ${
                          isCompleted ? 'cursor-pointer' : 'cursor-default'
                        }`}
                        onClick={() => {
                          if (isCompleted) {
                            setStepError('');
                            setCurrentStep(stepItem.id);
                          }
                        }}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-sm ${
                            isCompleted
                              ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                              : isActive
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-105'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepItem.id}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-medium mt-1 transition-colors ${
                            isActive
                              ? 'text-blue-600 font-semibold'
                              : isCompleted
                              ? 'text-slate-700 font-medium'
                              : 'text-slate-400'
                          }`}
                        >
                          {stepItem.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FORM BODY CONTAINER */}
            <form onSubmit={handleAddPatient} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div ref={modalBodyRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-5 scroll-smooth">
                
                {/* STEP ERROR BANNER */}
                {stepError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 shadow-sm">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <span>{stepError}</span>
                    </div>
                  </div>
                )}

                {/* STEP 1: PATIENT INFORMATION */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                    
                    {/* Patient Personal Details */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <User className="w-3.5 h-3.5" />
                        <span>Patient Details</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            required
                            aria-invalid={isNameInvalid(formData.first_name)}
                            placeholder="Enter patient first name"
                            className={`w-full h-11 sm:h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 ${
                              isNameInvalid(formData.first_name)
                                ? 'border-red-500 bg-red-50/20 focus:ring-red-100'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                            }`}
                          />
                          {isNameInvalid(formData.first_name) && (
                            <p className="mt-1 text-xs text-red-600 font-medium">First name must contain only letters.</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            required
                            aria-invalid={isNameInvalid(formData.last_name)}
                            placeholder="Enter patient last name"
                            className={`w-full h-11 sm:h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 ${
                              isNameInvalid(formData.last_name)
                                ? 'border-red-500 bg-red-50/20 focus:ring-red-100'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                            }`}
                          />
                          {isNameInvalid(formData.last_name) && (
                            <p className="mt-1 text-xs text-red-600 font-medium">Last name must contain only letters.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <ChoiceSelect
                          which="user/gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          required
                          placeholder="Select Gender"
                        />
                      </div>
                    </div>

                    {/* Contact & Demographics */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Contact & Demographics</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            placeholder="Enter 10-digit mobile number"
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                          <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleInputChange}
                            max={getTodayISO()}
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address & Medical History */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Address & Clinical History</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Residential Address</label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Enter patient residential address"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Medical History</label>
                        <textarea
                          name="medical_history"
                          value={formData.medical_history}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Enter systemic conditions (Diabetes, BP, Allergies, etc.)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dental History</label>
                        <textarea
                          name="dental_history"
                          value={formData.dental_history}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Enter past dental procedures, extractions, or complications"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Assigned Doctor */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assigned Doctor</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Select Doctor <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="user"
                          value={formData.user}
                          onChange={handleInputChange}
                          required
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              Dr. {doctor.first_name} {doctor.last_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: TREATMENT DETAILS */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Treatment & Procedure */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Treatment & Procedure</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Treatment Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="type_of_treatment"
                            value={treatmentFormData.type_of_treatment}
                            onChange={handleTreatmentChange}
                            required
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Status <span className="text-red-500">*</span>
                          </label>
                          <ChoiceSelect
                            which="treatment/status"
                            name="status"
                            value={treatmentFormData.status}
                            onChange={handleTreatmentChange}
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            required
                            placeholder="Select Status"
                          />
                        </div>

                        {(selectedTreatmentTypeName.toLowerCase().includes('ortho') || selectedTreatmentTypeName.toLowerCase().includes('braces')) && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Braces Type</label>
                            <ChoiceSelect
                              which="treatment/braces-type"
                              name="braces_type"
                              value={treatmentFormData.braces_type}
                              onChange={handleTreatmentChange}
                              className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                              placeholder="Select Type"
                            />
                          </div>
                        )}

                        {selectedTreatmentTypeName.toLowerCase().includes('root canal') && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cap Type</label>
                            <ChoiceSelect
                              which="treatment/cap-type"
                              name="cap_type"
                              value={treatmentFormData.cap_type}
                              onChange={handleTreatmentChange}
                              className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                              placeholder="Select Type"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {selectedTreatmentTypeName.toLowerCase().includes('root canal')
                              ? 'Estimated Visits'
                              : 'Estimated Duration (Months)'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            name="estimated_duration_months"
                            value={treatmentFormData.estimated_duration_months}
                            onChange={handleTreatmentChange}
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder={selectedTreatmentTypeName.toLowerCase().includes('root canal') ? 'e.g., 5' : 'e.g., 3'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Planned Amount (₹)</label>
                          <input
                            type="number"
                            name="planned_amount"
                            value={treatmentFormData.planned_amount}
                            onChange={handleTreatmentChange}
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder="e.g., 5000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clinical Evaluation */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Clinical Evaluation</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Findings</label>
                        <textarea
                          name="initial_findings"
                          value={treatmentFormData.initial_findings}
                          onChange={handleTreatmentChange}
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Describe clinical examination & initial findings..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatment Plan</label>
                        <textarea
                          name="treatment_plan"
                          value={treatmentFormData.treatment_plan}
                          onChange={handleTreatmentChange}
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Outline planned clinical procedures and steps..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: INITIAL VISIT */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Appointment Schedule */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Appointment Schedule</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Next Visit Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="next_visit_date"
                          value={visitFormData.next_visit_date}
                          onChange={handleVisitChange}
                          min={getTodayISO()}
                          required
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Clinical & Patient Notes */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Visit & Clinical Notes</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatment Notes</label>
                        <textarea
                          name="treatment_notes"
                          value={visitFormData.treatment_notes}
                          onChange={handleVisitChange}
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Add visit treatment notes or observations..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Patient Complaints</label>
                        <textarea
                          name="patient_complaints"
                          value={visitFormData.patient_complaints}
                          onChange={handleVisitChange}
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Document chief complaints reported by patient..."
                        />
                      </div>
                    </div>

                    {/* Billing & Payment */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Initial Visit Payment</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Amount (₹)</label>
                          <input
                            type="number"
                            name="patient_payment_amount"
                            value={visitFormData.patient_payment_amount}
                            onChange={handleVisitChange}
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder="e.g., 1000"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Type</label>
                          <ChoiceSelect
                            which="treatment/payment-type"
                            name="patient_payment_type"
                            value={visitFormData.patient_payment_type}
                            onChange={handleVisitChange}
                            className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            placeholder="Select Payment Type"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Note</label>
                        <textarea
                          name="payment_note"
                          value={visitFormData.payment_note}
                          onChange={handleVisitChange}
                          rows={2}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Add payment transaction references or notes..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: RX / PRESCRIPTION */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Summary & Clinical Notes */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Summary & Diagnosis</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatment (Auto-filled)</label>
                        <input
                          type="text"
                          disabled
                          value={treatmentTypes.find(t => String(t.id) === String(treatmentFormData.type_of_treatment))?.name || ''}
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-base sm:text-sm font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Patient Complaints</label>
                        <textarea
                          value={prescriptionFormData.complaints}
                          onChange={(e) => setPrescriptionFormData(prev => ({...prev, complaints: e.target.value}))}
                          rows={2}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Enter patient complaints..."
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-semibold text-slate-700">Diagnosis</label>
                          <button
                            type="button"
                            disabled={aiLoading}
                            onClick={async () => {
                              const meaningful = Boolean(prescriptionFormData.diagnosis || prescriptionFormData.complaints || prescriptionFormData.instructions || prescriptionFormData.treatment);
                              if (!meaningful) {
                                showError('Please provide diagnosis, symptoms, treatment, or clinical notes before using AI Assist.');
                                return;
                              }
                              const computeAge = (dob) => {
                                if (!dob) return null;
                                try {
                                  const birth = new Date(dob);
                                  const now = new Date();
                                  let age = now.getFullYear() - birth.getFullYear();
                                  const m = now.getMonth() - birth.getMonth();
                                  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                                  return age;
                                } catch (e) {
                                  return null;
                                }
                              };

                              const payload = {
                                patient_age: computeAge(formData.date_of_birth) || null,
                                patient_gender: formData.gender || null,
                                known_allergies: formData.allergies || '',
                                relevant_medical_history: formData.medical_history || '',
                                treatment: prescriptionFormData.treatment ? String(prescriptionFormData.treatment) : '',
                                current_diagnosis: prescriptionFormData.diagnosis || '',
                                symptoms: prescriptionFormData.complaints || '',
                                clinical_notes: prescriptionFormData.instructions || '',
                                medication_history: [],
                                language: clinicLanguage || 'english',
                              };
                              try {
                                setAiLoading(true);
                                setAiDraft(null);
                                const resp = await prescriptionApi.aiAssist(payload);
                                setAiDraft(resp.data);
                                setIsAiReviewOpen(true);
                              } catch (err) {
                                const status = err?.response?.status;
                                if (status === 400) showError('Please provide sufficient clinical information.');
                                else if (status === 401) showError('Authentication required. Please login again.');
                                else if (status === 403) showError("You don't have permission to use AI assistance.");
                                else if (status === 422) showError('AI returned an invalid prescription suggestion. Please try again.');
                                else if (status === 429) showError('AI service is temporarily busy. Please try again shortly.');
                                else if (status === 503) showError('AI service is currently unavailable. Please try again later.');
                                else if (status === 504) showError('AI request timed out. Please try again.');
                                else showError('Unable to connect to AI service. Please check your connection and try again.');
                              } finally {
                                setAiLoading(false);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                              aiLoading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 active:scale-95'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{aiLoading ? 'Generating...' : 'AI Assist'}</span>
                          </button>
                        </div>
                        <textarea
                          value={prescriptionFormData.diagnosis}
                          onChange={(e) => setPrescriptionFormData(prev => ({...prev, diagnosis: e.target.value}))}
                          rows={2}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Enter clinical diagnosis..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          {clinicLanguage === 'marathi' ? 'सल्ला' : clinicLanguage === 'hindi' ? 'सलाह' : 'Advice / Instructions'}
                        </label>
                        <textarea
                          value={prescriptionFormData.instructions}
                          onChange={(e) => setPrescriptionFormData(prev => ({...prev, instructions: e.target.value}))}
                          rows={2}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder={clinicLanguage === 'marathi' ? 'सल्ला प्रविष्ट करा...' : clinicLanguage === 'hindi' ? 'सलाह दर्ज करें...' : 'Enter advice...'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Next Visit Date</label>
                        <input
                          type="date"
                          value={prescriptionFormData.next_visit_date || visitFormData.next_visit_date}
                          onChange={(e) => setPrescriptionFormData(prev => ({...prev, next_visit_date: e.target.value}))}
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Prescription Medicines */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Pill className="w-3.5 h-3.5" />
                        <span>Prescription Medicines</span>
                      </h4>

                      <PrescriptionAIReviewModal
                        isOpen={isAiReviewOpen}
                        aiDraft={aiDraft}
                        setAiDraft={setAiDraft}
                        onClose={() => setIsAiReviewOpen(false)}
                        onApply={applyAiDraftToPrescription}
                      />

                      <div>
                        <input
                          type="text"
                          placeholder="Filter medicines by name, strength, or form..."
                          value={medicineFilter}
                          onChange={(e) => setMedicineFilter(e.target.value)}
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 mb-3"
                        />

                        <div className="space-y-3">
                          {clinicMedicines
                            .filter((med) => {
                              if (!medicineFilter) return true;
                              const t = `${med.medicine_name} ${med.strength || ''} ${med.form || ''}`.toLowerCase();
                              return t.includes(medicineFilter.toLowerCase());
                            })
                            .map((med) => {
                              const selectedItem = getSelectedPrescriptionItem(med.id);
                              const isChecked = Boolean(selectedItem);

                              return (
                                <div
                                  key={med.id}
                                  className={`p-3.5 rounded-2xl border transition-all ${
                                    isChecked
                                      ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-200'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  {/* Medicine Header Row */}
                                  <div className="flex items-center justify-between gap-3 mb-2.5">
                                    <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleMedicine(med, 1)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-sm text-slate-900 truncate">
                                          {med.medicine_name}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                          {med.strength || 'Standard'} • {med.form || 'Tablet'}
                                        </div>
                                      </div>
                                    </label>
                                  </div>

                                  {/* Medicine Controls Row */}
                                  {isChecked && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Qty</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={selectedItem?.dosage || 1}
                                          onChange={(e) => handleMedicineQtyChange(med.id, Number(e.target.value || 1))}
                                          className="w-full h-10 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Frequency</label>
                                        <select
                                          className="w-full h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                                          value={selectedItem?.frequency || '1-0-1'}
                                          onChange={(e) => {
                                            const targetItem = getSelectedPrescriptionItem(med.id);
                                            if (!targetItem) {
                                              handleToggleMedicine(med, 1);
                                              return;
                                            }
                                            handlePrescriptionItemChange(
                                              prescriptionItems.findIndex((item) => String(item.medicine?.id) === String(med.id)),
                                              'frequency',
                                              e.target.value
                                            );
                                          }}
                                        >
                                          <option>1-0-1</option>
                                          <option>0-1-0</option>
                                          <option>1-0-0</option>
                                          <option>0-0-1</option>
                                          <option>1-1-1</option>
                                          <option>1-1-0</option>
                                          <option>0-1-1</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Duration</label>
                                        <select
                                          className="w-full h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                                          value={selectedItem?.duration || '3 Days'}
                                          onChange={(e) => {
                                            const targetItem = getSelectedPrescriptionItem(med.id);
                                            if (!targetItem) {
                                              handleToggleMedicine(med, 1);
                                              return;
                                            }
                                            handlePrescriptionItemChange(
                                              prescriptionItems.findIndex((item) => String(item.medicine?.id) === String(med.id)),
                                              'duration',
                                              e.target.value
                                            );
                                          }}
                                        >
                                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => (
                                            <option key={d}>{d} {d === 1 ? 'Day' : 'Days'}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                          {clinicLanguage === 'marathi' ? 'अन्न' : clinicLanguage === 'hindi' ? 'खाना' : 'Food'}
                                        </label>
                                        <ChoiceSelect
                                          which="prescription/before-after-food"
                                          language={clinicLanguage}
                                          className="w-full h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                                          value={selectedItem?.before_after_food || 'after_food'}
                                          onChange={(e) => {
                                            const targetItem = getSelectedPrescriptionItem(med.id);
                                            if (!targetItem) {
                                              handleToggleMedicine(med, 1);
                                              return;
                                            }
                                            handlePrescriptionItemChange(
                                              prescriptionItems.findIndex((item) => String(item.medicine?.id) === String(med.id)),
                                              'before_after_food',
                                              e.target.value
                                            );
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STICKY BOTTOM ACTIONS */}
              <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 z-20 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetModal(); }}
                    className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}

                <div className="flex items-center gap-2 sm:gap-3">
                  {currentStep === 4 && (
                    <button
                      type="button"
                      onClick={handleSkipPrescription}
                      disabled={isSubmitting}
                      className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Skip Rx
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || (currentStep === 1 && (isNameInvalid(formData.first_name) || isNameInvalid(formData.last_name)))}
                    className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : currentStep < 3 ? (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : currentStep === 3 ? (
                      <>
                        <span>Create & Continue for Rx</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <span>Create Prescription</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
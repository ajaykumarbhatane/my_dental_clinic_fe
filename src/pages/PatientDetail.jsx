import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Edit, ArrowLeft, ArrowRight, Plus, Users, X, UploadCloud, Eye, Printer, Trash2, Check, ChevronDown, FileText, Phone, MapPin, CalendarDays, ClipboardCheck, CircleDollarSign, Wallet, Heart, MoreVertical
} from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi } from '../api/visitsApi';
import { userApi } from '../api/userApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { useApiWithErrorHandling } from '../utils/apiUtils';
import { useNotification } from '../context/NotificationContext';
import { formatDate, parseDateString, toISODate, toDDMMYYYY } from '../utils/dateUtils';

const HeroCard = ({ patient, patientInitials, patientAge, doctorLabel, onAddTreatment }) => (
  <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-800 to-cyan-500 p-5 text-white sm:p-7 lg:p-8">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_32%)]" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="space-y-3">
          {/* <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-200">Patient Profile</p> */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {patient.first_name} {patient.last_name}
            </h1>
          </div>
        </div>
      </div>
      <button
        onClick={onAddTreatment}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-slate-950/10 transition hover:bg-slate-100"
      >
        <Plus className="h-4 w-4" />
        Add Treatment
      </button>
    </div>
  </section>
);

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className={`group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tone || ''}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      </div>
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
    {Icon && (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
    )}

    <div className="w-28 shrink-0">
      <span className="text-sm font-medium text-slate-500">
        {label}
      </span>
    </div>

    <div className="flex-1">
      <span className="text-sm font-semibold text-slate-900">
        {value || 'N/A'}
      </span>
    </div>
  </div>
);

const HistoryCard = ({ title, value, tone, icon: Icon, iconTone }) => (
  <div className={`rounded-[24px] border border-slate-200 p-4 shadow-sm ${tone}`}>
    <div className="flex items-center gap-3">
      <div className={`rounded-2xl p-2 ${iconTone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{title}</p>
    </div>
    <p className="mt-4 text-sm leading-6 text-slate-700">{value || 'No information recorded yet.'}</p>
  </div>
);

// const TreatmentCard = ({ treatment, onOpen, onEdit, onAddVisit, onView, progress, totalAmount, paidAmount, remainingAmount, visitsLength, statusClass }) => (
const TreatmentCard = ({
  treatment,
  onOpen,
  onEdit,
  onAddVisit,
  onView,
   onDelete,
  progress,
  totalAmount,
  paidAmount,
  remainingAmount,
  visitsLength,
  statusClass,
  actionMenuOpen,
  setActionMenuOpen
}) => (
   <div
  onClick={onOpen}
  className="
group
relative
overflow-hidden
cursor-pointer
rounded-[28px]
border-2
border-slate-100
bg-white
p-5
shadow-md
transition-all
duration-300
hover:-translate-y-1
hover:border-blue-300
hover:shadow-xl
hover:shadow-blue-100
"
>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
         <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
               <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600">{treatment.type_of_treatment_name || 'Untitled'}</h3>
               <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>
                  {treatment.status || 'N/A'}
               </span>
            </div>
            <p className="text-sm leading-6 text-slate-600">
               {treatment.treatment_plan ? (treatment.treatment_plan.length > 120 ? `${treatment.treatment_plan.slice(0, 120)}...` : treatment.treatment_plan) : 'No plan provided.'}
            </p>
         </div>
         <div className="relative">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setActionMenuOpen(
        actionMenuOpen === treatment.id
          ? null
          : treatment.id
      );
    }}
    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    <MoreVertical className="h-4 w-4" />
    Take Action
    <ChevronDown className="h-4 w-4" />
  </button>

  {actionMenuOpen === treatment.id && (
    <div className="absolute right-0 top-12 z-50 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActionMenuOpen(null);
          onEdit(treatment);
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"
      >
        <Edit className="h-4 w-4" />
        Edit Treatment
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActionMenuOpen(null);
          onAddVisit(treatment);
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
        Add Visit
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActionMenuOpen(null);
          onView(treatment);
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"
      >
        <Eye className="h-4 w-4" />
        View Treatment
      </button>
         <button
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               setActionMenuOpen(null);
               // delegate delete to parent
               if (typeof onDelete === 'function') onDelete(treatment);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"
         >
            <Trash2 className="h-4 w-4 text-red-600" />
            Delete Treatment
         </button>
    </div>
  )}
</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
         <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Total Amount</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{totalAmount}</p>
         </div>
         <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Paid</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{paidAmount}</p>
         </div>
         <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Remaining</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{remainingAmount}</p>
         </div>
      </div>

      <div className="mt-5">
         <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Progress</span>
            <span>{progress}%</span>
         </div>
         <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
         </div>
         <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>{visitsLength} visits</span>
            <span>{treatment.estimated_duration_months ? `${treatment.estimated_duration_months} months` : 'Timeline pending'}</span>
         </div>
      </div>
   </div>
);
const PrescriptionCard = ({ prescription, onView, onEdit, onPrint, onPdf, onDelete, formatDateValue }) => (
  <article
  className="
  group
  cursor-pointer
  rounded-[28px]
  border-2
  border-slate-100
  bg-white
  p-5
  shadow-md
  transition-all
  duration-300
  hover:-translate-y-1
  hover:border-blue-300
  hover:shadow-xl
  hover:shadow-blue-100
  "
>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{formatDateValue(prescription.created_at || prescription.next_visit_date)}</p>
        <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
  Prescription #{prescription.id}
</h3>
        <p className="text-sm leading-6 text-slate-600">
          {prescription.diagnosis || prescription.complaints || 'No summary available'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {prescription.x_ray ? 'RVG' : 'No RVG'}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {prescription.items?.length ?? 0} medicines
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Next: {prescription.next_visit_date ? formatDate(prescription.next_visit_date) : 'N/A'}
        </span>
      </div>
    </div>

    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Complaints</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{prescription.complaints || 'None'}</p>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Diagnosis</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{prescription.diagnosis || 'None'}</p>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Next Visit</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{prescription.next_visit_date ? formatDate(prescription.next_visit_date) : 'Not scheduled'}</p>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Treatment</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{prescription.treatment_name || 'Not assigned'}</p>
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      <button type="button" onClick={() => onView(prescription)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
        <Eye className="h-3.5 w-3.5" />
        View
      </button>
      <button type="button" onClick={() => onEdit(prescription)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
        <Edit className="h-3.5 w-3.5" />
        Edit
      </button>
      <button type="button" onClick={() => onPrint(prescription)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
        <Printer className="h-3.5 w-3.5" />
        Print
      </button>
      {prescription.pdf_url && (
        <button type="button" onClick={() => onPdf(prescription)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
          <FileText className="h-3.5 w-3.5" />
          PDF
        </button>
      )}
      <button type="button" onClick={() => onDelete(prescription)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  </article>
);

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
const { handleApiCall } = useApiWithErrorHandling();
const { showError, showSuccess } = useNotification();
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
const [actionMenuOpen, setActionMenuOpen] = useState(null);
const [treatmentToDelete, setTreatmentToDelete] = useState(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
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
const FREQUENCY_OPTIONS = ['1-0-1', '1-1-1', '0-1-0', '0-0-1', 'SOS', 'Custom'];
const FOOD_TIMING_OPTIONS = [
   { value: 'before_food', label: 'जेवणाआगोदर' },
   { value: 'afternoon', label: 'दुपारी' },
   { value: 'after_food', label: 'जेवणानंतर' },
  { value: 'anytime', label: 'कधीही' },
];
const createPrescriptionItem = (sequence = 1) => ({
localId: Math.random().toString(36).substr(2, 9),
medicine: null,
custom_medicine_name: '',
search: '',
dosage: '',
frequency: '1-0-1',
duration: '',
before_after_food: 'after_food',
notes: '',
sequence,
});
const [prescriptions, setPrescriptions] = useState([]);
const [clinicMedicines, setClinicMedicines] = useState([]);
const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
const [prescriptionModalMode, setPrescriptionModalMode] = useState('create');
const [activePrescription, setActivePrescription] = useState(null);
const [prescriptionFormData, setPrescriptionFormData] = useState({
treatment: '',
complaints: '',
diagnosis: '',
instructions: '',
next_visit_date: '',
x_ray: false,
});
const [prescriptionItems, setPrescriptionItems] = useState([createPrescriptionItem(1)]);
const [itemSearchOpenId, setItemSearchOpenId] = useState(null);
const [prescriptionNotes, setPrescriptionNotes] = useState('');
const [formErrors, setFormErrors] = useState({});
const newItemRef = useRef(null);
const dropdownRef = useRef(null);
const handleAddVisit = async (e) => {
e.preventDefault();
setSubmittingVisit(true);
try {
if (!visitFormData.next_visit_date) {
showError('Please select a visit date');
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
await handleApiCall(() => visitsApi.create(payload), {
  successMessage: 'Visit added successfully!',
  showSuccessNotification: true
});
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
} catch (error) {
console.error('Error creating visit:', error);
// Error notification is handled by handleApiCall
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
showError('Please select a treatment type');
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
await handleApiCall(() => treatmentApi.update(editingTreatment.id, payload), {
  successMessage: 'Treatment updated successfully!',
  showSuccessNotification: true
});
} else {
await handleApiCall(() => treatmentApi.create({
...payload,
patient: id,
type_of_treatment: treatmentFormData.type_of_treatment
}), {
  successMessage: 'Treatment added successfully!',
  showSuccessNotification: true
});
}
closeTreatmentModal();
await loadData();
} catch (error) {
console.error('Error saving treatment:', error);
// Error notification is handled by handleApiCall
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
const updatePrescriptionItem = (index, changes) => {
setPrescriptionItems((items) =>
items.map((item, idx) => (idx === index ? { ...item, ...changes } : item))
);
};
const resetPrescriptionForm = () => {
setPrescriptionFormData({
treatment: '',
complaints: '',
diagnosis: '',
instructions: '',
next_visit_date: '',
x_ray: false,
});
setPrescriptionItems([createPrescriptionItem(1)]);
setPrescriptionNotes('');
setFormErrors({});
setActivePrescription(null);
setPrescriptionModalMode('create');
setItemSearchOpenId(null);
};
const getTreatmentInstruction = (treatmentId) => {
  if (!treatmentId) return '';
  const treatment = treatments.find((t) => String(t.id) === String(treatmentId));
  return (
    treatment?.type_of_treatment_instruction ||
    treatment?.type_of_treatment?.treatment_instruction ||
    ''
  );
};
const normalizeMedicineLabel = (medicine) => {
if (!medicine) return '';
return medicine.medicine_name || '';
};
const getClinicMedicineOptions = (query) => {
if (!query) return clinicMedicines;
return clinicMedicines.filter((medicine) => {
const searchText = `${medicine.medicine_name} ${medicine.strength || ''} ${medicine.form || ''}`.toLowerCase();
return searchText.includes(query.toLowerCase());
});
};
const preparePrescriptionItemPayload = (item, index) => ({
medicine: item.medicine?.id ?? null,
custom_medicine_name: item.custom_medicine_name || null,
dosage: item.dosage,
frequency: item.frequency,
duration: item.duration,
before_after_food: item.before_after_food,
notes: item.notes || null,
sequence: index + 1,
});
const validatePrescriptionForm = () => {
const errors = {};
if (!prescriptionFormData.treatment) {
errors.treatment = 'Please select a treatment for the prescription.';
}
if (!prescriptionFormData.diagnosis && !prescriptionFormData.complaints) {
errors.form = 'Please provide either diagnosis or complaints.';
}
const itemErrors = prescriptionItems.map((item) => {
const rowErrors = {};
if (!item.medicine && !item.custom_medicine_name) {
rowErrors.medicine = 'Select an existing medicine or add a custom medicine name.';
}
if (!item.dosage) rowErrors.dosage = 'Dosage is required.';
if (!item.frequency) rowErrors.frequency = 'Frequency is required.';
if (!item.duration) rowErrors.duration = 'Duration is required.';
return rowErrors;
});
if (itemErrors.some((row) => Object.keys(row).length > 0)) {
errors.items = itemErrors;
}
setFormErrors(errors);
return Object.keys(errors).length === 0;
};
const openPrescriptionModal = (mode = 'create', prescription = null) => {
setPrescriptionModalMode(mode);
setItemSearchOpenId(null);
if (!prescription || mode === 'create') {
resetPrescriptionForm();
if (treatments.length > 0) {
const defaultTreatmentId = String(treatments[0].id);
setPrescriptionFormData((prev) => ({
...prev,
treatment: defaultTreatmentId,
instructions: getTreatmentInstruction(defaultTreatmentId),
}));
}
setActivePrescription(null);
} else {
const existingItems = (prescription.items || []).map((item, index) => {
const medicine = clinicMedicines.find((m) => String(m.id) === String(item.medicine)) || null;
return {
localId: Math.random().toString(36).substr(2, 9),
medicine,
custom_medicine_name: item.custom_medicine_name || '',
search: medicine ? normalizeMedicineLabel(medicine) : '',
dosage: item.dosage || '',
frequency: item.frequency || '1-0-1',
duration: item.duration || '',
before_after_food: item.before_after_food || 'after_food',
notes: item.notes || '',
sequence: index + 1,
};
});
setActivePrescription(prescription);
setPrescriptionFormData({
treatment: String(prescription.treatment) || '',
complaints: prescription.complaints || '',
diagnosis: prescription.diagnosis || '',
instructions: prescription.instructions || '',
next_visit_date: prescription.next_visit_date || '',
x_ray: !!prescription.x_ray,
});
setPrescriptionItems(existingItems.length > 0 ? existingItems : [createPrescriptionItem(1)]);
}
setFormErrors({});
setIsPrescriptionModalOpen(true);
};
const closePrescriptionModal = () => {
setIsPrescriptionModalOpen(false);
resetPrescriptionForm();
};
const handleAddPrescriptionRow = () => {
setPrescriptionItems((items) => [
...items,
createPrescriptionItem(items.length + 1),
]);
};
const handleRemovePrescriptionRow = (index) => {
if (prescriptionItems.length === 1) return;
setPrescriptionItems((items) =>
items.filter((_, idx) => idx !== index).map((item, idx) => ({
...item,
sequence: idx + 1,
}))
);
};
const handleMedicineSelect = (index, medicine) => {
updatePrescriptionItem(index, {
medicine,
custom_medicine_name: '',
search: normalizeMedicineLabel(medicine),
});
setItemSearchOpenId(null);
};
const handlePrescriptionFieldChange = (field, value) => {
   if (field === 'treatment') {
      // When treatment changes, update instructions to the treatment's default instruction.
      // This will overwrite previous instructions so the user can still edit afterwards.
      setPrescriptionFormData((prev) => ({
         ...prev,
         treatment: value,
         instructions: getTreatmentInstruction(value),
      }));
      return;
   }
   setPrescriptionFormData((prev) => ({ ...prev, [field]: value }));
};
const handlePrescriptionItemChange = (index, field, value) => {
updatePrescriptionItem(index, {
[field]: value,
...(field === 'search' ? { medicine: null } : {}),
});
};
const handleViewPrescription = (prescription) => {
openPrescriptionModal('view', prescription);
};
const handleEditPrescription = (prescription) => {
openPrescriptionModal('edit', prescription);
};
const handlePrintPrescription = (prescription) => {
  if (prescription.pdf_url) {
    // Open PDF in new window and trigger print after delay
    const printWindow = window.open(prescription.pdf_url, '_blank');
    if (printWindow) {
      // Wait for PDF to load then print - use timeout as PDF load is async
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (error) {
          console.error('Error triggering print:', error);
        }
      }, 1500);
    }
  } else {
    // Fallback to HTML print if PDF not available
    const medicines = (prescription.items || []).map((item) => {
      const medicineLabel = item.medicine_name || '';
      return `
<li>${medicineLabel || item.custom_medicine_name || 'Custom medicine'} - ${item.dosage || ''} - ${item.frequency || ''} - ${item.duration || ''}</li>
`;
    }).join('');
    const patientName = `${patient.first_name} ${patient.last_name || ''}`.trim();
    const content = `
<html>
   <head>
      <title>Prescription ${prescription.id}</title>
      <style>body{font-family:system-ui, sans-serif;padding:24px;color:#1f2937}h1{font-size:24px;margin-bottom:8px;}ul{padding-left:18px;}li{margin-bottom:6px;}</style>
   </head>
   <body>
      <h1>Prescription ${prescription.id}</h1>
      <p><strong>Patient:</strong> ${patientName}</p>
      <p><strong>Date:</strong> ${formatDate(prescription.created_at || prescription.next_visit_date)}</p>
      <p><strong>Diagnosis:</strong> ${prescription.diagnosis || 'N/A'}</p>
      <p><strong>Instructions:</strong> ${prescription.instructions || 'N/A'}</p>
      <h2>Medicines</h2>
      <ul>${medicines}</ul>
   </body>
</html>
`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (error) {
          console.error('Error triggering print:', error);
        }
      }, 500);
    }
  }
};
const handleViewPDF = (prescription) => {
if (prescription.pdf_url) {
window.open(prescription.pdf_url, '_blank');
}
};
const handleDeletePrescription = async (prescription) => {
if (!window.confirm('Delete this prescription? This action cannot be undone.')) return;
try {
await handleApiCall(() => prescriptionApi.delete(prescription.id), {
  successMessage: 'Prescription deleted successfully.',
  showSuccessNotification: true
});
setPrescriptions((prev) => prev.filter((item) => item.id !== prescription.id));
} catch (error) {
console.error('Error deleting prescription:', error);
// Error notification is handled by handleApiCall
}
};
useEffect(() => {
if (newItemRef.current) {
newItemRef.current.focus();
newItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
}, [prescriptionItems.length]);
useEffect(() => {
const handleEscape = (event) => {
if (event.key === 'Escape' && isPrescriptionModalOpen) {
closePrescriptionModal();
}
};
window.addEventListener('keydown', handleEscape);
return () => window.removeEventListener('keydown', handleEscape);
}, [isPrescriptionModalOpen]);
const handleSavePrescription = async (e, printAfterSave = false) => {
if (e) {
e.preventDefault();
}
if (!validatePrescriptionForm()) {
return;
}
const payload = {
patient: id,
treatment: prescriptionFormData.treatment,
complaints: prescriptionFormData.complaints || null,
diagnosis: prescriptionFormData.diagnosis || null,
instructions: prescriptionFormData.instructions || null,
next_visit_date: prescriptionFormData.next_visit_date || null,
x_ray: prescriptionFormData.x_ray,
items: prescriptionItems.map(preparePrescriptionItemPayload),
};
try {
let savedPrescription = activePrescription;
if (prescriptionModalMode === 'edit' && activePrescription) {
const response = await handleApiCall(() => prescriptionApi.update(activePrescription.id, payload, printAfterSave), {
  successMessage: 'Prescription updated successfully.',
  showSuccessNotification: true
});
savedPrescription = response.data;
} else {
const response = await handleApiCall(() => prescriptionApi.create(payload, printAfterSave), {
  successMessage: 'Prescription created successfully.',
  showSuccessNotification: true
});
savedPrescription = response.data;
}
await loadData();
if (printAfterSave && savedPrescription) {
handlePrintPrescription(savedPrescription);
// Delay closing modal to allow print dialog to appear
setTimeout(() => {
  closePrescriptionModal();
}, 500);
} else {
closePrescriptionModal();
}
} catch (error) {
console.error('Error saving prescription:', error);
// Error notification is handled by handleApiCall
}
};
const loadPrescriptionData = async () => {
try {
const [presResponse, medResponse] = await Promise.all([
prescriptionApi.getByPatient(id, { page_size: 100 }),
prescriptionApi.getClinicMedicines({ page_size: 200 }),
]);
const presList = presResponse.data?.results || presResponse.data || [];
const medicinesList = medResponse.data?.results || medResponse.data || [];
setPrescriptions(presList);
setClinicMedicines(medicinesList);
if (!prescriptionFormData.treatment && treatments.length > 0) {
setPrescriptionFormData((prev) => ({ ...prev, treatment: String(treatments[0].id) }));
}
} catch (error) {
console.error('Error loading prescriptions or medicines:', error);
}
};
const handlePrescriptionModalToggle = () => {
setIsPrescriptionModalOpen((open) => !open);
};
const handleItemSearchFocus = (index) => {
setItemSearchOpenId(index);
};
const handleItemSearchBlur = () => {
setTimeout(() => {
setItemSearchOpenId(null);
}, 150);
};
const handleSelectPrescriptionTab = (tab) => {
setActiveTab(tab);
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
await handleApiCall(() => patientApi.update(id, payload), {
  successMessage: 'Patient updated successfully!',
  showSuccessNotification: true
});
setIsEditingPatient(false);
await loadData();
} catch (error) {
console.error('Error updating patient:', error);
// Error notification is handled by handleApiCall
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
await loadPrescriptionData();
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
setActiveTab(['patient_info', 'treatments', 'prescription'].includes(tab) ? tab : 'patient_info');
loadData();
fetchDoctors();
}, [id]);
useEffect(() => {
const handleClickOutside = (event) => {
if (
dropdownRef.current &&
!dropdownRef.current.contains(event.target)
) {
setItemSearchOpenId(null);
}
};
document.addEventListener("mousedown", handleClickOutside);
return () => {
document.removeEventListener(
"mousedown",
handleClickOutside
);
};
}, []);
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

const handleConfirmDeleteTreatment = async () => {
   if (!treatmentToDelete) return;
   setIsDeleting(true);
   try {
      await treatmentApi.delete(treatmentToDelete.id);
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
      showSuccess('Treatment deleted');
      await loadData();
   } catch (err) {
      console.error('Error deleting treatment:', err);
      showError(err.response?.data?.detail || 'Failed to delete treatment');
   } finally {
      setIsDeleting(false);
   }
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
const patientInitials = `${patient?.first_name?.[0] || ''}${patient?.last_name?.[0] || ''}`.toUpperCase();
const patientAge = patient?.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()) : null;
const lastVisitDateObj = allVisits.reduce((latest, visit) => {
  if (!visit.next_visit_date) return latest;
  const date = parseDateString(visit.next_visit_date);
  if (!date) return latest;
  return !latest || date > latest ? date : latest;
}, null);
const lastVisitLabel = lastVisitDateObj ? formatDate(lastVisitDateObj) : 'N/A';
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
<div className="px-4 lg:px-0">
   <main className="w-full flex flex-col gap-6 px-2">
      <HeroCard
         patient={patient}
         patientInitials={patientInitials}
         patientAge={patientAge}
         doctorLabel={patient.assigned_doctor || (patient.user && `${patient.user.first_name || ''} ${patient.user.last_name || ''}`.trim()) || 'N/A'}
         onAddTreatment={() => {
            closeTreatmentModal();
            setIsAddingTreatment(true);
         }}
      />

      {/* stats moved into Clinical profile for a tighter layout */}

      <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
         <div className="flex flex-wrap gap-2 rounded-[20px] bg-slate-100 p-1.5">
            {[
            { key: 'patient_info', label: 'Patient Info' },
            { key: 'treatments', label: 'Treatments' },
            { key: 'prescription', label: 'Prescription' },
            ].map((tab) => (
            <button
               key={tab.key}
               onClick={() => handleSelectPrescriptionTab(tab.key)}
               className={`group flex-1 rounded-[16px] px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                     ? 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-md'
                     : 'text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-xl hover:-translate-y-1'
               }`}
               >
               {tab.label}
            </button>
            ))}
         </div>
      </div>

      {activeTab === 'patient_info' && (
      <section className="space-y-4" aria-labelledby="patient-info-heading">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* <div>
               <p id="patient-info-heading" className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Patient overview</p>
               <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Clinical profile</h2>
            </div> */}
            <button
               type="button"
               onClick={openEditPatientModal}
               className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/50 transition hover:bg-blue-700"
            >
               <Edit className="h-4 w-4" />
               Edit Patient
            </button>
         </div>

        {/* moved stats into the clinical profile */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <StatCard icon={CalendarDays} label="Visits" value={totalVisits} />
           <StatCard icon={CircleDollarSign} label="Revenue" value={formatAmount(totalPaid)} />
           <StatCard icon={Wallet} label="Outstanding" value={formatAmount(pendingAmount)} />
           <StatCard icon={ClipboardCheck} label="Rx" value={prescriptions.length} />
        </div>

         <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
               <div className="grid gap-0 sm:grid-cols-2">
                  <InfoRow icon={Phone} label="Phone" value={patient.mobile || 'N/A'} />
                  <InfoRow icon={Users} label="Gender" value={patient.gender || 'N/A'} />
                  <InfoRow icon={Users} label="Doctor" value={patient.assigned_doctor || (patient.user && `${patient.user.first_name || ''} ${patient.user.last_name || ''}`.trim()) || 'N/A'} />
                  <InfoRow icon={CalendarDays} label="DOB" value={formatDate(patient.date_of_birth) || 'N/A'} />
                  <InfoRow icon={MapPin} label="Location" value={patient.address || 'N/A'} />
                  <InfoRow icon={Heart} label="Status" value="Active" />
               </div>
            </div>
            <div className="space-y-4">
               <HistoryCard
                  title="Medical History"
                  value={patient.medical_history || 'No medical history recorded'}
                  tone="bg-blue-50/70"
                  icon={ClipboardCheck}
                  iconTone="bg-blue-100 text-blue-700"
               />
               <HistoryCard
                  title="Dental History"
                  value={patient.dental_history || 'No dental history recorded'}
                  tone="bg-emerald-50/70"
                  icon={Heart}
                  iconTone="bg-emerald-100 text-emerald-700"
               />
            </div>
         </div>

         <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-900 to-sky-600 p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
               <div className="rounded-2xl bg-white/15 p-3">
                  <CalendarDays className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">Activity timeline</p>
                  <h3 className="text-lg font-semibold">Care journey</h3>
               </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
               <div className="rounded-[20px] border border-white/10 bg-white/10 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">Last visit</p>
                  <p className="mt-2 text-sm font-semibold">{lastVisitLabel}</p>
               </div>
               <div className="rounded-[20px] border border-white/10 bg-white/10 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">Upcoming visit</p>
                  <p className="mt-2 text-sm font-semibold">{upcomingVisits[0] ? formatDate(upcomingVisits[0].next_visit_date) : 'No upcoming visits'}</p>
               </div>
               <div className="rounded-[20px] border border-white/10 bg-white/10 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">Total treatments</p>
                  <p className="mt-2 text-sm font-semibold">{totalTreatments}</p>
               </div>
            </div>
         </div>
      </section>
      )}
      <div>
         {activeTab === 'treatments' && (
         <div className="space-y-4">
            {treatments.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
               <p className="text-lg font-semibold text-slate-900">No treatments yet</p>
               <p className="mt-2 text-sm text-slate-500">Start the first plan for this patient to track care progress.</p>
            </div>
            ) : (
            <div className="grid gap-4">
               {treatments.map((treatment) => {
               const visits = getVisitsForTreatment(treatment.id);
               const progress = treatmentProgress(treatment);
               const { totalAmount, paidAmount, remainingAmount } = getTreatmentPaymentTotals(treatment);
               const statusClass =
               treatment.status === 'completed'
               ? 'bg-emerald-100 text-emerald-700'
               : treatment.status === 'ongoing'
               ? 'bg-blue-100 text-blue-700'
               : treatment.status === 'scheduled'
               ? 'bg-amber-100 text-amber-700'
               : 'bg-slate-100 text-slate-700';
               return (
                      <TreatmentCard
                  key={treatment.id}
                  treatment={treatment}
                  onOpen={() => handleViewTreatment(treatment)}
                  onEdit={openEditTreatmentModal}
                  onAddVisit={(selected) => {
                    setSelectedTreatment(selected);
                    setTreatmentDrawerOpen(false);
                    setIsAddingVisit(true);
                  }}
                  onView={handleViewTreatment}
                           onDelete={(t) => {
                              setTreatmentToDelete(t);
                              setShowDeleteModal(true);
                           }}
                  progress={progress}
                  totalAmount={formatAmount(totalAmount)}
                  paidAmount={formatAmount(paidAmount)}
                  remainingAmount={formatAmount(remainingAmount)}
                  visitsLength={visits.length}
                  statusClass={statusClass}
                  actionMenuOpen={actionMenuOpen}
                  setActionMenuOpen={setActionMenuOpen}
               />
               );
               })}
            </div>
            )}
         </div>
         )}
         {activeTab === 'visits' && (
         <div className="space-y-3 px-1">
            {allVisits.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No visits found for this patient.</div>
            ) : (
            <div className="space-y-3">
               {allVisits.map((visit) => (
               <div
                  key={visit.id}
                  onClick={() =>
                  {
                  const related = treatments.find(
                  (t) =>
                  String(t.id) === String(visit.treatment) ||
                  String(t.id) === String(visit.treatment_id)
                  );
                  if (related) handleViewTreatment(related);
                  }}
                  className="group relative cursor-pointer rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                     <div className="flex items-start justify-between gap-3">
                        <div>
                           <h3 className="text-sm font-semibold text-slate-900">
                              {visit.treatment_name || 'Treatment'}
                           </h3>
                           <p className="mt-1 text-xs text-slate-500">
                              {formatDate(visit.next_visit_date)}
                           </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {visit.patient_payment_type || 'N/A'}
                        </span>
                     </div>
                     <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {visit.treatment_notes || visit.patient_complaints || 'No notes'}
                     </p>
                     <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                           {visit.patient_payment_amount ? formatAmount(visit.patient_payment_amount) : 'No Payment'}
                        </p>
                        <span className="text-xs font-semibold text-blue-600">
                        View →
                        </span>
                     </div>
                  </div>
                  ))}
               </div>
               )}
            </div>
            )}
            {activeTab === 'prescription' && (
            <div className="space-y-4">
               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  
                  <button
                     type="button"
                     onClick={() => openPrescriptionModal('create')}
                     className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/50 transition hover:from-blue-700 hover:to-sky-700"
                     >
                     <Plus className="h-4 w-4" />
                     Add Prescription
                  </button>
               </div>
               {prescriptions.length === 0 ? (
               <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-lg font-semibold text-slate-900">No prescriptions yet</p>
                  <p className="mt-2 text-sm text-slate-500">Create the first prescription for this patient to keep records organized.</p>
               </div>
               ) : (
               <div className="grid gap-4">
                  {prescriptions.map((prescription) => (
                  <PrescriptionCard
                     key={prescription.id}
                     prescription={prescription}
                     onView={handleViewPrescription}
                     onEdit={handleEditPrescription}
                     onPrint={handlePrintPrescription}
                     onPdf={handleViewPDF}
                     onDelete={handleDeletePrescription}
                     formatDateValue={(value) => formatDate(value)}
                  />
                  ))}
               </div>
               )}
            </div>
            )}
         </div>
   </main>
   </div>
   {isPrescriptionModalOpen && (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
         <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 px-5 py-5 text-white sm:px-8">
            <div>
               <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-200">
                  {prescriptionModalMode === 'edit' ? 'Edit Prescription' : 'Create Prescription'}
               </p>
               <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                  {patient.first_name} {patient.last_name}
               </h2>
            </div>
            <button
               onClick={closePrescriptionModal}
               className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
               >
               <X className="h-5 w-5" />
            </button>
         </div>
         <form onSubmit={(e) => handleSavePrescription(e, false)} className="overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <div className="space-y-5">
               <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                     <label className="mb-2 block text-sm font-semibold text-slate-700">Treatment</label>
                     <select
                        value={prescriptionFormData.treatment}
                        onChange={(e) => handlePrescriptionFieldChange('treatment', e.target.value)}
                        className="input-ui"
                     >
                        <option>Select treatment</option>
                        {treatments.map((t) => (
                        <option key={t.id} value={t.id}>
                           {t.type_of_treatment_name}
                        </option>
                        ))}
                     </select>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                     <label className="mb-2 block text-sm font-semibold text-slate-700">Next Visit</label>
                     <input
                        type="date"
                        value={prescriptionFormData.next_visit_date}
                        onChange={(e) => handlePrescriptionFieldChange('next_visit_date', e.target.value)}
                        className="input-ui"
                     />
                  </div>
               </div>

               <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                     <label className="mb-2 block text-sm font-semibold text-slate-700">Complaints</label>
                     <textarea rows="4"
                        className="input-ui resize-none"
                        placeholder="Enter Patient complaints"
                        value={prescriptionFormData.complaints}
                        onChange={(e) => handlePrescriptionFieldChange('complaints', e.target.value)}
                     />
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                     <label className="mb-2 block text-sm font-semibold text-slate-700">Diagnosis</label>
                     <textarea rows="4"
                        className="input-ui resize-none"
                        placeholder="Enter Diagnosis"
                        value={prescriptionFormData.diagnosis}
                        onChange={(e) => handlePrescriptionFieldChange('diagnosis', e.target.value)}
                     />
                  </div>
               </div>

               <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Instructions</label>
                  <textarea rows="3"
                     className="input-ui resize-none"
                     placeholder="Enter Instructions"
                     value={prescriptionFormData.instructions}
                     onChange={(e) => handlePrescriptionFieldChange('instructions', e.target.value)}
                  />
               </div>

               <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-semibold text-slate-900">Medicines</h3>
                        <p className="text-sm text-slate-500">Add medications and dosing instructions</p>
                     </div>
                  </div>
                  <div className="space-y-3">
                     {prescriptionItems.map((item, index) => (
                     <div
                        key={item.localId}
                        className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1.5fr_0.7fr_1fr_0.9fr_1fr_auto]"
                     >
                        <div className="relative" ref={dropdownRef}>
                           <input
                              ref={itemSearchOpenId === index ? newItemRef : null}
                              type="text"
                              placeholder="Search Medicine..."
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              value={item.search}
                              onChange={(e) => {
                                 handlePrescriptionItemChange(index, 'search', e.target.value);
                                 setItemSearchOpenId(index);
                              }}
                              onFocus={() => setItemSearchOpenId(index)}
                              onKeyDown={(e) => {
                                 const filtered = getClinicMedicineOptions(item.search);
                                 if (!filtered.length) return;
                                 let current = filtered.findIndex((m) => String(m.id) === String(item.highlightedId));
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
                                    const selected = filtered.find((m) => String(m.id) === String(item.highlightedId)) || filtered[0];
                                    handleMedicineSelect(index, selected);
                                 }
                                 if (e.key === 'Escape') {
                                    setItemSearchOpenId(null);
                                 }
                              }}
                           />
                           {itemSearchOpenId === index && (
                           <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                              <div className="h-48 overflow-y-scroll py-2">
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
                                    onMouseEnter={() => updatePrescriptionItem(index, { highlightedId: medicine.id })}
                                    className={`w-full px-4 py-3 text-left transition ${active ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-slate-50'}`}
                                 >
                                    <div className="font-semibold">{medicine.medicine_name}</div>
                                    <div className={`mt-1 text-xs ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                                       {medicine.strength || 'Standard'} • {medicine.form || 'Tablet'}
                                    </div>
                                 </button>
                                 );
                                 })
                                 ) : (
                                 <div className="px-4 py-4 text-center text-sm text-slate-500">No medicine found</div>
                                 )}
                              </div>
                           </div>
                           )}
                        </div>
                        <input placeholder="Qty" className="input-ui" value={item.dosage} onChange={(e) => handlePrescriptionItemChange(index, 'dosage', e.target.value)} />
                        <select className="input-ui" value={item.frequency} onChange={(e) => handlePrescriptionItemChange(index, 'frequency', e.target.value)}>
                           <option>1-0-1</option>
                           <option>0-1-0</option>
                           <option>1-0-0</option>
                           <option>0-0-1</option>
                           <option>1-1-1</option>
                           <option>1-1-0</option>
                           <option>0-1-1</option>
                        </select>
                        <select className="input-ui" value={item.duration} onChange={(e) => handlePrescriptionItemChange(index, 'duration', e.target.value)}>
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
                        <select className="input-ui" value={item.before_after_food} onChange={(e) => handlePrescriptionItemChange(index, 'before_after_food', e.target.value)}>
                           <option value="before_food">जेवणाआगोदर</option>
                           <option value="afternoon">दुपारी</option>
                           <option value="after_food">जेवणानंतर</option>
                           <option value="anytime">कधीही</option>
                        </select>
                        <button type="button" onClick={() => handleRemovePrescriptionRow(index)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-100">
                           <Trash2 className="h-4 w-4" />
                        </button>
                     </div>
                     ))}
                  </div>
                  <button type="button" onClick={handleAddPrescriptionRow} className="mt-4 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                     + Add Medicine
                  </button>
               </div>
            </div>
         </form>
         <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <button onClick={closePrescriptionModal} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
               Cancel
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
               <button type="button" className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200" onClick={(e) => handleSavePrescription(e, false)}>
                  Save Draft
               </button>
               <button type="button" className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700" onClick={(e) => handleSavePrescription(e, true)}>
                  Save & Print
               </button>
            </div>
         </div>
      </div>
   </div>
)}
{isEditingPatient && (
<div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 sm:px-6 lg:px-8">
   <div className="fixed inset-0 bg-black/40" onClick={() =>
      setIsEditingPatient(false)} />
      <div className="relative w-full max-w-2xl max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5">
         <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between gap-3">
               <div>
                  <h3 className="text-xl font-semibold text-gray-900">Edit Patient</h3>
                  <p className="text-sm text-gray-500">Update patient details and assigned doctor</p>
               </div>
               <button
                  type="button"
                  onClick={() =>
                  setIsEditingPatient(false)}
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
                        onChange={(e) =>
                        setPatientFormData({ ...patientFormData, gender: e.target.value })}
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
                        onChange={(e) =>
                        setPatientFormData({ ...patientFormData, user: e.target.value })}
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
            <button onClick={closeDrawer} className="p-2 rounded-md hover:bg-gray-100">
               <X className="w-5 h-5" />
            </button>
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
                     <button type="button" onClick={() =>
                        {
                        setTreatmentDrawerOpen(false);
                        setIsAddingVisit(true);
                        }} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100">
                        <Plus className="w-3.5 h-3.5" />
                        Add Visit
                     </button>
                     <button type="button" onClick={() =>
                        showInfo('Upload images flow coming soon')} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100">
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload Images
                     </button>
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
                  onChange={(e) =>
                  setTreatmentFormData({...treatmentFormData, type_of_treatment: e.target.value})}
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
                     onChange={(e) =>
                     setTreatmentFormData({...treatmentFormData, braces_type: e.target.value})}
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
                     onChange={(e) =>
                     setTreatmentFormData({...treatmentFormData, cap_type: e.target.value})}
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
                     onChange={(e) =>
                     setTreatmentFormData({...treatmentFormData, status: e.target.value})}
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
               onClick={() =>
               setIsAddingVisit(false)}
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
                     onChange={(e) =>
                     setVisitFormData({...visitFormData, patient_payment_type: e.target.value})}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                     >
                     <option value="cash">Cash</option>
                     <option value="online">Online</option>
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

   {/* Delete Treatment Confirmation Modal */}
   {showDeleteModal && treatmentToDelete && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 px-6 py-4">
               <h3 className="text-xl font-bold text-red-900">Delete Treatment</h3>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
               <div className="mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                     <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
               </div>
               <p className="text-center text-gray-600 mb-2">
                  Are you sure you want to delete this treatment for <span className="font-bold text-gray-900">{treatmentToDelete.patient_name}</span>?
               </p>
               <p className="text-center text-sm text-red-600 font-semibold mb-4">
                  ⚠️ This action will also delete all associated visits and images. This cannot be undone.
               </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
               <button
                  onClick={() => {
                     setShowDeleteModal(false);
                     setTreatmentToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
               >
                  Cancel
               </button>
               <button
                  onClick={handleConfirmDeleteTreatment}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
               >
                  {isDeleting ? 'Deleting...' : 'Delete Treatment'}
               </button>
            </div>
         </div>
      </div>
   )}

</div>
);
};
export default PatientDetail;
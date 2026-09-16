import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Eye, Edit3, Plus, X, Trash2, Phone, User, Stethoscope } from 'lucide-react';
import { treatmentApi } from '../api/treatmentApi';
import { patientApi } from '../api/patientApi';
import { visitsApi } from '../api/visitsApi';
import ChoiceSelect from '../components/ChoiceSelect';
import Pagination from '../components/Pagination';
import { formatDate, toISODate, toDDMMYYYY } from '../utils/dateUtils';
import FilterSelect from "../components/FilterSelect";

const Treatments = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialParams = new URLSearchParams(location.search);
  const initialPage = parseInt(initialParams.get('page') || '1', 10);
  const initialSearch = initialParams.get('search') || '';
  let initialType = initialParams.get('type') || '';
  let initialStatus = initialParams.get('status') || '';

  if (initialType === 'all') initialType = '';
  if (initialStatus === 'all') initialStatus = '';

  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(Number.isNaN(initialPage) || initialPage <= 0 ? 1 : initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [treatmentFilter, setTreatmentFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [hasSyncedQueryParams, setHasSyncedQueryParams] = useState(false);
  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVisitsModal, setShowVisitsModal] = useState(false);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [selectedVisits, setSelectedVisits] = useState([]);
  const [visitFormData, setVisitFormData] = useState({
    next_visit_date: '',
    treatment_notes: '',
    patient_complaints: '',
    patient_payment_amount: '',
    patient_payment_type: 'cash',
    payment_note: '',
    treatment_status: ''
  });

  useEffect(() => {
    if (showAddVisitModal && selectedTreatment) {
      setVisitFormData(prev => ({
        ...prev,
        treatment_status: selectedTreatment.status || ''
      }));
    }
  }, [showAddVisitModal, selectedTreatment]);
  const [formData, setFormData] = useState({
    patient: '',
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
  const [submitting, setSubmitting] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteVisitModal, setShowDeleteVisitModal] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState(null);
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);
  const [showMobileFab, setShowMobileFab] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page') || '1', 10);
    const search = params.get('search') || '';
    let type = params.get('type') || '';
    let status = params.get('status') || '';

    if (type === 'all') type = '';
    if (status === 'all') status = '';

    if (!Number.isNaN(page) && page > 0) {
      setCurrentPage(page);
    }

    if (search !== searchTerm) {
      setSearchTerm(search);
    }

    if (search !== debouncedSearchTerm) {
      setDebouncedSearchTerm(search);
    }

    if (type !== treatmentFilter) {
      setTreatmentFilter(type);
    }

    if (status !== statusFilter) {
      setStatusFilter(status);
    }

    setHasSyncedQueryParams(true);
  }, [location.search]);

  useEffect(() => {
    if (!hasSyncedQueryParams) return;
    fetchTreatments(currentPage, debouncedSearchTerm, treatmentFilter, statusFilter);
  }, [currentPage, debouncedSearchTerm, treatmentFilter, statusFilter, hasSyncedQueryParams]);

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

  useEffect(() => {
    fetchTreatmentTypes();
    fetchPatients();
  }, []);

  const selectedType = Array.isArray(treatmentTypes)
    ? treatmentTypes.find(t => t.id === formData.type_of_treatment)
    : null;
  const selectedTypeName = selectedType?.name || '';

  const normalize = (data) => (Array.isArray(data) ? data : (data?.results || data || []));

  const fetchTreatments = async (page = 1, search = '', type = 'all', status = 'all') => {
    try {
      setLoading(true);
      const params = {};
      if (page > 1) params.page = page;
      if (search) params.search = search;
      if (type && type !== 'all') params.type_of_treatment = type;
      if (status && status !== 'all') params.status = status;

      const response = await treatmentApi.getAll(params);
      const list = normalize(response.data);
      setTreatments(list);
      setTotalCount(response.data.count || list.length);
      setTotalPages(Math.max(1, Math.ceil((response.data.count || list.length) / 10)));
    } catch (error) {
      console.error('Error fetching treatments:', error);
    } finally {
      setLoading(false);
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

  const fetchPatients = async () => {
    try {
      const response = await patientApi.getAll();
      const patientsData = response.data?.results || response.data || [];
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchVisitsForTreatment = async (treatmentId) => {
    try {
      const response = await visitsApi.getByTreatment(treatmentId);
      setSelectedVisits(response.data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.patient) {
        alert('Please select a patient');
        setSubmitting(false);
        return;
      }
      if (!formData.type_of_treatment) {
        alert('Please select a treatment type');
        setSubmitting(false);
        return;
      }

      // patient and type IDs are string-based keys (e.g. "PTabc123"/"TTxyz")
      // we only need to ensure they are not empty
      const selectedTypeObj = treatmentTypes.find((tt) => String(tt.id) === String(formData.type_of_treatment));
      const selectedTypeName = (selectedTypeObj?.name || '').toLowerCase();
      const isOrtho = selectedTypeName.includes('ortho') || selectedTypeName.includes('braces');
      const isRootCanal = selectedTypeName.includes('root canal');

      const payload = {
        patient: formData.patient,
        type_of_treatment: formData.type_of_treatment,
        status: formData.status,
        estimated_duration_months: formData.estimated_duration_months ? parseInt(formData.estimated_duration_months, 10) : null,
        planned_amount: formData.planned_amount ? parseFloat(formData.planned_amount) : null,
        initial_findings: formData.initial_findings || null,
        treatment_plan: formData.treatment_plan || null,
        treatment_notes: formData.treatment_notes || null,
        braces_type: isOrtho ? (formData.braces_type || (formData.cap_type ? formData.cap_type : null)) : null,
        cap_type: isRootCanal ? (formData.cap_type || null) : null
      };

      await treatmentApi.create(payload);
      setShowAddModal(false);
      setFormData({
        patient: '',
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
      fetchTreatments(currentPage, searchTerm, treatmentFilter, statusFilter);
    } catch (error) {
      console.error('Error creating treatment:', error);
      alert(error.response?.data?.detail || 'Error creating treatment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTreatment = (treatment) => {
    // Preserve current search / filter / page params when navigating to detail
    const params = new URLSearchParams(location.search);
    // Ensure page param is preserved explicitly when on later pages
    if (currentPage > 1) {
      params.set('page', String(currentPage));
    } else {
      params.delete('page');
    }

    const searchString = params.toString() ? `?${params.toString()}` : '';
    const currentPageUrl = `${location.pathname}${location.search}`;

    // Navigate to detail while keeping the original list params in the detail URL.
    // Also include a returnTo state for callers that rely on it.
    navigate(
      `/app/treatments/${treatment.id}${searchString}`,
      { state: { from: currentPageUrl, returnTo: currentPageUrl } }
    );
  };

  const handleViewVisits = async (treatment) => {
    setSelectedTreatment(treatment);
    await fetchVisitsForTreatment(treatment.id);
    setShowVisitsModal(true);
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
        next_visit_date: visitFormData.next_visit_date,
        treatment_notes: visitFormData.treatment_notes || null,
        patient_complaints: visitFormData.patient_complaints || null,
        patient_payment_amount: visitFormData.patient_payment_amount ? parseInt(visitFormData.patient_payment_amount, 10) : null,
        patient_payment_type: visitFormData.patient_payment_type || null,
        payment_note: visitFormData.payment_note || null
      };

      await visitsApi.create(payload);
      if (visitFormData.treatment_status && visitFormData.treatment_status !== selectedTreatment?.status) {
        await treatmentApi.update(selectedTreatment.id, { status: visitFormData.treatment_status });
        fetchTreatments();
      }
      setShowAddVisitModal(false);
      setVisitFormData({
        next_visit_date: '',
        treatment_notes: '',
        patient_complaints: '',
        patient_payment_amount: '',
        patient_payment_type: 'cash',
        payment_note: '',
        treatment_status: ''
      });
      await fetchVisitsForTreatment(selectedTreatment.id);
      alert('Visit added successfully!');
    } catch (error) {
      console.error('Error creating visit:', error);
      alert(error.response?.data?.detail || 'Error creating visit');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleDeleteVisit = (visit) => {
    setVisitToDelete(visit);
    setShowDeleteVisitModal(true);
  };

  const handleConfirmDeleteVisit = async () => {
    setIsDeletingVisit(true);
    try {
      await visitsApi.delete(visitToDelete.id);
      setShowDeleteVisitModal(false);
      setVisitToDelete(null);
      alert('Visit deleted successfully!');
      await fetchVisitsForTreatment(selectedTreatment.id);
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert(error.response?.data?.detail || 'Error deleting visit');
    } finally {
      setIsDeletingVisit(false);
    }
  };

  const handleDeleteTreatment = (treatment) => {
    setTreatmentToDelete(treatment);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteTreatment = async () => {
    setIsDeleting(true);
    try {
      await treatmentApi.delete(treatmentToDelete.id);
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
      alert('Treatment deleted successfully!');
      await fetchTreatments(currentPage, searchTerm, treatmentFilter, statusFilter);
    } catch (error) {
      console.error('Error deleting treatment:', error);
      alert(error.response?.data?.detail || 'Error deleting treatment');
    } finally {
      setIsDeleting(false);
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

  const handleFilterChange = (filterKey, value) => {
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set(filterKey, value);
    } else {
      params.delete(filterKey);
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

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">

      {/* Header */}
      <div className="space-y-2">

        <div className="flex flex-wrap items-center gap-2">

          {/* Search */}
          <div className="min-w-0 flex-1 md:w-full lg:w-auto">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search treatments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Treatment Filter */}
          <div className="shrink-0 w-[88px] sm:w-[90px] md:w-[170px]">
            <FilterSelect
              value={treatmentFilter}
              placeholder="Treatment"
              options={[
                { value: "", label: "All Treatments" },
                ...treatmentTypes.map((type) => ({ value: type.id, label: type.name })),
              ]}
              onChange={(value) => handleFilterChange("type", value)}
            />
          </div>

          {/* Status Filter */}
          <div className="shrink-0 w-[88px] sm:w-[90px] md:w-[170px]">
            <FilterSelect
              value={statusFilter}
              placeholder="Status"
              options={[
                { value: "", label: "All Statuses" },
                { value: "scheduled", label: "Scheduled" },
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "on_hold", label: "On Hold" },
              ]}
              onChange={(value) => handleFilterChange("status", value)}
            />
          </div>

          <div className="shrink-0 w-full md:w-auto">
  <button
    onClick={() => setShowAddModal(true)}
    className="
hidden
md:flex

min-w-[180px]
h-12
px-6

rounded-xl

bg-gradient-to-r
from-blue-600
to-blue-700

text-white
font-semibold

items-center
justify-center
gap-2

shadow-sm
hover:shadow-lg

hover:from-blue-700
hover:to-blue-800

transition-all
duration-200

whitespace-nowrap
">
              <Plus className="w-4 h-4" />
              Add Treatment
            </button>
          </div>

        </div>

      </div>

      {/* Table Container */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-0">

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto">
        <div className="space-y-4 p-4 md:hidden">
          {loading ? (
            <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Loading treatments...
            </div>
          ) : treatments.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No treatments found
            </div>
          ) : (
            treatments.map((treatment) => {
              const treatmentPatientName = [
                treatment.patient_name,
                treatment.patient_last_name
              ]
                .filter(Boolean)
                .join(' ') || treatment.patient_name || 'Unknown Patient';

              return (
                <div
                  key={treatment.id}
                  onClick={() => handleViewTreatment(treatment)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {treatmentPatientName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTreatment(treatment);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete treatment for ${treatmentPatientName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    

                    <a
                      href={`tel:${treatment.patient_mobile || treatment.patient?.mobile || ''}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>{treatment.patient_mobile || treatment.patient?.mobile || 'N/A'}</span>
                    </a>

                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      <span className="truncate">{treatment.type_of_treatment_name || 'No treatment type'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden md:block">
          <table className="min-w-full">

            {/* Header */}
            <thead className="sticky top-0 z-10 bg-blue-50 border-b border-blue-100">
              <tr className="text-sm text-gray-600">
                <th className="px-5 py-3 text-left font-semibold">Patient</th>
                <th className="px-5 py-3 text-left font-semibold">Mobile</th>
                <th className="px-5 py-3 text-left font-semibold">Treatment Type</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                {/* <th className="px-5 py-3 text-left font-semibold">Option</th> */}
                {/* <th className="px-5 py-3 text-left font-semibold">Estimated Duration / Visits</th> */}
                {/* <th className="px-5 py-3 text-left font-semibold">Planned Amount</th> */}
                {/* <th className="px-5 py-3 text-left font-semibold">Actions</th> */}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    Loading treatments...
                  </td>
                </tr>
              ) : treatments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    No treatments found
                  </td>
                </tr>
              ) : (
                treatments.map((treatment) => (
                  <tr
  key={treatment.id}
  onClick={() => handleViewTreatment(treatment)}
  className="
    group
    cursor-pointer
    transition-all
    duration-300
    hover:bg-gradient-to-r
    hover:from-blue-50
    hover:to-cyan-50
    hover:shadow-md
    hover:scale-[1.002]
  "
>
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {treatment.patient_name || treatment.patient?.first_name || treatment.patient_name || 'N/A'}
                        {treatment.patient_last_name || treatment.patient?.last_name ? (
                          <><br />{treatment.patient_last_name || treatment.patient?.last_name}</>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {(treatment.patient_mobile || treatment.patient?.mobile) ? (
                        <a
                          href={`tel:${treatment.patient_mobile || treatment.patient?.mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md group-hover:bg-blue-600 transition-colors">
                            <Phone className="w-4 h-4" />
                          </div>

                          <span className="text-gray-600 group-hover:text-blue-600 transition-colors">
                            {treatment.patient_mobile || treatment.patient?.mobile}
                          </span>
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {treatment.type_of_treatment_name}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        treatment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        treatment.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        treatment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        treatment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {treatment.status}
                      </span>
                    </td>
                    {/* <td className="px-5 py-3 text-gray-600">
                      {treatment.braces_type || treatment.cap_type || 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {treatment.estimated_duration_months ? (
                        treatment.type_of_treatment_name?.toLowerCase().includes('root canal')
                          ? `${treatment.estimated_duration_months} visits`
                          : `${treatment.estimated_duration_months} months`
                      ) : 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatAmount(treatment.planned_amount)}
                    </td>
                    <td
                      className="px-5 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleViewTreatment(treatment)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4 hover:scale-125 transition-transform duration-200" />
                        </button>
                        <button
                          onClick={() => handleViewTreatment(treatment)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Edit3 className="w-4 h-4 hover:scale-125 transition-transform duration-200" />

                        </button>
                        <button
                          onClick={() => handleDeleteTreatment(treatment)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4 hover:scale-125 transition-transform duration-200" />
                        </button>
                      </div>
                    </td> */}
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
      {/* Mobile Floating Add Treatment Button */}
<button
  onClick={() => setShowAddModal(true)}
  className="
    md:hidden
    fixed
    bottom-28
    right-6
    z-50

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
    hover:rotate-90
  "
  aria-label="Add Treatment"
>
    <Plus className="w-8 h-8 stroke-[2.5]" />
</button>
    

      {/* Add Treatment Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="w-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] sm:w-full sm:h-auto sm:min-h-0 sm:max-h-[85dvh] sm:max-w-xl md:max-w-2xl bg-white sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden relative border-0 sm:border sm:border-slate-200">
            <header className="flex-shrink-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Add New Treatment</h3>
                <p className="text-xs text-slate-500 font-medium">Enter treatment details for selected patient</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 flex items-center justify-center -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleAddTreatment} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-5 scroll-smooth">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Patient <span className="text-red-500">*</span> {!formData.patient && <span className="text-xs text-red-600 font-normal">(Required)</span>}
                    </label>
                    <select
                      required
                      value={formData.patient}
                      onChange={(e) => setFormData({...formData, patient: e.target.value})}
                      className={`w-full h-11 sm:h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:ring-2 ${
                        !formData.patient ? 'border-red-500 bg-red-50/20 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                      }`}
                    >
                      <option value="">Select Patient</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Treatment Type <span className="text-red-500">*</span> {!formData.type_of_treatment && <span className="text-xs text-red-600 font-normal">(Required)</span>}
                    </label>
                    <select
                      required
                      value={formData.type_of_treatment}
                      onChange={(e) => setFormData({...formData, type_of_treatment: e.target.value})}
                      className={`w-full h-11 sm:h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:ring-2 ${
                        !formData.type_of_treatment ? 'border-red-500 bg-red-50/20 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                      }`}
                    >
                      <option value="">Select Treatment Type</option>
                      {treatmentTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>

                    {(selectedTypeName.toLowerCase().includes('ortho') || selectedTypeName.toLowerCase().includes('braces')) && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Braces Type</label>
                        <ChoiceSelect
                          which="treatment/braces-type"
                          value={formData.braces_type}
                          onChange={(e) => setFormData({...formData, braces_type: e.target.value})}
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Select Type"
                        />
                      </div>
                    )}
                    {selectedTypeName.toLowerCase().includes('root canal') && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cap Type</label>
                        <ChoiceSelect
                          which="treatment/cap-type"
                          value={formData.cap_type}
                          onChange={(e) => setFormData({...formData, cap_type: e.target.value})}
                          className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          placeholder="Select Type"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <ChoiceSelect
                      which="treatment/status"
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="Select Status"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {selectedTypeName.toLowerCase().includes('root canal')
                        ? 'Estimated Visits'
                        : 'Estimated Duration (Months)'}
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_duration_months}
                      onChange={(e) => setFormData({...formData, estimated_duration_months: e.target.value})}
                      className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder={
                        selectedTypeName.toLowerCase().includes('root canal')
                          ? 'e.g., 5'
                          : 'e.g., 3'
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Planned Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.planned_amount}
                    onChange={(e) => setFormData({...formData, planned_amount: e.target.value})}
                    className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g., 5000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Findings</label>
                  <textarea
                    value={formData.initial_findings}
                    onChange={(e) => setFormData({...formData, initial_findings: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Describe initial findings..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatment Plan</label>
                  <textarea
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({...formData, treatment_plan: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Describe treatment plan..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatment Notes</label>
                  <textarea
                    value={formData.treatment_notes}
                    onChange={(e) => setFormData({...formData, treatment_notes: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-end gap-3 z-20">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.patient || !formData.type_of_treatment}
                  className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {submitting ? 'Adding...' : 'Add Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Visits Modal */}
      {showVisitsModal && selectedTreatment && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="w-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] sm:w-full sm:h-auto sm:min-h-0 sm:max-h-[85dvh] sm:max-w-2xl lg:max-w-3xl bg-white sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden relative border-0 sm:border sm:border-slate-200">
            <header className="flex-shrink-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Visits for {selectedTreatment.patient_name} - {selectedTreatment.type_of_treatment_name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Scheduled visits and payment history</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVisitsModal(false)}
                className="w-10 h-10 flex items-center justify-center -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scroll-smooth">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setVisitFormData({
                        next_visit_date: '',
                        treatment_notes: '',
                        patient_complaints: '',
                        patient_payment_amount: '',
                        patient_payment_type: 'cash',
                        payment_note: ''
                      });
                      setShowAddVisitModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Visit</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  {selectedVisits.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Next Visit Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Treatment Notes</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Complaints</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {selectedVisits.map((visit) => (
                          <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                              {formatDate(visit.next_visit_date)}
                            </td>
                            <td className="px-4 py-3.5 text-xs sm:text-sm text-slate-600 max-w-xs truncate">{visit.treatment_notes || 'N/A'}</td>
                            <td className="px-4 py-3.5 text-xs sm:text-sm text-slate-600 max-w-xs truncate">{visit.patient_complaints || 'N/A'}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                              {formatAmount(visit.patient_payment_amount)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs sm:text-sm text-slate-600 capitalize">
                              {visit.patient_payment_type || 'N/A'}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs sm:text-sm">
                              <button
                                type="button"
                                onClick={() => handleDeleteVisit(visit)}
                                className="text-red-600 hover:text-red-800 font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">No visits scheduled yet for this treatment.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-end z-20">
                <button
                  type="button"
                  onClick={() => setShowVisitsModal(false)}
                  className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Visit Modal */}
      {showAddVisitModal && selectedTreatment && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="w-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] sm:w-full sm:h-auto sm:min-h-0 sm:max-h-[85dvh] sm:max-w-xl md:max-w-2xl bg-white sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden relative border-0 sm:border sm:border-slate-200">
            <header className="flex-shrink-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Add New Visit</h3>
                <p className="text-xs text-slate-500 font-medium">Record next visit schedule and treatment notes</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVisitModal(false)}
                className="w-10 h-10 flex items-center justify-center -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleAddVisit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-5 scroll-smooth">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Next Visit Date <span className="text-red-500">*</span> {!visitFormData.next_visit_date && <span className="text-xs text-red-600 font-normal">(Required)</span>}
                    </label>
                    <input
                      type="date"
                      required
                      value={toISODate(visitFormData.next_visit_date)}
                      onChange={(e) => setVisitFormData({
                        ...visitFormData,
                        next_visit_date: e.target.value ? toDDMMYYYY(e.target.value) : ''
                      })}
                      className={`w-full h-11 sm:h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:ring-2 ${
                        !visitFormData.next_visit_date ? 'border-red-500 bg-red-50/20 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatment Status</label>
                    <ChoiceSelect
                      which="treatment/status"
                      value={visitFormData.treatment_status}
                      onChange={(e) => setVisitFormData({ ...visitFormData, treatment_status: e.target.value })}
                      className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="Select Treatment Status"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Treatment Notes</label>
                  <textarea
                    value={visitFormData.treatment_notes}
                    onChange={(e) => setVisitFormData({...visitFormData, treatment_notes: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Add treatment notes..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Patient Complaints</label>
                  <textarea
                    value={visitFormData.patient_complaints}
                    onChange={(e) => setVisitFormData({...visitFormData, patient_complaints: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Document patient complaints..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Amount (₹)</label>
                    <input
                      type="number"
                      value={visitFormData.patient_payment_amount}
                      onChange={(e) => setVisitFormData({...visitFormData, patient_payment_amount: e.target.value})}
                      className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g., 1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Type</label>
                    <ChoiceSelect
                      which="treatment/payment-type"
                      value={visitFormData.patient_payment_type}
                      onChange={(e) => setVisitFormData({...visitFormData, patient_payment_type: e.target.value})}
                      className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="Select Payment Type"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Note</label>
                  <textarea
                    value={visitFormData.payment_note}
                    onChange={(e) => setVisitFormData({...visitFormData, payment_note: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Add any payment notes..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-end gap-3 z-20">
                <button
                  type="button"
                  onClick={() => setShowAddVisitModal(false)}
                  className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVisit || !visitFormData.next_visit_date}
                  className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {submittingVisit ? 'Adding...' : 'Add Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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

    {/* Delete Visit Confirmation Modal */}
    {showDeleteVisitModal && visitToDelete && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 px-6 py-4">
            <h3 className="text-xl font-bold text-red-900">Delete Visit</h3>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-6">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-center text-gray-600 mb-2">
              Are you sure you want to delete this visit?
            </p>
            <p className="text-center text-sm text-red-600 font-semibold mb-4">
              ⚠️ This action will also delete all associated images. This cannot be undone.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteVisitModal(false);
                setVisitToDelete(null);
              }}
              disabled={isDeletingVisit}
              className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeleteVisit}
              disabled={isDeletingVisit}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
            >
              {isDeletingVisit ? 'Deleting...' : 'Delete Visit'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

};

export default Treatments;
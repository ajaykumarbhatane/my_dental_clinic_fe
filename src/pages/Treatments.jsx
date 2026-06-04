import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Eye, Edit3, Plus, X, Trash2 } from 'lucide-react';
import { treatmentApi } from '../api/treatmentApi';
import { patientApi } from '../api/patientApi';
import { visitsApi } from '../api/visitsApi';
import Pagination from '../components/Pagination';
import { formatDate, toISODate, toDDMMYYYY } from '../utils/dateUtils';

const Treatments = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
    payment_note: ''
  });
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

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page') || '1', 10);
    const search = params.get('search') || '';
    const type = params.get('type') || 'all';
    const status = params.get('status') || 'all';

    if (!Number.isNaN(page) && page > 0) setCurrentPage(page);
    if (search !== searchTerm) setSearchTerm(search);
    if (type !== filterType) setFilterType(type);
    if (status !== filterStatus) setFilterStatus(status);
    // ensure the initial search from URL is applied for the first fetch
    setDebouncedSearchTerm(search);
  }, [location.search]);

  useEffect(() => {
    fetchTreatments(currentPage, debouncedSearchTerm, filterType, filterStatus);
  }, [currentPage, debouncedSearchTerm, filterType, filterStatus]);

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
      setCurrentPage(page);
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

      if (filterType && filterType !== 'all') params.set('type', filterType); else params.delete('type');
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus); else params.delete('status');

      window.history.replaceState({}, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
      setDebouncedSearchTerm(searchTerm);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, filterType, filterStatus]);

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
      const payload = {
        patient: formData.patient,
        type_of_treatment: formData.type_of_treatment,
        status: formData.status,
        estimated_duration_months: formData.estimated_duration_months ? parseInt(formData.estimated_duration_months, 10) : null,
        planned_amount: formData.planned_amount ? parseFloat(formData.planned_amount) : null,
        initial_findings: formData.initial_findings || null,
        treatment_plan: formData.treatment_plan || null,
        treatment_notes: formData.treatment_notes || null,
        braces_type: formData.braces_type || null,
        cap_type: formData.cap_type || null
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
      fetchTreatments();
    } catch (error) {
      console.error('Error creating treatment:', error);
      alert(error.response?.data?.detail || 'Error creating treatment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTreatment = (treatment) => {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(
      `/app/treatments/${treatment.id}?returnTo=${returnTo}`,
      { state: { from: `${location.pathname}${location.search}` } }
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
      setShowAddVisitModal(false);
      setVisitFormData({
        next_visit_date: '',
        treatment_notes: '',
        patient_complaints: '',
        patient_payment_amount: '',
        patient_payment_type: 'cash',
        payment_note: ''
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
      await fetchTreatments(currentPage);
    } catch (error) {
      console.error('Error deleting treatment:', error);
      alert(error.response?.data?.detail || 'Error deleting treatment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(location.search);
    if (page > 1) params.set('page', page.toString()); else params.delete('page');
    window.history.replaceState({}, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    setCurrentPage(page);
  };

  const handleFilterChange = (filterType, value) => {
    const params = new URLSearchParams(location.search);
    if (value && value !== 'all') {
      params.set(filterType, value);
    } else {
      params.delete(filterType);
    }
    params.delete('page');
    window.history.replaceState({}, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    if (filterType === 'type') setFilterType(value || 'all');
    if (filterType === 'status') setFilterStatus(value || 'all');
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
          <div className="relative w-full lg:flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search treatments by patient name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <select
              value={filterType}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="flex-1 lg:flex-none px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm bg-white"
            >
              <option value="all">All Treatment Types</option>
              {treatmentTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="flex-1 lg:flex-none px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow hover:shadow-lg transition-shadow w-full lg:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Treatment
        </button>
      </div>

      {/* Table Container */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full">

            {/* Header */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-sm text-gray-600">
                <th className="px-5 py-3 text-left font-semibold">Patient Name</th>
                <th className="px-5 py-3 text-left font-semibold">Treatment Type</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-left font-semibold">Option</th>
                <th className="px-5 py-3 text-left font-semibold">Estimated Duration / Visits</th>
                <th className="px-5 py-3 text-left font-semibold">Planned Amount</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y">
              {treatments.length === 0 ? (
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
                    className="hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-900">
                        {treatment.patient_first_name || treatment.patient?.first_name || treatment.patient_name || 'N/A'}
                        {treatment.patient_last_name || treatment.patient?.last_name ? (
                          <><br />{treatment.patient_last_name || treatment.patient?.last_name}</>
                        ) : null}
                      </span>
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
                    <td className="px-5 py-3 text-gray-600">
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
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewTreatment(treatment)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTreatment(treatment)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

      {/* Add Treatment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Treatment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTreatment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient * <span className="text-xs text-red-600">{!formData.patient ? '(Required)' : ''}</span></label>
                  <select
                    required
                    value={formData.patient}
                    onChange={(e) => setFormData({...formData, patient: e.target.value})}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !formData.patient ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
                  <label className="block text-sm font-medium text-gray-700">Treatment Type * <span className="text-xs text-red-600">{!formData.type_of_treatment ? '(Required)' : ''}</span></label>
                  <select
                    required
                    value={formData.type_of_treatment}
                    onChange={(e) => setFormData({...formData, type_of_treatment: e.target.value})}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      !formData.type_of_treatment ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
              {(selectedTypeName.toLowerCase().includes('ortho') || selectedTypeName.toLowerCase().includes('braces')) && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Braces Type</label>
                  <select
                    value={formData.braces_type}
                    onChange={(e) => setFormData({...formData, braces_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="metal">Metal</option>
                    <option value="ceramic">Ceramic</option>
                  </select>
                </div>
              )}
              {selectedTypeName.toLowerCase().includes('root canal') && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Cap Type</label>
                  <select
                    value={formData.cap_type}
                    onChange={(e) => setFormData({...formData, cap_type: e.target.value})}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                    {selectedTypeName.toLowerCase().includes('root canal')
                      ? 'Estimated Visits'
                      : 'Estimated Duration (Months)'}
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_duration_months}
                    onChange={(e) => setFormData({...formData, estimated_duration_months: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      selectedTypeName.toLowerCase().includes('root canal')
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
                  value={formData.planned_amount}
                  onChange={(e) => setFormData({...formData, planned_amount: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Findings</label>
                <textarea
                  value={formData.initial_findings}
                  onChange={(e) => setFormData({...formData, initial_findings: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe initial findings..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Plan</label>
                <textarea
                  value={formData.treatment_plan}
                  onChange={(e) => setFormData({...formData, treatment_plan: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe treatment plan..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Treatment Notes</label>
                <textarea
                  value={formData.treatment_notes}
                  onChange={(e) => setFormData({...formData, treatment_notes: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.patient || !formData.type_of_treatment}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visits Modal */}
      {showVisitsModal && selectedTreatment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Visits for {selectedTreatment.patient_name} - {selectedTreatment.type_of_treatment_name}
              </h3>
              <button
                onClick={() => setShowVisitsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <button
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Visit</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {selectedVisits.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Visit Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaints</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(visit.next_visit_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{visit.treatment_notes || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{visit.patient_complaints || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(visit.patient_payment_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visit.patient_payment_type || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleDeleteVisit(visit)}
                            className="text-red-600 hover:text-red-900"
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
                  <p className="text-gray-500">No visits scheduled yet for this treatment.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVisitsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Visit Modal */}
      {showAddVisitModal && selectedTreatment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Visit</h3>
              <button
                onClick={() => setShowAddVisitModal(false)}
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
                  onClick={() => setShowAddVisitModal(false)}
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
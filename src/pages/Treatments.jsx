import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Eye, Plus, X } from 'lucide-react';
import { treatmentApi } from '../api/treatmentApi';
import { patientApi } from '../api/patientApi';
import { visitsApi } from '../api/visitsApi';

const Treatments = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
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

  useEffect(() => {
    fetchTreatments();
    fetchTreatmentTypes();
    fetchPatients();
  }, []);

  const selectedType = treatmentTypes.find(t => t.id === formData.type_of_treatment);
  const selectedTypeName = selectedType?.name || '';

  const fetchTreatments = async () => {
    try {
      const response = await treatmentApi.getAll();
      setTreatments(response.data);
    } catch (error) {
      console.error('Error fetching treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatmentTypes = async () => {
    try {
      const response = await treatmentApi.getTypes();
      setTreatmentTypes(response.data);
    } catch (error) {
      console.error('Error fetching treatment types:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientApi.getAll();
      console.log('patients response', response.data);
      setPatients(response.data);
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
    navigate(`/app/treatments/${treatment.id}`);
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

  const handleDeleteVisit = async (visitId) => {
    if (window.confirm('Are you sure you want to delete this visit?')) {
      try {
        await visitsApi.delete(visitId);
        await fetchVisitsForTreatment(selectedTreatment.id);
        alert('Visit deleted successfully!');
      } catch (error) {
        console.error('Error deleting visit:', error);
        alert(error.response?.data?.detail || 'Error deleting visit');
      }
    }
  };

  const filteredTreatments = treatments.filter(treatment => {
    const matchesType = filterType === 'all' || treatment.type_of_treatment === filterType;
    const matchesStatus = filterStatus === 'all' || treatment.status === filterStatus;
    return matchesType && matchesStatus;
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Treatments</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Treatment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 min-w-0">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            className="flex-1 min-w-0 form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Treatment Types</option>
            {treatmentTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2 min-w-0">
          <select
            className="flex-1 min-w-0 form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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

      {/* Treatments Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treatment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Option
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimated Duration / Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Planned Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTreatments.map((treatment) => (
                <tr
                  key={treatment.id}
                  onClick={() => handleViewTreatment(treatment)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {treatment.patient_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {treatment.type_of_treatment_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {treatment.braces_type || treatment.cap_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {treatment.estimated_duration_months ? (
                      treatment.type_of_treatment_name?.toLowerCase().includes('root canal')
                        ? `${treatment.estimated_duration_months} visits`
                        : `${treatment.estimated_duration_months} months`
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatAmount(treatment.planned_amount)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewTreatment(treatment)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                          {visit.next_visit_date ? new Date(visit.next_visit_date).toLocaleDateString() : 'N/A'}
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
                            onClick={() => handleDeleteVisit(visit.id)}
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
                  value={visitFormData.next_visit_date}
                  onChange={(e) => setVisitFormData({...visitFormData, next_visit_date: e.target.value})}
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
    </div>
  );
};

export default Treatments;
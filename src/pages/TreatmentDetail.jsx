import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar, X } from 'lucide-react';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi, visitImagesApi } from '../api/visitsApi';

const TreatmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [treatment, setTreatment] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [visitFormData, setVisitFormData] = useState({
    next_visit_date: '',
    treatment_notes: '',
    patient_complaints: '',
    patient_payment_amount: '',
    patient_payment_type: 'cash',
    payment_note: ''
  });

  useEffect(() => {
    fetchTreatmentDetail();
  }, [id]);

  const fetchTreatmentDetail = async () => {
    try {
      const res = await treatmentApi.getById(id);
      setTreatment(res.data);
      setVisits(res.data.treatment_visits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    const res = await visitsApi.getByTreatment(id);
    setVisits(res.data);
  };

  const handleDeleteVisit = async (visitId) => {
    await visitsApi.delete(visitId);
    fetchVisits();
  };

  const handleDeleteImage = async (imageId) => {
    await visitImagesApi.delete(imageId);
    fetchVisits();
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
        treatment: treatment.id,
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
      await fetchVisits();
      alert('Visit added successfully!');
    } catch (error) {
      console.error('Error creating visit:', error);
      alert(error.response?.data?.detail || 'Error creating visit');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!treatment) {
    return <div className="text-center py-10">Not found</div>;
  }

  return (
    <div className="space-y-6">

      {/* 🔷 Back */}
      <button
        onClick={() => navigate('/treatments')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Treatments
      </button>

      {/* 🔷 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-xl p-4 border">
          <p className="text-xs text-gray-500">Treatment</p>
          <p className="font-semibold">{treatment.type_of_treatment_name}</p>
        </div>

        <div className="bg-white shadow rounded-xl p-4 border">
          <p className="text-xs text-gray-500">Status</p>
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
            {treatment.status}
          </span>
        </div>

        <div className="bg-white shadow rounded-xl p-4 border">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-semibold">
            {treatment.estimated_duration_months || 'N/A'} months
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-4 border">
          <p className="text-xs text-gray-500">Amount</p>
          <p className="font-semibold text-green-600">
            {formatAmount(treatment.planned_amount)}
          </p>
        </div>
      </div>

      {/* 🔷 Patient Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow border">
          <h3 className="font-semibold mb-3">Patient Info</h3>
          <p>Name: {treatment.patient_name}</p>
          <p>DOB: {treatment.patient_date_of_birth || 'N/A'}</p>
          <p>Gender: {treatment.patient_gender || 'N/A'}</p>
          <p>Mobile: {treatment.patient_mobile || 'N/A'}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <h3 className="font-semibold mb-3">Treatment Plan</h3>
          <p>{treatment.treatment_plan || 'N/A'}</p>
        </div>
      </div>

      {/* 🔷 Visits Timeline */}
      <div className="bg-white rounded-xl shadow p-6 border">

        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">Treatment Timeline</h2>

          <button
            onClick={() => setShowAddVisitModal(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Visit</span>
          </button>
        </div>

        {visits.map((visit) => (
          <div key={visit.id} className="mb-6 border-l-2 pl-4 relative">

            <div className="absolute left-[-6px] top-2 w-3 h-3 bg-blue-600 rounded-full"></div>

            <div className="bg-gray-50 p-4 rounded-xl">

              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {new Date(visit.next_visit_date).toLocaleDateString()}
                </div>

                <span className="text-green-600 font-semibold">
                  {formatAmount(visit.patient_payment_amount)}
                </span>
              </div>

              <p className="text-sm mt-2">
                {visit.treatment_notes || 'No notes'}
              </p>

              <button
                onClick={() =>
                  setExpandedVisit(expandedVisit === visit.id ? null : visit.id)
                }
                className="text-blue-600 text-xs mt-2"
              >
                {expandedVisit === visit.id ? 'Hide' : 'View Details'}
              </button>

              {expandedVisit === visit.id && (
                <div className="mt-3">

                  {/* Images */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {visit.visit_images?.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.image_url}
                          className="rounded-lg h-28 w-full object-cover"
                        />
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDeleteVisit(visit.id)}
                    className="mt-3 text-red-600 text-sm"
                  >
                    Delete Visit
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

      </div>

      {/* Add Visit Modal */}
      {showAddVisitModal && treatment && (
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

export default TreatmentDetail;
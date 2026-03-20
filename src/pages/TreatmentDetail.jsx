import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react';
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

    </div>
  );
};

export default TreatmentDetail;
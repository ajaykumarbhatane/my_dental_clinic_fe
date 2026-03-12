import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Upload, Trash2, Calendar } from 'lucide-react';
import { treatmentApi } from '../api/treatmentApi';
import { visitsApi, visitImagesApi } from '../api/visitsApi';

const TreatmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [treatment, setTreatment] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState({});
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [visitFormData, setVisitFormData] = useState({
    next_visit_date: '',
    treatment_notes: '',
    patient_complaints: '',
    patient_payment_amount: '',
    patient_payment_type: 'cash',
    payment_note: ''
  });

  const [imageFormData, setImageFormData] = useState({
    visit_id: null,
    image: null,
    caption: ''
  });

  useEffect(() => {
    fetchTreatmentDetail();
  }, [id]);

  const fetchTreatmentDetail = async () => {
    try {
      setLoading(true);
      const response = await treatmentApi.getById(id);
      setTreatment(response.data);
      
      // Set visits from nested data if available
      if (response.data.treatment_visits) {
        setVisits(response.data.treatment_visits);
      }
    } catch (error) {
      console.error('Error fetching treatment detail:', error);
      alert('Error loading treatment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await visitsApi.getByTreatment(id);
      setVisits(response.data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!visitFormData.next_visit_date) {
        alert('Please select a visit date');
        setSubmitting(false);
        return;
      }

      const payload = {
        treatment: id,
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
      setSubmitting(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFormData({ ...imageFormData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async (visitId) => {
    if (!imageFormData.image) {
      alert('Please select an image to upload');
      return;
    }

    setUploadingImage({ ...uploadingImage, [visitId]: true });

    try {
      const payload = {
        visit: visitId,
        image: imageFormData.image,
        caption: imageFormData.caption || ''
      };

      await visitImagesApi.create(payload);
      setImageFormData({ visit_id: null, image: null, caption: '' });
      setImagePreview(null);
      setExpandedVisit(null);
      await fetchVisits();
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.response?.data?.detail || 'Error uploading image');
    } finally {
      setUploadingImage({ ...uploadingImage, [visitId]: false });
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await visitImagesApi.delete(imageId);
        await fetchVisits();
        alert('Image deleted successfully!');
      } catch (error) {
        console.error('Error deleting image:', error);
        alert(error.response?.data?.detail || 'Error deleting image');
      }
    }
  };

  const handleDeleteVisit = async (visitId) => {
    if (window.confirm('Are you sure you want to delete this visit?')) {
      try {
        await visitsApi.delete(visitId);
        await fetchVisits();
        alert('Visit deleted successfully!');
      } catch (error) {
        console.error('Error deleting visit:', error);
        alert(error.response?.data?.detail || 'Error deleting visit');
      }
    }
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Treatment not found</p>
        <button
          onClick={() => navigate('/treatments')}
          className="mt-4 text-blue-600 hover:text-blue-900"
        >
          Back to Treatments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/treatments')}
          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Treatments</span>
        </button>
      </div>

      {/* Treatment Information Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Treatment Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Treatment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Treatment Type</label>
                <p className="text-gray-900">{treatment.type_of_treatment_name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  treatment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  treatment.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                  treatment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                  treatment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {treatment.status}
                </span>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Duration</label>
                <p className="text-gray-900">{treatment.estimated_duration_months ? `${treatment.estimated_duration_months} months` : 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Planned Amount</label>
                <p className="text-gray-900">{formatAmount(treatment.planned_amount)}</p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Patient Name</label>
                <p className="text-gray-900">{treatment.patient_name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Date of Birth</label>
                <p className="text-gray-900">
                  {treatment.patient_date_of_birth ? new Date(treatment.patient_date_of_birth).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Gender</label>
                <p className="text-gray-900">{treatment.patient_gender || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Mobile</label>
                <p className="text-gray-900">{treatment.patient_mobile || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment Plan and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {treatment.treatment_plan && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Treatment Plan</h4>
              <p className="text-sm text-gray-600">{treatment.treatment_plan}</p>
            </div>
          )}
          {treatment.initial_findings && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Initial Findings</h4>
              <p className="text-sm text-gray-600">{treatment.initial_findings}</p>
            </div>
          )}
          {treatment.treatment_notes && (
            <div className="bg-purple-50 rounded-lg p-4 md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Treatment Notes</h4>
              <p className="text-sm text-gray-600">{treatment.treatment_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Visits and Images Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Treatment Visits</h2>
          <button
            onClick={() => setShowAddVisitModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Visit</span>
          </button>
        </div>

        {visits.length > 0 ? (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Visit Header */}
                <div
                  onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                  className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          {visit.next_visit_date ? new Date(visit.next_visit_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {visit.treatment_notes ? visit.treatment_notes.substring(0, 100) : 'No notes'}
                        {visit.treatment_notes && visit.treatment_notes.length > 100 ? '...' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatAmount(visit.patient_payment_amount)}
                      </p>
                      <p className="text-xs text-gray-500">{visit.patient_payment_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Details (Expanded) */}
                {expandedVisit === visit.id && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {visit.treatment_notes && (
                        <div className="bg-blue-50 p-3 rounded">
                          <h5 className="text-sm font-semibold text-gray-900 mb-1">Treatment Notes</h5>
                          <p className="text-sm text-gray-600">{visit.treatment_notes}</p>
                        </div>
                      )}
                      {visit.patient_complaints && (
                        <div className="bg-red-50 p-3 rounded">
                          <h5 className="text-sm font-semibold text-gray-900 mb-1">Patient Complaints</h5>
                          <p className="text-sm text-gray-600">{visit.patient_complaints}</p>
                        </div>
                      )}
                      {visit.payment_note && (
                        <div className="bg-green-50 p-3 rounded md:col-span-2">
                          <h5 className="text-sm font-semibold text-gray-900 mb-1">Payment Note</h5>
                          <p className="text-sm text-gray-600">{visit.payment_note}</p>
                        </div>
                      )}
                    </div>

                    {/* Visit Images */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-900 mb-4">Visit Images</h5>
                      
                      {visit.visit_images && visit.visit_images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                          {visit.visit_images.map((image) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.image_url}
                                alt={image.caption || 'Visit image'}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              {image.caption && (
                                <p className="text-xs text-gray-600 mt-1 text-center">{image.caption}</p>
                              )}
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mb-4">No images uploaded yet</p>
                      )}

                      {/* Image Upload Form */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Upload Image</h6>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Image
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          {imagePreview && (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-h-40 rounded-lg border border-gray-200"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Image Caption (Optional)
                            </label>
                            <input
                              type="text"
                              value={imageFormData.caption}
                              onChange={(e) => setImageFormData({ ...imageFormData, caption: e.target.value })}
                              placeholder="e.g., Before treatment, After treatment"
                              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => handleUploadImage(visit.id)}
                            disabled={uploadingImage[visit.id] || !imageFormData.image}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{uploadingImage[visit.id] ? 'Uploading...' : 'Upload Image'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Visit Button */}
                    <button
                      onClick={() => handleDeleteVisit(visit.id)}
                      className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Delete Visit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No visits scheduled yet</p>
            <button
              onClick={() => setShowAddVisitModal(true)}
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              Add first visit
            </button>
          </div>
        )}
      </div>

      {/* Add Visit Modal */}
      {showAddVisitModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
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
                <label className="block text-sm font-medium text-gray-700">
                  Next Visit Date * <span className="text-xs text-red-600">{!visitFormData.next_visit_date ? '(Required)' : ''}</span>
                </label>
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
                  disabled={submitting || !visitFormData.next_visit_date}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Visit'}
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

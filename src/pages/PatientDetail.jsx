import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Edit, ArrowLeft } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { treatmentApi } from '../api/treatmentApi';

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      const [patientResponse, treatmentsResponse] = await Promise.all([
        patientApi.getById(id),
        treatmentApi.getAll()
      ]);
      setPatient(patientResponse.data);
      // Filter treatments for this patient
      // patient IDs are string keys; compare directly
      setTreatments(treatmentsResponse.data.filter(t => t.patient === id));
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!patient) {
    return <div className="text-center text-gray-500">Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/patients"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {patient.first_name} {patient.last_name}
          </h1>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <Edit className="w-5 h-5" />
          <span>Edit Patient</span>
        </button>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{patient.first_name} {patient.last_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile</label>
            <p className="mt-1 text-sm text-gray-900">{patient.mobile}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <p className="mt-1 text-sm text-gray-900">{patient.gender}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <p className="mt-1 text-sm text-gray-900">{patient.date_of_birth || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <p className="mt-1 text-sm text-gray-900">{patient.address || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Medical History</label>
            <p className="mt-1 text-sm text-gray-900">{patient.medical_history || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Dental History</label>
            <p className="mt-1 text-sm text-gray-900">{patient.dental_history || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Treatments Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Treatments</h2>
        {treatments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treatment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Duration
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
                {treatments.map((treatment) => (
                  <tr key={treatment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {treatment.type_of_treatment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        treatment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        treatment.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        treatment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {treatment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.estimated_duration_months ? `${treatment.estimated_duration_months} months` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {treatment.planned_amount ? formatAmount(treatment.planned_amount) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/treatments/${treatment.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No treatments found for this patient.</p>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;
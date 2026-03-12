import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
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
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientApi.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await userApi.getAll();
      setDoctors(response.data);
      // Auto-select current user if available
      if (user) {
        setFormData(prev => ({...prev, user: user.id}));
      } else if (response.data.length > 0) {
        setFormData(prev => ({...prev, user: response.data[0].id}));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare payload with selected doctor/user ID
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile: formData.mobile,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        medical_history: formData.medical_history,
        dental_history: formData.dental_history,
        user: formData.user
      };

      await patientApi.create(payload);
      setShowAddModal(false);
      setFormData({
        first_name: '',
        last_name: '',
        mobile: '',
        gender: '',
        date_of_birth: '',
        address: '',
        medical_history: '',
        dental_history: '',
        user: user ? user.id : (doctors.length > 0 ? doctors[0].id : '')
      });
      fetchPatients(); // Refresh the list
    } catch (error) {
      console.error('Error creating patient:', error);
      alert(error.response?.data?.detail || 'Error creating patient');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.mobile.includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and view all patient records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            className="flex-1 border-0 focus:ring-0 focus:outline-none text-sm font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-5xl mb-4">🔍</div>
                      <p className="text-gray-500 font-medium">No patients found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        📱 {patient.mobile}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                        {patient.gender || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New Patient</h3>
                <p className="text-sm text-gray-600 mt-1">Fill in the patient information below</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddPatient} className="p-6 space-y-5">
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Doctor Selection *</label>
                <select
                  required
                  value={formData.user}
                  onChange={(e) => setFormData({...formData, user: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  placeholder="Enter patient address"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Medical History</label>
                <textarea
                  rows={3}
                  value={formData.medical_history}
                  onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  placeholder="Enter medical history"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dental History</label>
                <textarea
                  rows={3}
                  value={formData.dental_history}
                  onChange={(e) => setFormData({...formData, dental_history: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  placeholder="Enter dental history"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {submitting ? 'Adding...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Phone, X } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import { clinicApi } from '../api/clinicApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/dateUtils';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add Patient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    gender: '',
    date_of_birth: '',
    address: '',
    medical_history: '',
    dental_history: ''
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchPatients(currentPage, searchTerm);
  }, [currentPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPatients(1, searchTerm);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch clinics and doctors when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchClinics();
      fetchDoctors();
    }
  }, [showAddModal]);

  const fetchPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = { page };
      if (search) params.search = search;

      const res = await patientApi.getAll(params);

      setPatients(res.data.results || res.data);
      setTotalCount(res.data.count || res.data.length);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 10));
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinics for dropdown
  const fetchClinics = async () => {
    try {
      const response = await clinicApi.getAll();
      setClinics(response.data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  // Fetch doctors for dropdown
  const fetchDoctors = async () => {
    try {
      const response = await userApi.getAll();
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // Handle form submission
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile: formData.mobile,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        medical_history: formData.medical_history,
        dental_history: formData.dental_history
      };

      await patientApi.create(payload);

      // Reset form and close modal
      setFormData({
        first_name: '',
        last_name: '',
        mobile: '',
        gender: '',
        date_of_birth: '',
        address: '',
        medical_history: '',
        dental_history: ''
      });
      setShowAddModal(false);

      // Refresh patient list
      fetchPatients(currentPage, searchTerm);

    } catch (error) {
      console.error('Error creating patient:', error);
      alert(error.response?.data?.detail || 'Error creating patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ DELETE FUNCTION
  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this patient?");
      if (!confirmDelete) return;

      await patientApi.delete(id);

      // Refresh list after delete
      fetchPatients(currentPage, searchTerm);

    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete patient");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-40">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow hover:shadow-lg transition-shadow"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients..."
          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Container */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full">

            {/* Header */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-sm text-gray-600">
                <th className="px-5 py-3 text-left font-semibold">Patient</th>
                <th className="px-5 py-3 text-left font-semibold">Mobile</th>
                <th className="px-5 py-3 text-left font-semibold">Doctor</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y">
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => navigate(`${patient.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition"
                >

                  {/* Patient */}
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">
                      {patient.first_name} <br /> {patient.last_name}
                    </span>
                  </td>

                  {/* Mobile */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {patient.mobile && (
                        <a
                          href={`tel:${patient.mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <span className="text-gray-600">
                        {patient.mobile || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Doctor */}
                  <td className="px-5 py-3 text-gray-600">
                    {patient.assigned_doctor || 'N/A'}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(patient.created_at)}
                  </td>

                  {/* Actions */}
                  <td
                    className="px-5 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-3">

                      <Eye className="w-4 h-4 text-blue-600 cursor-pointer" />

                      <Edit className="w-4 h-4 text-yellow-600 cursor-pointer" />

                      {/* ✅ DELETE FIX */}
                      <Trash2
                        className="w-4 h-4 text-red-600 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(patient.id);
                        }}
                      />

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemCountText={`${((currentPage - 1) * 10) + 1} - ${Math.min(currentPage * 10, totalCount)} of ${totalCount}`}
            />
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Patient</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical History
                  </label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter medical history"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dental History
                  </label>
                  <textarea
                    name="dental_history"
                    value={formData.dental_history}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter dental history"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add Patient'}
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
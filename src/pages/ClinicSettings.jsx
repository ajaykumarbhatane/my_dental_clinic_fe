import { useState, useEffect } from 'react';
import { Edit, Save, AlertCircle, Check, Plus, Pill, Trash2 } from 'lucide-react';
import { userApi } from '../api/userApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { formatDate } from '../utils/dateUtils';

const ClinicSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: '',
    joining_date: '',
  });

  // Clinic Medicine state
  const [medicines, setMedicines] = useState([]);
  const [medicineLoading, setMedicineLoading] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    medicine_name: '',
    generic_name: '',
    strength: '',
    form: 'tablet',
    description: ''
  });

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchUserProfile();
    } else if (activeTab === 'medicines') {
      fetchClinicMedicines();
    }
  }, [activeTab]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.getAll();
      const users = response.data?.results || response.data || [];
      
      if (users.length > 0) {
        const user = users[0];
        setUserData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
          role: user.role || '',
          joining_date: user.joining_date || '',
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicMedicines = async () => {
    try {
      setMedicineLoading(true);
      const response = await prescriptionApi.getClinicMedicines();
      setMedicines(response.data?.results || response.data || []);
    } catch (err) {
      console.error('Error fetching clinic medicines:', err);
      setError('Failed to load clinic medicines');
    } finally {
      setMedicineLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allUsers = await userApi.getAll();
      const users = allUsers.data?.results || allUsers.data || [];
      const currentUser = users[0];
      
      if (currentUser?.id) {
        await userApi.update(currentUser.id, {
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone_number: userData.phone_number,
        });
        setIsEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMedicine = async () => {
    try {
      setMedicineLoading(true);
      await prescriptionApi.createClinicMedicine(newMedicine);
      setNewMedicine({
        medicine_name: '',
        generic_name: '',
        strength: '',
        form: 'tablet',
        description: ''
      });
      setShowAddMedicine(false);
      fetchClinicMedicines();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding medicine:', err);
      setError('Failed to add medicine');
    } finally {
      setMedicineLoading(false);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    
    try {
      setMedicineLoading(true);
      await prescriptionApi.deleteClinicMedicine(id);
      fetchClinicMedicines();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error deleting medicine:', err);
      setError('Failed to delete medicine');
    } finally {
      setMedicineLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Edit },
    { id: 'medicines', label: 'Clinic Medicines', icon: Pill }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinic Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage clinic configuration and your account</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6 animate-in fade-in slide-in-from-top-2">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              {activeTab === 'profile' ? 'Profile updated successfully!' : 'Operation completed successfully!'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-600 mt-1">Update your personal details</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  <Save className="w-5 h-5" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}
            </div>

            {loading && !userData.email ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading profile...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                      {userData.first_name}
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                      {userData.last_name}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                      {userData.email}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={userData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                      {userData.phone_number || 'Not Set'}
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                  <div className="px-4 py-2.5 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-bold capitalize">{userData.role || 'N/A'}</span>
                  </div>
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Joining Date</label>
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {formatDate(userData.joining_date)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clinic Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Clinic Medicines</h2>
                <p className="text-sm text-gray-600 mt-1">Manage medicines available in your clinic</p>
              </div>
              <button
                onClick={() => setShowAddMedicine(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                <span>Add Medicine</span>
              </button>
            </div>

            {medicineLoading && medicines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading medicines...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicines.map((medicine) => (
                  <div key={medicine.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{medicine.medicine_name}</h3>
                        {medicine.generic_name && (
                          <p className="text-sm text-gray-600">Generic: {medicine.generic_name}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          {medicine.strength && <span>Strength: {medicine.strength}</span>}
                          <span>Form: {medicine.form}</span>
                        </div>
                        {medicine.description && (
                          <p className="text-sm text-gray-700 mt-2">{medicine.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMedicine(medicine.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        disabled={medicineLoading}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Medicine Modal/Form */}
            {showAddMedicine && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Medicine</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Medicine Name *</label>
                      <input
                        type="text"
                        value={newMedicine.medicine_name}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, medicine_name: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Generic Name</label>
                      <input
                        type="text"
                        value={newMedicine.generic_name}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, generic_name: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Strength</label>
                      <input
                        type="text"
                        value={newMedicine.strength}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, strength: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Form</label>
                      <select
                        value={newMedicine.form}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, form: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="tablet">Tablet</option>
                        <option value="capsule">Capsule</option>
                        <option value="syrup">Syrup</option>
                        <option value="gel">Gel</option>
                        <option value="mouthwash">Mouthwash</option>
                        <option value="ointment">Ointment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newMedicine.description}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddMedicine(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMedicine}
                      disabled={medicineLoading || !newMedicine.medicine_name.trim()}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {medicineLoading ? 'Adding...' : 'Add Medicine'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicSettings;
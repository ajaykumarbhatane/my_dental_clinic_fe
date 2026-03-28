import { useState, useEffect } from 'react';
import { Edit, Save, AlertCircle, Check } from 'lucide-react';
import { userApi } from '../api/userApi';
import { formatDate } from '../utils/dateUtils';

const Settings = () => {
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

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user info from localStorage or API
      // Typically the first /user call gets current user
      const response = await userApi.getAll();
      const users = response.data || [];
      
      if (users.length > 0) {
        // Use the first user (current logged-in user)
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

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Update user profile
      // Get user ID - in a real app, store this from login
      const allUsers = await userApi.getAll();
      const currentUser = allUsers.data?.[0];
      
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
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

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Profile updated successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && !userData.email ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      ) : (
        <>
          {/* Profile Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-600 mt-1">Update your personal details</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                {userData.first_name.charAt(0)}{userData.last_name.charAt(0)}
              </div>
            </div>

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
          </div>

          {/* System Preferences Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-lg transition-shadow">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">System Preferences</h2>
              <p className="text-sm text-gray-600 mt-1">Customize your experience</p>
            </div>

            <div className="space-y-5">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600 mt-1">Receive email notifications for appointments and updates</p>
                </div>
                <div className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="h-6 w-6 transform rounded-full bg-white transition-transform peer-checked:translate-x-6"></div>
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between p-5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">SMS Notifications</h3>
                  <p className="text-sm text-gray-600 mt-1">Receive SMS reminders for upcoming appointments</p>
                </div>
                <div className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="h-6 w-6 transform rounded-full bg-white transition-transform peer-checked:translate-x-6"></div>
                </div>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between p-5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">Dark Mode</h3>
                  <p className="text-sm text-gray-600 mt-1">Use dark theme for the interface (coming soon)</p>
                </div>
                <div className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors opacity-50 cursor-not-allowed">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="h-6 w-6 transform rounded-full bg-white transition-transform peer-checked:translate-x-6"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-red-600">Danger Zone</h2>
              <p className="text-sm text-gray-600 mt-1">Irreversible actions</p>
            </div>

            <button className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg border border-red-200 transition-colors">
              Change Password
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
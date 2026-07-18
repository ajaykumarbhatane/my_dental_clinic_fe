import { useState, useEffect } from 'react';
import { Edit, Save, AlertCircle, Check, Plus, Pill, Trash2 } from 'lucide-react';
import { userApi } from '../api/userApi';
import { clinicApi } from '../api/clinicApi';
import { clinicDoctorApi } from '../api/clinicDoctorApi';
import { prescriptionApi } from '../api/prescriptionApi';
import ChoiceSelect from '../components/ChoiceSelect';
import { formatDate } from '../utils/dateUtils';

const InfoRow = ({ label, value }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
    <div className="w-32 shrink-0">
      <span className="text-sm font-medium text-slate-500">
        {label}
      </span>
    </div>

    <div className="flex-1">
      <span className="text-sm font-semibold text-slate-900">
        {value || 'N/A'}
      </span>
    </div>
  </div>
);

const ClinicSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [originalUserData, setOriginalUserData] = useState({});
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: '',
    joining_date: '',
    qualification: '',
    registration_number: '',
  });
  const [clinic, setClinic] = useState(null);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [clinicEditing, setClinicEditing] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberStep, setAddMemberStep] = useState('createUser');
  const [newMember, setNewMember] = useState({ doctor_id: '', role: 'ASSOCIATE' });
  const [newUserForm, setNewUserForm] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    gender: '', 
    phone_number: '', 
    secondary_phone_number: '', 
    role: 'Staff', 
    password: '',
    date_of_birth: '',
    qualification: ''
  });
  const [createdUser, setCreatedUser] = useState(null);

  // Clinic Medicine state
  const [medicines, setMedicines] = useState([]);
  const [medicineLoading, setMedicineLoading] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicineModalMode, setMedicineModalMode] = useState('add');
  const [editingMedicineId, setEditingMedicineId] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    medicine_name: '',
    strength: '',
    form: 'tablet',
    description: ''
  });

  useEffect(() => {
    if (activeTab === 'profile' || activeTab === 'clinic_info') {
      fetchUserProfile();
      fetchClinicInfo();
      fetchClinicMembers();
    } else if (activeTab === 'medicines') {
      fetchClinicMedicines();
    }
  }, [activeTab]);

  useEffect(() => {
    // refetch members only when clinic ID changes, not when fields are edited
    if (clinic && clinic.id && activeTab === 'clinic_info') fetchClinicMembers();
  }, [clinic?.id, activeTab]);

  const handleCreateUser = async () => {
    try {
      setMembersLoading(true);
      setError(null);
      
      // Validate mandatory fields
      if (!newUserForm.first_name.trim()) {
        setError('First Name is required');
        setMembersLoading(false);
        return;
      }
      if (!newUserForm.last_name.trim()) {
        setError('Last Name is required');
        setMembersLoading(false);
        return;
      }
      if (!newUserForm.email.trim()) {
        setError('Email is required');
        setMembersLoading(false);
        return;
      }
      if (!newUserForm.gender) {
        setError('Gender is required');
        setMembersLoading(false);
        return;
      }
      if (!newUserForm.password.trim()) {
        setError('Password is required');
        setMembersLoading(false);
        return;
      }
      
      const payload = {
        first_name: newUserForm.first_name,
        last_name: newUserForm.last_name,
        email: newUserForm.email,
        gender: newUserForm.gender,
        role: newUserForm.role,
        password: newUserForm.password,
      };
      
      if (newUserForm.phone_number) payload.phone_number = newUserForm.phone_number;
      if (newUserForm.secondary_phone_number) payload.secondary_phone_number = newUserForm.secondary_phone_number;
      if (newUserForm.date_of_birth) payload.date_of_birth = newUserForm.date_of_birth;
      if (newUserForm.qualification) payload.qualification = newUserForm.qualification;
      
      const res = await userApi.create(payload);
      const user = res.data;
      setCreatedUser(user);
      // move to assign step
      setAddMemberStep('assignMember');
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.getMe();
      const user = response.data;
      
      const profileData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        role: user.role || '',
        joining_date: user.joining_date || '',
        qualification: user.qualification || '',
        registration_number: user.registration_number || '',
      };

      setUserData((prev) => ({
        ...prev,
        ...profileData,
      }));
      setOriginalUserData((prev) => ({
        ...prev,
        ...profileData,
      }));
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

  const fetchClinicInfo = async () => {
    try {
      setClinicLoading(true);
      const response = await clinicApi.getAll();
      const clinics = response.data?.results || response.data || [];
      const activeClinic = clinics[0] || null;
      setClinic(activeClinic);
    } catch (err) {
      console.error('Error fetching clinic info:', err);
      setError('Failed to load clinic information');
    } finally {
      setClinicLoading(false);
    }
  };

  const fetchClinicMembers = async () => {
    try {
      setMembersLoading(true);
      setError(null);
      const params = clinic?.id ? { clinic: clinic.id } : {};
      const response = await clinicDoctorApi.getAll(params);
      const data = response.data?.results || response.data || [];
      setMembers(data);
    } catch (err) {
      console.error('Error fetching clinic members:', err);
      setError('Failed to load clinic members');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.getMe();
      const currentUser = response.data;
      
      if (currentUser?.id) {
        const userChangedFields = {};
        Object.keys(userData).forEach(key => {
          if (key === 'clinic_name') return;
          if (userData[key] !== originalUserData[key]) {
            userChangedFields[key] = userData[key];
          }
        });

        if (Object.keys(userChangedFields).length > 0) {
          await userApi.update(currentUser.id, userChangedFields);
          setOriginalUserData(userData); // Update original data with new values
          setIsEditing(false);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setIsEditing(false); // No changes made
        }
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

  const handleSaveMedicine = async () => {
    try {
      setMedicineLoading(true);

      if (medicineModalMode === 'edit' && editingMedicineId) {
        await prescriptionApi.updateClinicMedicine(editingMedicineId, newMedicine);
      } else {
        await prescriptionApi.createClinicMedicine(newMedicine);
      }

      setNewMedicine({
        medicine_name: '',
        strength: '',
        form: 'tablet',
        description: ''
      });
      setMedicineModalMode('add');
      setEditingMedicineId(null);
      setShowAddMedicine(false);
      fetchClinicMedicines();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving medicine:', err);
      setError('Failed to save medicine');
    } finally {
      setMedicineLoading(false);
    }
  };

  const handleEditMedicine = (medicine) => {
    setNewMedicine({
      medicine_name: medicine.medicine_name || '',
      strength: medicine.strength || '',
      form: medicine.form || 'tablet',
      description: medicine.description || ''
    });
    setEditingMedicineId(medicine.id);
    setMedicineModalMode('edit');
    setShowAddMedicine(true);
    setError(null);
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
    { id: 'clinic_info', label: 'Clinic Information', icon: Edit },
    { id: 'medicines', label: 'Clinic Medicines', icon: Pill }
  ];

  const handleClinicInputChange = (field, value) => {
    setClinic((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const handleClinicSave = async () => {
    try {
      setClinicLoading(true);
      setError(null);
      if (clinic && clinic.id) {
        const payload = {
          name: clinic.name,
          contact_number: clinic.contact_number,
          address: clinic.address,
          city: clinic.city,
          description: clinic.description,
        };
        await clinicApi.update(clinic.id, payload);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving clinic info:', err);
      setError('Failed to save clinic information');
    } finally {
      setClinicLoading(false);
    }
  };

  const handleAssignMember = async () => {
    try {
      setMembersLoading(true);
      setError(null);
      if (!clinic?.id || !createdUser?.id) {
        setError('Clinic or user not available');
        return;
      }
      const payload = {
        clinic_id: clinic.id,
        doctor_id: createdUser.id,
        role: newMember.role,
      };
      await clinicDoctorApi.create(payload);
      setShowAddMemberModal(false);
      setNewMember({ doctor_id: '', role: 'ASSOCIATE' });
      setNewUserForm({ 
        first_name: '', 
        last_name: '', 
        email: '', 
        gender: '',
        phone_number: '', 
        secondary_phone_number: '', 
        role: 'Staff', 
        password: '',
        date_of_birth: '',
        qualification: ''
      });
      setCreatedUser(null);
      setAddMemberStep('createUser');
      fetchClinicMembers();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error assigning clinic member:', err);
      setError('Failed to add member to clinic');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleRemoveMember = async (id) => {
    if (!confirm('Remove this member from clinic?')) return;
    try {
      setMembersLoading(true);
      await clinicDoctorApi.delete(id);
      fetchClinicMembers();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
    } finally {
      setMembersLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-gradient-to-r from-blue-800 to-cyan-500 p-8 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">CLINIC SETTINGS</h1>
            <p className="text-sm uppercase tracking-[0.1em] text-sky-300">Manage your clinic profile and medicines.</p>
          </div>
          
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-[24px] bg-slate-100 p-3">
          <div className="grid grid-cols-2 gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-[16px] px-4 py-4 text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-md'
                      : 'text-slate-500 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

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
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                  PROFILE OVERVIEW
                </p>
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
              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  {isEditing ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">First Name</label>
                        <input
                          type="text"
                          value={userData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>

                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={userData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>

                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Email</label>
                        <input
                          type="email"
                          value={userData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>

                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={userData.phone_number}
                          onChange={(e) => handleInputChange('phone_number', e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>

                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Qualification</label>
                        <input
                          type="text"
                          value={userData.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>

                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Registration</label>
                        <input
                          type="text"
                          value={userData.registration_number}
                          onChange={(e) => handleInputChange('registration_number', e.target.value)}
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-0 md:grid-cols-2">
                      <InfoRow label="First Name" value={userData.first_name} />
                      <InfoRow label="Last Name" value={userData.last_name} />
                      <InfoRow label="Email" value={userData.email} />
                      <InfoRow label="Phone" value={userData.phone_number} />
                      <InfoRow label="Qualification" value={userData.qualification} />
                      <InfoRow label="Registration" value={userData.registration_number} />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Profile status</p>
                    <div className="mt-5 grid gap-4">
                      <div className="rounded-[24px] bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Role</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900 capitalize">{userData.role || 'N/A'}</p>
                      </div>
                      <div className="rounded-[24px] bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Joining Date</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">{formatDate(userData.joining_date) || 'TBA'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clinic Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            <div className="flex justify-end items-center">
              <button
                onClick={() => {
                  setMedicineModalMode('add');
                  setEditingMedicineId(null);
                  setNewMedicine({
                    medicine_name: '',
                    strength: '',
                    form: 'tablet',
                    description: ''
                  });
                  setShowAddMedicine(true);
                }}
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
              <div className="space-y-6">
               {/* <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Medicines
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {medicines.length}
                    </p>
                  </div>
                </div> */}

                {medicines.length === 0 ? (
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
                    No clinic medicines have been added yet. Use the button above to add your first medicine.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

  {/* Header */}
  <div className="grid grid-cols-[25%_25%_25%_25%] gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">

    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
      Medicine Name
    </div>

    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
      Form
    </div>

    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
      Strength
    </div>

    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 text-center">
      Actions
    </div>

  </div>

  {medicines.map((medicine) => (
    <div
      key={medicine.id}
      className="
  grid grid-cols-[25%_25%_25%_25%]
  gap-4
  items-center
  px-6 py-4
  border-b border-slate-100
  hover:bg-cyan-50
  transition-all
"
    >

      <div className="font-semibold text-slate-900">
        {medicine.medicine_name}
      </div>

      <div className="font-semibold text-slate-700 capitalize">
        {medicine.form}
      </div>

      <div className="font-semibold text-slate-700">
        {medicine.strength || 'N/A'}
      </div>

      <div className="flex justify-center gap-2">

        <button
          onClick={() => handleEditMedicine(medicine)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          <Edit className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em]">Edit</span>
        </button>

        <button
          onClick={() => handleDeleteMedicine(medicine.id)}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em]">Delete</span>
        </button>

      </div>

    </div>
  ))}

</div>
                )}
              </div>
            )}

            {/* Add Medicine Modal/Form */}
            {showAddMedicine && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                        {medicineModalMode === 'edit' ? 'Edit medicine' : 'New medicine'}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {medicineModalMode === 'edit' ? 'Edit Clinic Medicine' : 'Add Clinic Medicine'}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddMedicine(false);
                        setMedicineModalMode('add');
                        setEditingMedicineId(null);
                        setNewMedicine({
                          medicine_name: '',
                          strength: '',
                          form: 'tablet',
                          description: ''
                        });
                      }}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Medicine Name *</label>
                      <input
                        type="text"
                        value={newMedicine.medicine_name}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, medicine_name: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Strength</label>
                      <input
                        type="text"
                        value={newMedicine.strength}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, strength: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Form</label>
                      <select
                        value={newMedicine.form}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, form: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                      <textarea
                        value={newMedicine.description}
                        onChange={(e) => setNewMedicine(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        rows="4"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => {
                        setShowAddMedicine(false);
                        setMedicineModalMode('add');
                        setEditingMedicineId(null);
                        setNewMedicine({
                          medicine_name: '',
                          strength: '',
                          form: 'tablet',
                          description: ''
                        });
                      }}
                      className="flex-1 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveMedicine}
                      disabled={medicineLoading || !newMedicine.medicine_name.trim()}
                      className="flex-1 rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-white shadow-lg transition hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {medicineLoading ? (medicineModalMode === 'edit' ? 'Saving...' : 'Adding...') : medicineModalMode === 'edit' ? 'Save Changes' : 'Add Medicine'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clinic Information Tab */}
        {activeTab === 'clinic_info' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">CLINIC INFORMATION</p>
              </div>
              {!clinicEditing ? (
                <button
                  onClick={() => setClinicEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={clinicLoading}
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Clinic</span>
                </button>
              ) : (
                <button
                  onClick={handleClinicSave}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={clinicLoading}
                >
                  <Save className="w-5 h-5" />
                  <span>{clinicLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                {clinicLoading && !clinic ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading clinic info...</p>
                  </div>
                ) : (
                  (clinicEditing) ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Clinic Name</label>
                        <input type="text" value={clinic?.name || ''} onChange={(e) => handleClinicInputChange('name', e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                      </div>
                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Contact Number</label>
                        <input type="tel" value={clinic?.contact_number || ''} onChange={(e) => handleClinicInputChange('contact_number', e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                      </div>
                      <div className="md:col-span-2 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Address</label>
                        <textarea value={clinic?.address || ''} onChange={(e) => handleClinicInputChange('address', e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" rows={3} />
                      </div>
                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">City</label>
                        <input type="text" value={clinic?.city || ''} onChange={(e) => handleClinicInputChange('city', e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                      </div>
                      <div className="md:col-span-2 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Description</label>
                        <textarea value={clinic?.description || ''} onChange={(e) => handleClinicInputChange('description', e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" rows={3} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-0 md:grid-cols-2">
                      <InfoRow label="Clinic Name" value={clinic?.name} />
                      <InfoRow label="Contact Number" value={clinic?.contact_number} />
                      <InfoRow label="Address" value={clinic?.address} />
                      <InfoRow label="City" value={clinic?.city} />
                      <InfoRow label="Description" value={clinic?.description} />
                      <InfoRow label="Status" value={clinic?.status} />
                    </div>
                  )
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Clinic Details</p>
                  <div className="mt-5 grid gap-4">
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Status</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{clinic?.status || 'N/A'}</p>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Doctors</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{clinic?.doctors?.length || members.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Assigned Members List */}
        {activeTab === 'clinic_info' && (
          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Assigned Members</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAddMemberModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg">Add Member</button>
              </div>
            </div>

            {membersLoading && members.length === 0 ? (
              <div className="py-8 text-center text-slate-600">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-slate-600">No members assigned yet.</div>
            ) : (
              <div className="grid gap-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-md border border-slate-100">
                    <div>
                      <div className="font-semibold">{m.doctor?.first_name} {m.doctor?.last_name}</div>
                      <div className="text-sm text-slate-500">{m.doctor?.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-slate-700 mr-4">{m.role}</div>
                      <button onClick={() => handleRemoveMember(m.id)} className="text-red-600">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Member Modal (Two-step: Create User -> Assign to Clinic) */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white p-8 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Add Clinic Member</h3>
                <button onClick={() => { setShowAddMemberModal(false); setAddMemberStep('createUser'); setCreatedUser(null); setError(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {addMemberStep === 'createUser' ? (
                <div>
                  {error && <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">First Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={newUserForm.first_name} onChange={(e) => setNewUserForm(prev => ({ ...prev, first_name: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" placeholder="Enter first name" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={newUserForm.last_name} onChange={(e) => setNewUserForm(prev => ({ ...prev, last_name: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" placeholder="Enter last name" />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Email <span className="text-red-500">*</span></label>
                      <input type="email" required value={newUserForm.email} onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" placeholder="user@example.com" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Gender <span className="text-red-500">*</span></label>
                      <ChoiceSelect
                        which="user/gender"
                        required
                        value={newUserForm.gender}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        placeholder="Select Gender"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Phone Number</label>
                      <input type="tel" value={newUserForm.phone_number} onChange={(e) => setNewUserForm(prev => ({ ...prev, phone_number: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" placeholder="+91 XXXXX XXXXX" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Secondary Phone Number</label>
                      <input type="tel" value={newUserForm.secondary_phone_number} onChange={(e) => setNewUserForm(prev => ({ ...prev, secondary_phone_number: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" placeholder="+91 XXXXX XXXXX" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Date of Birth</label>
                      <input type="date" value={newUserForm.date_of_birth} onChange={(e) => setNewUserForm(prev => ({ ...prev, date_of_birth: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Qualification</label>
                      <input type="text" value={newUserForm.qualification} onChange={(e) => setNewUserForm(prev => ({ ...prev, qualification: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" placeholder="e.g., BDS, MDS" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Role <span className="text-red-500">*</span></label>
                      <ChoiceSelect
                        which="clinic/clinic-role"
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        placeholder="Select Role"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Password <span className="text-red-500">*</span></label>
                      <input type="password" required value={newUserForm.password} onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" placeholder="Enter secure password" />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button onClick={() => { setShowAddMemberModal(false); setAddMemberStep('createUser'); setCreatedUser(null); setError(null); }} className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={handleCreateUser} disabled={membersLoading} className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 font-medium text-white hover:shadow-lg transition disabled:opacity-50">{membersLoading ? 'Creating...' : 'Next'}</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 mb-6">
                    <div className="font-bold text-slate-900 text-lg">{createdUser?.first_name} {createdUser?.last_name}</div>
                    <div className="text-sm text-slate-600 mt-1">{createdUser?.email}</div>
                    <div className="text-xs text-slate-500 mt-2 bg-white rounded px-3 py-1 inline-block">User created successfully</div>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Clinic</label>
                      <input type="text" readOnly value={clinic?.name || ''} className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700 cursor-not-allowed" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Role in Clinic <span className="text-red-500">*</span></label>
                      <ChoiceSelect
                        which="clinic/clinic-role"
                        value={newMember.role}
                        onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        placeholder="Select clinic role"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => { setAddMemberStep('createUser'); setCreatedUser(null); setError(null); }} className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition">Back</button>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowAddMemberModal(false); setAddMemberStep('createUser'); setCreatedUser(null); setError(null); }} className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                      <button onClick={handleAssignMember} disabled={membersLoading} className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 font-medium text-white hover:shadow-lg transition disabled:opacity-50">{membersLoading ? 'Assigning...' : 'Assign'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicSettings;
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  X, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle2, 
  User, Building2, Lock, ShieldCheck, AlertCircle, Edit3,
  Phone, Mail, MapPin, Calendar, Award, FileText, Check
} from 'lucide-react';
import { clinicApi } from '../../api/clinicApi';
import RegistrationProgress from './RegistrationProgress';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toISODate = (val) => {
  if (!val) return '';
  if (val.includes('-')) return val;
  const parts = val.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return val;
};

const toDDMMYYYY = (val) => {
  if (!val) return '';
  const parts = val.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return val;
};

const RequestClinicFlow = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const containerRef = useRef(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: 'male',
    mobile: '',
    secondary_phone_number: '',
    date_of_birth: '',
    qualification: '',
    registration_number: '',
    clinic_name: '',
    contact_number: '',
    address: '',
    city: '',
    state: '',
    password: '',
    confirm_password: '',
    role: 'doctor',
    is_practicing_dentist: true,
    agree_terms: false,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto sync clinic contact number from doctor mobile if empty
      if (field === 'mobile' && (!prev.contact_number || prev.contact_number === prev.mobile)) {
        next.contact_number = value;
      }
      return next;
    });

    // Clear error for field on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors = {};
    const fname = form.first_name.trim();
    const lname = form.last_name.trim();
    const email = form.email.trim();
    const mobile = form.mobile.replace(/\D/g, '');

    if (!fname) {
      newErrors.first_name = 'First name is required.';
    } else if (/\d/.test(fname)) {
      newErrors.first_name = 'First name cannot contain numbers.';
    }

    if (!lname) {
      newErrors.last_name = 'Last name is required.';
    } else if (/\d/.test(lname)) {
      newErrors.last_name = 'Last name cannot contain numbers.';
    }

    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!mobile) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (mobile.length !== 10) {
      newErrors.mobile = 'Mobile number must contain exactly 10 digits.';
    }

    if (!form.gender) {
      newErrors.gender = 'Please select a gender.';
    }

    if (!form.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToTop();
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const newErrors = {};
    const cName = form.clinic_name.trim();
    const cContact = form.contact_number.replace(/\D/g, '');
    const addr = form.address.trim();

    if (!cName) {
      newErrors.clinic_name = 'Clinic name is required.';
    }

    if (!cContact) {
      newErrors.contact_number = 'Clinic contact number is required.';
    } else if (cContact.length !== 10) {
      newErrors.contact_number = 'Contact number must contain exactly 10 digits.';
    }

    if (!addr) {
      newErrors.address = 'Clinic address is required.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToTop();
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const newErrors = {};

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!form.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password.';
    } else if (form.password !== form.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match.';
    }

    if (!form.agree_terms) {
      newErrors.agree_terms = 'You must agree to the Terms of Service & Privacy Policy.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToTop();
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setApiError('');
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        scrollToTop();
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        scrollToTop();
      }
    }
  };

  const handlePrevStep = () => {
    setApiError('');
    if (currentStep > 1 && currentStep <= 3) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateStep3()) return;

    setSubmitting(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        gender: form.gender.toLowerCase(),
        mobile: form.mobile.trim(),
        secondary_phone_number: form.secondary_phone_number.trim() || undefined,
        date_of_birth: form.date_of_birth,
        password: form.password,
        confirm_password: form.confirm_password,
        role: (form.role || 'doctor').toLowerCase(),
        clinic_name: form.clinic_name.trim(),
        contact_number: form.contact_number.trim(),
        qualification: form.qualification.trim(),
        registration_number: form.registration_number.trim(),
        address: form.address.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
      };

      await clinicApi.signupRequest(payload);
      
      setCurrentStep('success');
      if (onSuccess) {
        onSuccess('Signup request submitted successfully. Please wait for admin approval.');
      }
    } catch (error) {
      console.error('Signup request submit error:', error);
      const msg = error?.response?.data?.detail || "We couldn't submit your request right now. Please check your connection and try again.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col md:items-center md:justify-center md:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full h-full md:h-auto md:max-w-2xl bg-white md:rounded-2xl shadow-2xl flex flex-col min-h-[100dvh] md:min-h-0 md:max-h-[90vh] overflow-hidden relative">
        
        {/* TOP HEADER */}
        <header className="flex-shrink-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {currentStep > 1 && currentStep !== 'success' ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-10 h-10 flex items-center justify-center -ml-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            ) : null}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Register Your Clinic
              </h2>
              {currentStep !== 'success' && (
                <p className="text-xs text-slate-500 font-medium">
                  Step {currentStep} of 3
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* PROGRESS INDICATOR */}
        {currentStep !== 'success' && (
          <div className="flex-shrink-0 bg-slate-50/80 border-b border-slate-100 py-2.5 px-4">
            <RegistrationProgress 
              currentStep={currentStep} 
              onStepClick={(s) => {
                if (s === 1 || (s === 2 && currentStep >= 2)) {
                  setCurrentStep(s);
                  scrollToTop();
                }
              }} 
            />
          </div>
        )}

        {/* FORM CONTENT BODY */}
        <div ref={containerRef} className="flex-grow overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
          
          {apiError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <span>{apiError}</span>
              </div>
            </div>
          )}

          {/* STEP 1: DOCTOR INFORMATION */}
          {currentStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Doctor Information</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tell us about yourself so we can set up your clinic account.
                </p>
              </div>

              {/* Personal Details Group */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Personal Details</span>
                </h4>

                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className={`w-full h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.first_name ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {errors.first_name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.first_name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className={`w-full h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.last_name ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {errors.last_name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.last_name}</p>}
                  </div>
                </div>

                {/* Gender & DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['male', 'female', 'other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleInputChange('gender', g)}
                          className={`h-12 rounded-xl text-xs font-semibold capitalize border transition-all ${
                            form.gender === g
                              ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-100'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {errors.gender && <p className="mt-1 text-xs text-red-600 font-medium">{errors.gender}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={toISODate(form.date_of_birth)}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value ? toDDMMYYYY(e.target.value) : '')}
                      className={`w-full h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.date_of_birth ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {errors.date_of_birth && <p className="mt-1 text-xs text-red-600 font-medium">{errors.date_of_birth}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Details Group */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      inputMode="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="doctor@example.com"
                      className={`w-full h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.email ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                      placeholder="10 digit mobile number"
                      className={`w-full h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.mobile ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {errors.mobile && <p className="mt-1 text-xs text-red-600 font-medium">{errors.mobile}</p>}
                  </div>
                </div>
              </div>

              {/* Professional Details Group */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>Professional Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Qualification</label>
                      <span className="text-[11px] text-slate-400 font-medium">(optional)</span>
                    </div>
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={(e) => handleInputChange('qualification', e.target.value)}
                      placeholder="e.g. BDS, MDS, Orthodontics"
                      className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Registration Number</label>
                      <span className="text-[11px] text-slate-400 font-medium">(optional)</span>
                    </div>
                    <input
                      type="text"
                      value={form.registration_number}
                      onChange={(e) => handleInputChange('registration_number', e.target.value)}
                      placeholder="Dental council reg. no."
                      className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: CLINIC INFORMATION */}
          {currentStep === 2 && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Clinic Information</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tell us about your dental clinic practice.
                </p>
              </div>

              {/* Clinic Basic Info Group */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Clinic Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Clinic Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.clinic_name}
                      onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                      placeholder="Enter clinic name"
                      className={`w-full h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.clinic_name ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {errors.clinic_name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.clinic_name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Clinic Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.contact_number}
                      onChange={(e) => handleInputChange('contact_number', e.target.value.replace(/\D/g, ''))}
                      placeholder="10 digit clinic phone"
                      className={`w-full h-12 px-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.contact_number ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {errors.contact_number && <p className="mt-1 text-xs text-red-600 font-medium">{errors.contact_number}</p>}
                  </div>
                </div>
              </div>

              {/* Clinic Location Group */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Clinic Location</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Clinic Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete clinic address (building, street, landmark)"
                    className={`w-full p-3.5 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white resize-none transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                      errors.address ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-600 font-medium">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">City</label>
                      <span className="text-[11px] text-slate-400 font-medium">(optional)</span>
                    </div>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city"
                      className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">State</label>
                      <span className="text-[11px] text-slate-400 font-medium">(optional)</span>
                    </div>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                      className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: ACCOUNT + REVIEW */}
          {currentStep === 3 && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Account & Review</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Create your password and verify your clinic registration details.
                </p>
              </div>

              {/* Password Group */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Account Security</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Minimum 8 characters"
                        className={`w-full h-12 pl-3.5 pr-10 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                          errors.password ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirm_password}
                        onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full h-12 pl-3.5 pr-10 rounded-xl border text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
                          errors.confirm_password ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirm_password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirm_password}</p>}
                  </div>
                </div>
              </div>

              {/* Practicing Dentist Switch */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-900">I am a practicing dentist</p>
                  <p className="text-xs text-slate-500">Confirms your role as practicing dentist and clinic owner</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('is_practicing_dentist', !form.is_practicing_dentist)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.is_practicing_dentist ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={form.is_practicing_dentist}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      form.is_practicing_dentist ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* DETAILS REVIEW CARD */}
              <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Review Your Details</span>
                  </h4>
                </div>

                {/* Doctor Summary */}
                <div className="flex items-start justify-between bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Doctor</span>
                    <p className="text-sm font-bold text-slate-900">Dr. {form.first_name} {form.last_name}</p>
                    <p className="text-xs text-slate-500">{form.email} • {form.mobile}</p>
                    {form.qualification && <p className="text-xs text-slate-400">Qual: {form.qualification}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(1); scrollToTop(); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Clinic Summary */}
                <div className="flex items-start justify-between bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Clinic</span>
                    <p className="text-sm font-bold text-slate-900">{form.clinic_name || 'Clinic Name'}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                      {form.address} {form.city ? `, ${form.city}` : ''}
                    </p>
                    <p className="text-xs text-slate-400">Phone: {form.contact_number}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCurrentStep(2); scrollToTop(); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  id="agree_terms"
                  type="checkbox"
                  checked={form.agree_terms}
                  onChange={(e) => handleInputChange('agree_terms', e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="agree_terms" className="text-xs text-slate-600 leading-normal cursor-pointer select-none">
                  I agree to the{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-blue-600 font-semibold underline hover:text-blue-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-blue-600 font-semibold underline hover:text-blue-700">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              {errors.agree_terms && <p className="text-xs text-red-600 font-medium">{errors.agree_terms}</p>}
            </section>
          )}

          {/* SUCCESS STATE */}
          {currentStep === 'success' && (
            <section className="py-8 px-2 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Request Submitted Successfully
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your clinic registration request has been received. We&apos;ll review your information and contact you with the next steps.
                </p>
              </div>

              <div className="pt-4 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={handleSuccessClose}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        {currentStep !== 'success' && (
          <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 pb-safe z-20">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="h-12 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="h-12 px-4 sm:px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel</span>
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 sm:flex-none sm:min-w-[160px] h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.agree_terms}
                className={`flex-1 sm:flex-none sm:min-w-[200px] h-12 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  submitting || !form.agree_terms
                    ? 'bg-blue-300 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] shadow-blue-500/20'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Send Signup Request</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestClinicFlow;

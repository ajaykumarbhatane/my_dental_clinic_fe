import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FileText,
  Calendar,
  Shield,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  DollarSign,
  Users,
  Activity,
  Menu,
  X,
  Stethoscope,
  CreditCard,
  BarChart3,
  ArrowRight,
  Lock,
  ShieldCheck,
  UserPlus,
  Pill,
  Edit,
  Building2,
  Award,
  Zap,
  MessageCircle,
  Bell,
  Bot,
} from "lucide-react";
import { clinicApi } from "../api/clinicApi";
import ChoiceSelect from "../components/ChoiceSelect";
import { toISODate, toDDMMYYYY } from '../utils/dateUtils';
import dashboardimg from "../assets/dashboard.png";
import treatmentsimg from "../assets/treatments.png";
import logo from "../assets/mydentalclinicpro_logo.png";

const Landing = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState("dashboard");
  const [activeAITab, setActiveAITab] = useState("create_patient");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Modals state
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: 'Male',
    mobile: '',
    secondary_phone_number: '',
    date_of_birth: '',
    password: '',
    confirm_password: '',
    role: 'Doctor',
    clinic_name: '',
    contact_number: '',
    qualification: '',
    registration_number: '',
    address: ''
  });

  const [signupErrors, setSignupErrors] = useState({});
  const [signupError, setSignupError] = useState('');
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [globalMessage, setGlobalMessage] = useState('');
  const [globalMessageType, setGlobalMessageType] = useState('success');

  const [showBookDemoModal, setShowBookDemoModal] = useState(false);
  const [bookDemoForm, setBookDemoForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    clinic_name: ''
  });
  const [bookDemoError, setBookDemoError] = useState('');
  const [bookDemoSuccess, setBookDemoSuccess] = useState('');
  const [bookDemoSubmitting, setBookDemoSubmitting] = useState(false);

  const handleSignupInput = (field, value) => {
    setSignupForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'mobile') {
        next.contact_number = value;
      }
      return next;
    });
    validateSignupField(field, value);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateSignupField = (field, value) => {
    setSignupErrors((prev) => {
      const next = { ...prev };
      const val = (value || '').toString().trim();

      if (field === 'first_name' || field === 'last_name') {
        if (/\d/.test(val)) {
          next[field] = 'Name cannot contain digits.';
        } else if (!val) {
          next[field] = 'This field is required.';
        } else {
          delete next[field];
        }
      }

      if (field === 'email') {
        if (!val) {
          next.email = 'Email is required.';
        } else if (!emailRegex.test(val)) {
          next.email = 'Please enter a valid email address.';
        } else {
          delete next.email;
        }
      }

      if (field === 'mobile' || field === 'contact_number' || field === 'secondary_phone_number') {
        const digits = (val || '').replace(/\D/g, '');
        if ((field === 'mobile' || field === 'contact_number') && digits.length !== 10) {
          next[field] = 'Phone number must contain exactly 10 digits.';
        } else if (val && /[A-Za-z]/.test(val)) {
          next[field] = 'Phone number must contain digits only.';
        } else {
          delete next[field];
        }
      }

      return next;
    });
  };

  const resetSignupForm = () => {
    setSignupForm({
      first_name: '',
      last_name: '',
      email: '',
      gender: 'Male',
      mobile: '',
      secondary_phone_number: '',
      date_of_birth: '',
      password: '',
      confirm_password: '',
      role: 'Doctor',
      clinic_name: '',
      contact_number: '',
      qualification: '',
      registration_number: '',
      address: ''
    });
    setSignupError('');
    setSignupErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openSignupModal = () => {
    resetSignupForm();
    setShowSignupModal(true);
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setSignupError('');
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupSubmitting(true);

    if (signupForm.password !== signupForm.confirm_password) {
      setSignupError('Password and confirm password do not match.');
      setSignupSubmitting(false);
      return;
    }

    try {
      await clinicApi.signupRequest(signupForm);
      const message = 'Signup request submitted successfully. Please wait for admin approval.';
      setGlobalMessage(message);
      setGlobalMessageType('success');
      setSignupError('');
      resetSignupForm();
      setShowSignupModal(false);
    } catch (error) {
      console.error('Signup request error:', error);
      const message = error?.response?.data?.detail || 'Failed to submit signup request. Please try again.';
      setSignupError(message);
      setGlobalMessage(message);
      setGlobalMessageType('error');
    } finally {
      setSignupSubmitting(false);
    }
  };

  const handleBookDemoInput = (field, value) => {
    setBookDemoForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetBookDemoForm = () => {
    setBookDemoForm({
      first_name: '',
      last_name: '',
      email: '',
      clinic_name: ''
    });
    setBookDemoError('');
  };

  const openBookDemoModal = () => {
    resetBookDemoForm();
    setBookDemoSuccess('');
    setShowBookDemoModal(true);
  };

  const closeBookDemoModal = () => {
    setShowBookDemoModal(false);
    setBookDemoError('');
    setBookDemoSuccess('');
  };

  const handleBookDemoSubmit = async (e) => {
    e.preventDefault();
    setBookDemoError('');
    setBookDemoSuccess('');
    setBookDemoSubmitting(true);

    const { first_name, last_name, email, clinic_name } = bookDemoForm;
    if (!first_name || !last_name || !email || !clinic_name) {
      setBookDemoError('Please fill in all fields.');
      setBookDemoSubmitting(false);
      return;
    }

    try {
      const response = await clinicApi.bookDemo(bookDemoForm);
      const message = response.data.message || 'Demo is booked. Give us some time, we will contact you soon and provide the demo.';
      setGlobalMessage(message);
      setGlobalMessageType('success');
      setBookDemoError('');
      resetBookDemoForm();
      setShowBookDemoModal(false);
    } catch (error) {
      console.error('Book demo error:', error);
      const message = error?.response?.data?.message || 'Failed to book demo. Please try again later.';
      setBookDemoError(message);
      setGlobalMessage(message);
      setGlobalMessageType('error');
    } finally {
      setBookDemoSubmitting(false);
    }
  };

  // AI Workflows Showcase Data
  const aiFlows = {
    create_patient: {
      id: "01",
      name: "Create Patient",
      icon: UserPlus,
      description: "Create patient records using AI-assisted commands.",
      userInput: "Create a new patient Rahul Sharma, age 32, phone 9876543210.",
      aiResponse: "Patient details extracted. Please confirm creation of patient Rahul Sharma.",
      actionDetails: [
        { label: "Name", val: "Rahul Sharma" },
        { label: "Age", val: "32" },
        { label: "Phone", val: "9876543210" },
      ],
      requiresConfirmation: true,
    },
    create_prescription: {
      id: "02",
      name: "Create Prescription",
      icon: Pill,
      description: "Use AI-powered workflows to prepare prescriptions.",
      userInput: "Create prescription for Rahul for acute toothache: Amoxicillin 500mg and Paracetamol 650mg.",
      aiResponse: "Prescription prepared with dosage instructions. Please confirm to add to patient record.",
      actionDetails: [
        { label: "Medicines", val: "Amoxicillin 500mg, Paracetamol 650mg" },
        { label: "Frequency", val: "1-0-1 (Twice Daily) after meals" },
        { label: "Duration", val: "5 Days" },
      ],
      requiresConfirmation: true,
    },
    update_patient: {
      id: "03",
      name: "Update Patient",
      icon: Edit,
      description: "Update patient information quickly using natural-language instructions.",
      userInput: "Update Rahul Sharma's medical history to include penicillin allergy.",
      aiResponse: "Medical history update prepared for Rahul Sharma. Review and confirm changes.",
      actionDetails: [
        { label: "Patient", val: "Rahul Sharma" },
        { label: "Field Updated", val: "Medical History" },
        { label: "New Entry", val: "Penicillin Allergy" },
      ],
      requiresConfirmation: true,
    },
    update_treatment: {
      id: "04",
      name: "Update Treatment",
      icon: Stethoscope,
      description: "Update treatment information without navigating through multiple screens.",
      userInput: "Update Rahul's treatment to Root Canal on Tooth #16 with charge ₹4,500.",
      aiResponse: "Treatment plan updated. Ready to save Tooth #16 Root Canal procedure.",
      actionDetails: [
        { label: "Procedure", val: "Root Canal Treatment" },
        { label: "Tooth Number", val: "#16" },
        { label: "Estimated Charge", val: "₹4,500" },
      ],
      requiresConfirmation: true,
    },
  };

  // Features list based on real application functionality
  const featuresList = [
    {
      icon: Users,
      title: "Patient Records",
      desc: "Keep essential patient information organized and easy to access.",
      iconBg: "bg-blue-600/10 text-blue-600",
    },
    {
      icon: Calendar,
      title: "Visit Management",
      desc: "Record and review patient visits and treatment history in one place.",
      iconBg: "bg-indigo-600/10 text-indigo-600",
    },
    {
      icon: CreditCard,
      title: "Payment & Amount Tracking",
      desc: "Keep track of amounts associated with patient visits and treatments.",
      iconBg: "bg-emerald-600/10 text-emerald-600",
    },
    {
      icon: Clock,
      title: "Patient History",
      desc: "Quickly review previous visits and records when you need them.",
      iconBg: "bg-amber-600/10 text-amber-600",
    },
    {
      icon: Zap,
      title: "Simple Workflow",
      desc: "Spend less time managing records and more time focusing on your patients.",
      iconBg: "bg-purple-600/10 text-purple-600",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Practical",
      desc: "Role-based access, clinic data isolation, and streamlined record security.",
      iconBg: "bg-slate-900/10 text-slate-900",
    },
  ];

  // FAQ Accordion Data
  const faqList = [
    {
      q: "What is dental clinic management software?",
      a: "Dental clinic management software is a dedicated digital application that allows dentists to organize patient demographics, maintain clinical visit logs, record treatment histories, and monitor payment balances in one central system."
    },
    {
      q: "Is My Dental Clinic Pro suitable for solo dentists?",
      a: "Yes, My Dental Clinic Pro is specifically designed for individual and solo dentists running independent practices. It eliminates complex multi-hospital configurations and focuses purely on everyday practice needs."
    },
    {
      q: "Can I manage dental patient records?",
      a: "Yes. You can easily create, update, and search patient profiles including personal info, contact details, medical conditions, and clinical notes."
    },
    {
      q: "Can I record patient visits and treatment history?",
      a: "Absolutely. Every patient visit can be documented with specific treatment notes, procedures performed, prescriptions, and date stamps for clear longitudinal care records."
    },
    {
      q: "Can I track patient payments and amounts?",
      a: "Yes. You can record fee amounts charged per visit or procedure, log collected payments, and track pending patient balances effortlessly."
    },
    {
      q: "Is My Dental Clinic Pro a dental practice management app?",
      a: "Yes, it is a practical dental practice management app designed to streamline patient records, treatment logs, and practice financials without unnecessary overhead."
    },
    {
      q: "Who is My Dental Clinic Pro designed for?",
      a: "It is tailored for solo dental practitioners, private clinic owners, and small dental teams seeking a reliable, clutter-free record management solution."
    },
    {
      q: "How does My Dental Clinic Pro help organize a dental practice?",
      a: "By replacing paper files and scattered spreadsheets with structured digital patient records, instant visit history lookup, and clear financial summaries."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Global Notification Toast */}
      {globalMessage && (
        <div className={`w-full px-4 py-3 text-sm text-center font-medium sticky top-0 z-[60] shadow-sm transition-all ${
          globalMessageType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span>{globalMessage}</span>
            <button onClick={() => setGlobalMessage('')} className="ml-4 text-xs underline opacity-80 hover:opacity-100">Dismiss</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm' : 'bg-white/70 backdrop-blur-sm border-b border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="My Dental Clinic Pro Logo" className="h-9 w-9 object-contain group-hover:scale-105 transition-transform" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
              <span className="text-[#2563EB]">My</span>
              <span className="text-[#DC2626] relative px-0.5">Dental</span>
              <span className="text-[#0F172A]">ClinicPro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#475569]">
            <a href="#features" className="hover:text-[#2563EB] transition-colors">Features</a>
            <a href="#ai" className="hover:text-[#7C3AED] transition-colors flex items-center gap-1.5">
              <span>AI Workflow</span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-purple-100 text-[#7C3AED] font-bold">New</span>
            </a>
            <a href="#revenue" className="hover:text-[#2563EB] transition-colors">Revenue</a>
            <a href="#patient-engagement" className="hover:text-[#2563EB] transition-colors">Reminders</a>
            <a href="#why-us" className="hover:text-[#2563EB] transition-colors">Why Choose Us</a>
            <a href="#faq" className="hover:text-[#2563EB] transition-colors">FAQ</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              Login
            </Link>

            <button
              onClick={openBookDemoModal}
              className="px-4 py-2 text-sm font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
            >
              Book Demo
            </button>

            <button
              onClick={openSignupModal}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-full shadow-md shadow-blue-500/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>Get Started</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-[#2563EB]"
            >
              Features
            </a>
            <a
              href="#ai"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-purple-700 hover:text-[#7C3AED]"
            >
              AI Workflow
            </a>
            <a
              href="#revenue"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-[#2563EB]"
            >
              Revenue Analytics
            </a>
            <a
              href="#patient-engagement"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-[#2563EB]"
            >
              Patient Reminders
            </a>
            <a
              href="#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-[#2563EB]"
            >
              Why Choose Us
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-[#2563EB]"
            >
              FAQ
            </a>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl"
              >
                Login
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); openBookDemoModal(); }}
                className="w-full text-center py-2.5 text-sm font-semibold text-[#2563EB] bg-blue-50 rounded-xl"
              >
                Book Demo
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); openSignupModal(); }}
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-[#2563EB] rounded-xl shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Messaging & CTAs */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left" data-aos="fade-right">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-xs font-semibold text-[#2563EB]">
                <Stethoscope size={14} className="text-[#2563EB]" />
                <span>SIMPLE • SMART • PROFESSIONAL • DENTIST-FOCUSED</span>
              </div>

              {/* H1 Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
                Smart Dental Clinic Management Software for Dentists
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                Manage patient records, clinic visits, treatment history, and payments in one simple dental practice management app.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={openSignupModal}
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={openBookDemoModal}
                  className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-[#334155] bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all shadow-sm text-center"
                >
                  Book Demo
                </button>
              </div>

              {/* Trust Line */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-xs font-medium text-slate-500">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Built for simple, organized dental practice management.</span>
              </div>
            </div>

            {/* Right Column: App Visual & Screenshot Toggle */}
            <div className="lg:col-span-6" data-aos="fade-left">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                
                {/* Visual Container */}
                <div className="bg-slate-900/5 rounded-2xl p-2 sm:p-3 border border-slate-200/80 shadow-2xl backdrop-blur">
                  
                  {/* Screenshot Tab Switches */}
                  <div className="flex items-center justify-between bg-slate-900 text-white rounded-t-xl px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-xs font-medium text-slate-400">My Dental Clinic Pro Workspace</span>
                    </div>

                    <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        onClick={() => setActiveShowcaseTab("dashboard")}
                        className={`px-3 py-1 rounded-md transition-all ${
                          activeShowcaseTab === "dashboard" ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => setActiveShowcaseTab("treatments")}
                        className={`px-3 py-1 rounded-md transition-all ${
                          activeShowcaseTab === "treatments" ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Treatments
                      </button>
                    </div>
                  </div>

                  {/* Screenshot Container */}
                  <div className="relative bg-white rounded-b-xl overflow-hidden aspect-[16/10]">
                    {activeShowcaseTab === "dashboard" ? (
                      <img
                        src={dashboardimg}
                        alt="my dental clinic pro patient records dashboard"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <img
                        src={treatmentsimg}
                        alt="dental clinic management software patient visit screen"
                        className="w-full h-full object-cover object-top"
                      />
                    )}
                  </div>
                </div>

                {/* Subtle Decorative Backdrop Blur */}
                <div className="absolute -z-10 -bottom-6 -right-6 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* QUICK VALUE PILLARS BAR */}
      <section className="bg-white border-y border-slate-200/80 py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x-0 md:divide-x divide-slate-100">
            
            <div className="text-center px-4 space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#2563EB] block">Digital</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Patient Records</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Medical history, charts & files</p>
            </div>

            <div className="text-center px-4 space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#2563EB] block">Smart</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Appointments</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Schedule & visit history</p>
            </div>

            <div className="text-center px-4 space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#7C3AED] block">AI-Powered</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Clinic Actions</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Create & update via instructions</p>
            </div>

            <div className="text-center px-4 space-y-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#0D9488] block">Clear</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Revenue Visibility</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Daily & monthly collections</p>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURE SECTION */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-3 tracking-tight">
              Everything You Need to Keep Your Dental Practice Organized
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
              Focus on patient care with clean, intuitive features built for daily dental practice operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                  className="bg-[#F8FAFC] rounded-2xl p-7 border border-slate-200/70 hover:border-blue-300 hover:shadow-lg transition-all group duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feat.iconBg} group-hover:scale-110 transition-transform`}>
                    <IconComp size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* AI COMMAND WORKFLOW SHOWCASE SECTION */}
      <section id="ai" className="py-20 bg-[#0B0F19] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-14" data-aos="fade-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-widest">
              <Sparkles size={14} className="text-purple-400" />
              <span>Real Conversational AI</span>
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
              AI That Helps You Run Your Clinic
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mt-3">
              Use simple AI-powered commands to create and update clinic information faster.
            </p>
          </div>

          {/* Interactive AI Tabs */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-8 max-w-5xl mx-auto shadow-2xl backdrop-blur" data-aos="zoom-in">
            
            {/* Tab Switches */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {Object.keys(aiFlows).map((key) => {
                const flow = aiFlows[key];
                const Icon = flow.icon;
                const isActive = activeAITab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveAITab(key)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{flow.name}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Tab Content */}
            {aiFlows[activeAITab] && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                <div className="lg:col-span-5 space-y-4">
                  <div className="text-xs font-bold text-purple-400 tracking-wider uppercase">
                    CAPABILITY #{aiFlows[activeAITab].id}
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {aiFlows[activeAITab].name}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {aiFlows[activeAITab].description}
                  </p>

                  <div className="inline-flex items-center gap-2 text-xs text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-800/50">
                    <ShieldCheck size={14} className="text-purple-400" />
                    <span>Requires Doctor Confirmation before saving</span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={openSignupModal}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Try AI Workflow</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* AI Interactive Chat Visual */}
                <div className="lg:col-span-7 bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                  
                  {/* Doctor Input Bubble */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                      Dr
                    </div>
                    <div className="bg-slate-900 p-3.5 rounded-2xl rounded-tl-none border border-slate-800 text-xs text-slate-200">
                      <p className="font-mono text-blue-300">{`"${aiFlows[activeAITab].userInput}"`}</p>
                    </div>
                  </div>

                  {/* AI Response Box */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-xs">
                      <Bot size={16} />
                    </div>
                    <div className="flex-1 bg-purple-950/40 p-4 rounded-2xl rounded-tl-none border border-purple-900/50 text-xs space-y-3">
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300 text-[11px] uppercase tracking-wider">Action Prepared</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Awaiting confirmation</span>
                      </div>

                      <p className="text-slate-300">{aiFlows[activeAITab].aiResponse}</p>

                      <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                        {aiFlows[activeAITab].actionDetails.map((det, i) => (
                          <div key={i} className="flex justify-between border-b border-slate-800/60 pb-1 last:border-0 last:pb-0">
                            <span className="text-slate-400">{det.label}:</span>
                            <span className="font-semibold text-white">{det.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded text-[11px] flex items-center gap-1 hover:bg-emerald-500">
                          <Check size={12} /> Confirm & Save
                        </button>
                        <button className="px-3 py-1.5 bg-slate-800 text-slate-300 font-medium rounded text-[11px] hover:bg-slate-700">
                          Edit Details
                        </button>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
        
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-0 pointer-events-none" />
      </section>

      {/* REVENUE ANALYTICS SHOWCASE SECTION */}
      <section id="revenue" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14" data-aos="fade-up">
            <span className="text-xs font-bold tracking-widest text-[#0D9488] uppercase bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Financial Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-3 tracking-tight">
              See Your Clinic Revenue Clearly
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3">
              Get real-time visibility into your clinic's daily collections, monthly performance, and outstanding balances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" data-aos="fade-up" data-aos-delay="100">
            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">TODAY'S REVENUE</span>
              <h3 className="text-2xl font-extrabold text-[#0F172A]">Tracked Live</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Real-time collection monitoring</p>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">MONTHLY REVENUE & TRENDS</span>
              <h3 className="text-2xl font-extrabold text-[#2563EB]">Categorized</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Breakdown by dental procedures</p>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">OUTSTANDING BALANCES</span>
              <h3 className="text-2xl font-extrabold text-amber-600">Pending Dues</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Clear unpaid patient tracking</p>
            </div>
          </div>

          {/* Screenshot Preview */}
          <div className="bg-slate-900/5 p-3 rounded-2xl border border-slate-200 shadow-2xl max-w-5xl mx-auto" data-aos="zoom-in">
            <div className="bg-white rounded-xl overflow-hidden shadow-inner">
              <img
                src={dashboardimg}
                alt="my dental clinic pro patient records dashboard"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* PATIENT REMINDERS & ENGAGEMENT SECTION */}
      <section id="patient-engagement" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6" data-aos="fade-right">
              <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Automated Reminders
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Keep Patients Connected
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Never miss a patient follow-up with automated reminders and clinic notifications.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="p-2.5 bg-blue-50 text-[#2563EB] rounded-xl mt-0.5">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Appointment Reminders</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Timely notifications so patients arrive on time for scheduled visits.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Care Follow-Up Reminders</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Notify patients when post-procedure checkups or root canal follow-ups are due.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl mt-0.5">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Payment Reminders</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Automated updates regarding outstanding clinic treatment balances.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Phone Mock Preview */}
            <div className="lg:col-span-6 flex justify-center" data-aos="fade-left">
              <div className="w-full max-w-sm bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 relative">
                
                {/* Phone Notch */}
                <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-4" />

                <div className="bg-slate-950 rounded-[28px] p-4 text-white space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-slate-300">Clinic Notification Feed</span>
                    <Bell size={14} className="text-blue-400" />
                  </div>

                  {/* Reminder 1 */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-blue-400 font-bold uppercase">
                      <span>Appointment</span>
                      <span className="text-slate-500">Just Now</span>
                    </div>
                    <div className="font-bold text-white text-xs">Tomorrow's Visit</div>
                    <div className="text-slate-400 text-[11px]">"Your appointment with Dr. Swati Lahane is tomorrow at 10:30 AM."</div>
                  </div>

                  {/* Reminder 2 */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-purple-400 font-bold uppercase">
                      <span>Care Follow-Up</span>
                      <span className="text-slate-500">2h ago</span>
                    </div>
                    <div className="font-bold text-white text-xs">Dental Follow-up</div>
                    <div className="text-slate-400 text-[11px]">"Your dental follow-up checkup is due this week."</div>
                  </div>

                  {/* Reminder 3 */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold uppercase">
                      <span>Billing</span>
                      <span className="text-slate-500">Yesterday</span>
                    </div>
                    <div className="font-bold text-white text-xs">Payment Due</div>
                    <div className="text-slate-400 text-[11px]">"Your outstanding clinic payment balance is due."</div>
                  </div>

                </div>

                {/* Phone Bar */}
                <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* WHY MY DENTAL CLINIC PRO SECTION */}
      <section id="why-us" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6" data-aos="fade-right">
              <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Designed for Simplicity
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Simple Dental Practice Management, Without the Complexity
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Many practice management platforms are cluttered with enterprise hospital features that solo dentists simply do not need. My Dental Clinic Pro is built specifically to provide a focused, practical workflow for everyday clinical recordkeeping.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg mt-0.5">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Organized Patient Information</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Store contact info, medical background, and patient charts in structured digital records.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Detailed Visit & Treatment History</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Log clinical notes, procedures performed, and past visit history at a glance.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mt-0.5">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Clear Payment & Amount Records</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Track total visit charges, payments received, and pending balances seamlessly.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6" data-aos="fade-left">
              <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-[#0F172A] pb-4 border-b border-slate-200 flex items-center gap-2">
                  <Building2 className="text-[#2563EB]" size={22} />
                  <span>Focused Dental Software for Everyday Practice</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Targeted Audience</span>
                    <span className="font-semibold text-[#0F172A]">Solo Dentists & all Clinics</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Record Access Speed</span>
                    <span className="font-semibold text-[#0F172A]">Instant Search & Lookup</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Setup Time</span>
                    <span className="font-semibold text-[#0F172A]">Immediate Cloud Access</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Learning Curve</span>
                    <span className="font-semibold text-[#0F172A]">Simple & Intuitive</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={openSignupModal}
                    className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-bold text-sm shadow-md transition-all"
                  >
                    Start Managing Your Clinic Today
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DENTIST / SOLO PRACTICE SECTION */}
      <section id="solo-dentist" className="py-20 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden" data-aos="zoom-in">
            <div className="relative z-10 space-y-6">
              
              <span className="text-xs font-bold tracking-widest text-blue-300 uppercase bg-blue-500/20 px-3.5 py-1 rounded-full border border-blue-400/30 inline-block">
                Solo Dentist Solution
              </span>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Dental Clinic Management Software for Solo Dentists
              </h2>

              <p className="text-blue-100 text-base sm:text-lg leading-relaxed">
                Running a dental practice shouldn't require complicated software. My Dental Clinic Pro provides a focused way for dentists to organize patient records, visits, treatment history, and payment information.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur p-3.5 rounded-xl border border-white/10">
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />
                  <span className="text-sm font-semibold text-white">Single-dentist workflow optimization</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur p-3.5 rounded-xl border border-white/10">
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />
                  <span className="text-sm font-semibold text-white">Fast patient visit & procedure entry</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur p-3.5 rounded-xl border border-white/10">
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />
                  <span className="text-sm font-semibold text-white">Complete treatment history tracking</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur p-3.5 rounded-xl border border-white/10">
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0" size={20} />
                  <span className="text-sm font-semibold text-white">Clear financial & payment summaries</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={openSignupModal}
                  className="px-8 py-3.5 bg-white text-[#2563EB] hover:bg-blue-50 rounded-xl font-extrabold text-sm shadow-lg transition-all"
                >
                  Get Started Free
                </button>
              </div>

            </div>

            {/* Background Accent Graphics */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-3 tracking-tight">
              How My Dental Clinic Pro Works
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3">
              Streamline your daily clinic workflow in three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-200/80 shadow-sm relative group hover:shadow-md transition-all" data-aos="fade-up" data-aos-delay="100">
              <span className="text-4xl font-black text-blue-100 group-hover:text-blue-200 transition-colors block mb-4">
                01
              </span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
                <UserPlus size={22} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                Add Patient
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create and maintain patient information, medical details, and contact information.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-200/80 shadow-sm relative group hover:shadow-md transition-all" data-aos="fade-up" data-aos-delay="200">
              <span className="text-4xl font-black text-blue-100 group-hover:text-blue-200 transition-colors block mb-4">
                02
              </span>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Stethoscope size={22} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                Record Visits
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keep track of patient visits, clinical notes, procedures performed, and treatment details.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-200/80 shadow-sm relative group hover:shadow-md transition-all" data-aos="fade-up" data-aos-delay="300">
              <span className="text-4xl font-black text-blue-100 group-hover:text-blue-200 transition-colors block mb-4">
                03
              </span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CreditCard size={22} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                Track Amounts
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Maintain payment and amount records associated with visits to keep clinical finances organized.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SEO CONTENT SECTION */}
      <section className="py-20 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" data-aos="fade-up">
          
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm space-y-6 text-[#334155] leading-relaxed">
            <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Clinical Practice Insights
            </span>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              What Is Dental Clinic Management Software?
            </h2>

            <p className="text-base sm:text-lg text-slate-700">
              Dental clinic management software is a dedicated digital application designed to assist dentists in organizing patient profiles, logging clinical treatments, managing appointment visits, and tracking financial balances. For modern dental practitioners, maintaining paper-based charts or complex spreadsheets consumes valuable time that could otherwise be dedicated to patient care.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/70">
                <h3 className="text-base font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <Users size={18} className="text-[#2563EB]" />
                  <span>Organized Patient Records</span>
                </h3>
                <p className="text-sm text-slate-600">
                  Store demographic details, contact info, and medical histories securely. Having quick access to complete patient profiles enables dentists to deliver personalized care efficiently during every consultation.
                </p>
              </div>

              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/70">
                <h3 className="text-base font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <Clock size={18} className="text-indigo-600" />
                  <span>Visit & Treatment History</span>
                </h3>
                <p className="text-sm text-slate-600">
                  Accurate treatment recording ensures that past procedures, tooth charts, clinical observations, and follow-up schedules are documented sequentially for accurate future references.
                </p>
              </div>
            </div>

            <p className="text-base text-slate-700">
              Furthermore, tracking amounts and payments associated with every visit helps dentists maintain healthy cash flow without needing full-scale accounting suites. My Dental Clinic Pro offers a focused, dentist-first approach designed specifically to keep patient records, treatment histories, and payment logs straightforward and accessible.
            </p>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14" data-aos="fade-up">
            <span className="text-xs font-bold tracking-widest text-[#2563EB] uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-3 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3">
              Find quick answers to common questions about My Dental Clinic Pro.
            </p>
          </div>

          <div className="space-y-4" data-aos="fade-up" data-aos-delay="100">
            {faqList.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-[#2563EB] transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-180 text-[#2563EB]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm sm:text-base text-slate-600 border-t border-slate-200/80 leading-relaxed bg-white/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION BAR */}
      <section className="py-16 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6" data-aos="zoom-in">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Ready to Simplify Your Dental Practice Management?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Join dentists using My Dental Clinic Pro to keep patient records, visits, and payment information organized.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={openSignupModal}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Now</span>
              <ChevronRight size={18} />
            </button>

            <button
              onClick={openBookDemoModal}
              className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
            >
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
            
            {/* Column 1: Brand */}
            <div className="md:col-span-5 space-y-4">
              <Link to="/" className="flex items-center gap-3">
                <img src={logo} alt="My Dental Clinic Pro Logo" className="h-8 w-8 object-contain" />
                <span className="text-xl font-extrabold text-white tracking-tight">
                  <span className="text-blue-500">My</span>
                  <span className="text-red-500 px-0.5">Dental</span>
                  <span className="text-white">ClinicPro</span>
                </span>
              </Link>

              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Simple dental clinic management software for dentists. Organize patient records, visit logs, treatment history, and payment tracking in one place.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#ai" className="hover:text-white transition-colors">AI Workflow</a></li>
                <li><a href="#revenue" className="hover:text-white transition-colors">Revenue Analytics</a></li>
                <li><a href="#patient-engagement" className="hover:text-white transition-colors">Patient Reminders</a></li>
                <li><a href="#why-us" className="hover:text-white transition-colors">Why Choose Us</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Legal & Access */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Access & Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Clinic Doctor / Staff Login</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><span className="text-slate-500 cursor-default">Terms of Service</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} My Dental Clinic Pro. All rights reserved.</p>
            <p>Built for simple, organized dental practice management.</p>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/919970609951?text=Hello%20MyDentalClinicPro%2C%20I%20would%20like%20to%20know%20more%20about%20your%20dental%20clinic%20management%20system."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle size={26} />
      </a>

      {/* SIGNUP MODAL (INSTANT OPEN, SUB-MILLISECOND VISIBILITY) */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop-instant">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative modal-content-instant">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold">Register Your Clinic</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in your doctor and clinic details to get started.</p>
              </div>
              <button
                onClick={closeSignupModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSignupSubmit} className="flex-grow overflow-y-auto">
              <div className="p-6 space-y-6">
                
                {signupError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {signupError}
                  </div>
                )}

                {/* Doctor Details */}
                <section>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider text-[#2563EB]">Doctor Information</h4>
                  <div className="border-t border-slate-200 mb-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name *</label>
                      <input
                        value={signupForm.first_name}
                        onChange={(e) => handleSignupInput("first_name", e.target.value)}
                        className={`input2 w-full ${signupErrors.first_name ? "border-red-500" : ""}`}
                        placeholder="Enter first name"
                        required
                      />
                      {signupErrors.first_name && <p className="mt-1 text-xs text-red-600">{signupErrors.first_name}</p>}
                    </div>

                    <div>
                      <label className="label">Last Name *</label>
                      <input
                        value={signupForm.last_name}
                        onChange={(e) => handleSignupInput("last_name", e.target.value)}
                        className={`input2 w-full ${signupErrors.last_name ? "border-red-500" : ""}`}
                        placeholder="Enter last name"
                        required
                      />
                      {signupErrors.last_name && <p className="mt-1 text-xs text-red-600">{signupErrors.last_name}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">Email Address *</label>
                      <input
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => handleSignupInput("email", e.target.value)}
                        className={`input2 w-full ${signupErrors.email ? "border-red-500" : ""}`}
                        placeholder="doctor@clinic.com"
                        required
                      />
                      {signupErrors.email && <p className="mt-1 text-xs text-red-600">{signupErrors.email}</p>}
                    </div>

                    <div>
                      <label className="label">Mobile Number *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={signupForm.mobile}
                        onChange={(e) => handleSignupInput("mobile", e.target.value)}
                        className={`input2 w-full ${signupErrors.mobile ? "border-red-500" : ""}`}
                        placeholder="10 digit mobile number"
                        required
                      />
                      {signupErrors.mobile && <p className="mt-1 text-xs text-red-600">{signupErrors.mobile}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">Gender *</label>
                      <ChoiceSelect
                        options={['Male', 'Female', 'Other']}
                        value={signupForm.gender}
                        onChange={(val) => handleSignupInput("gender", val)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="label">Registration Number</label>
                      <input
                        value={signupForm.registration_number}
                        onChange={(e) => handleSignupInput("registration_number", e.target.value)}
                        className="input2 w-full"
                        placeholder="Dental council reg. no."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">Date of Birth *</label>
                      <input
                        type="date"
                        value={toISODate(signupForm.date_of_birth)}
                        onChange={(e) => handleSignupInput("date_of_birth", e.target.value ? toDDMMYYYY(e.target.value) : "")}
                        className="input2 w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Qualification</label>
                      <input
                        value={signupForm.qualification}
                        onChange={(e) => handleSignupInput("qualification", e.target.value)}
                        className="input2 w-full"
                        placeholder="e.g. BDS, MDS Orthodontics"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => handleSignupInput("password", e.target.value)}
                          className="input2 w-full"
                          placeholder="Enter password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="label">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={signupForm.confirm_password}
                          onChange={(e) => handleSignupInput("confirm_password", e.target.value)}
                          className={`input2 w-full ${signupErrors.confirm_password ? "border-red-500" : ""}`}
                          placeholder="Confirm password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {signupErrors.confirm_password && <p className="mt-1 text-xs text-red-600">{signupErrors.confirm_password}</p>}
                    </div>
                  </div>
                </section>

                {/* Clinic Details */}
                <section>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider text-[#2563EB]">Clinic Registration</h4>
                  <div className="border-t border-slate-200 mb-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Clinic Name *</label>
                      <input
                        value={signupForm.clinic_name}
                        onChange={(e) => handleSignupInput("clinic_name", e.target.value)}
                        className="input2 w-full"
                        placeholder="Enter clinic name"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Clinic Contact Number *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={signupForm.contact_number}
                        onChange={(e) => handleSignupInput("contact_number", e.target.value)}
                        className={`input2 w-full ${signupErrors.contact_number ? "border-red-500" : ""}`}
                        placeholder="Enter contact number"
                        required
                      />
                      {signupErrors.contact_number && <p className="mt-1 text-xs text-red-600">{signupErrors.contact_number}</p>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="label">Address *</label>
                    <textarea
                      rows={3}
                      value={signupForm.address}
                      onChange={(e) => handleSignupInput("address", e.target.value)}
                      className="input2 w-full resize-none"
                      placeholder="Enter complete clinic address"
                      required
                    />
                  </div>
                </section>

              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeSignupModal}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signupSubmitting || Object.keys(signupErrors).length > 0}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all ${
                    signupSubmitting || Object.keys(signupErrors).length > 0
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                  }`}
                >
                  {signupSubmitting ? "Submitting..." : "Send Signup Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOK DEMO MODAL (INSTANT OPEN, SUB-MILLISECOND VISIBILITY) */}
      {showBookDemoModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop-instant">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative modal-content-instant">
            <button
              onClick={closeBookDemoModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-1">Request a Product Demo</h3>
            <p className="text-xs text-slate-500 mb-4">See how MyDentalClinicPro can transform your practice.</p>

            {bookDemoError && <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">{bookDemoError}</div>}
            {bookDemoSuccess && <div className="p-3 mb-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">{bookDemoSuccess}</div>}

            <form onSubmit={handleBookDemoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">First Name *</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={bookDemoForm.first_name}
                    onChange={(e) => handleBookDemoInput('first_name', e.target.value)}
                    className="input2 w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Last Name *</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={bookDemoForm.last_name}
                    onChange={(e) => handleBookDemoInput('last_name', e.target.value)}
                    className="input2 w-full text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">Email *</label>
                <input
                  type="email"
                  placeholder="doctor@clinic.com"
                  value={bookDemoForm.email}
                  onChange={(e) => handleBookDemoInput('email', e.target.value)}
                  className="input2 w-full text-sm"
                  required
                />
              </div>

              <div>
                <label className="label text-xs">Clinic Name *</label>
                <input
                  type="text"
                  placeholder="Enter Clinic Name"
                  value={bookDemoForm.clinic_name}
                  onChange={(e) => handleBookDemoInput('clinic_name', e.target.value)}
                  className="input2 w-full text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={bookDemoSubmitting}
                className="w-full mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-xl font-semibold transition-all shadow-md text-sm"
              >
                {bookDemoSubmitting ? 'Submitting Request...' : 'Request Demo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
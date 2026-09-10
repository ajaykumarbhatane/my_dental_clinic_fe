import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FileText,
  Calendar,
  Smartphone,
  MessageCircle,
  Shield,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  DollarSign,
  Users,
  Activity,
  Award,
  Zap,
  Menu,
  X,
  Bell,
  Stethoscope,
  CreditCard,
  BarChart3,
  ArrowRight,
  Lock,
  Star,
  ShieldCheck,
  Bot,
  UserPlus,
  Pill,
  Edit,
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
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");

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
    gender: '',
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

  // Instant Modal Open Handlers (Zero delay, state updated synchronously)
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

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !emailRegex.test(newsletterEmail)) {
      setNewsletterStatus("Please enter a valid email.");
      return;
    }
    setNewsletterStatus("Thank you for subscribing!");
    setNewsletterEmail("");
    setTimeout(() => setNewsletterStatus(""), 4000);
  };

  // Feature Inventory (Based on actual BE + FE analysis)
  const featuresList = [
    {
      icon: Users,
      title: "Patient Management",
      desc: "Digital patient records, medical history, dental charts, attachments, and chief complaints.",
      iconBg: "bg-blue-600/10 text-blue-600",
    },
    {
      icon: Calendar,
      title: "Appointment Management",
      desc: "Manage clinic schedules, time slots, doctor assignments, and visit tracking.",
      iconBg: "bg-cyan-500/10 text-cyan-600",
    },
    {
      icon: Stethoscope,
      title: "Treatment Management",
      desc: "Track treatment plans, procedures, tooth selection, clinical notes, and educational videos.",
      iconBg: "bg-indigo-600/10 text-indigo-600",
    },
    {
      icon: Pill,
      title: "Prescription Management",
      desc: "Digital prescriptions, medicine database, dosage, duration, instructions, and PDF export.",
      iconBg: "bg-purple-600/10 text-purple-600",
    },
    {
      icon: CreditCard,
      title: "Billing & Payments",
      desc: "Manage charges, payments collected, multiple payment modes, and outstanding patient balances.",
      iconBg: "bg-emerald-600/10 text-emerald-600",
    },
    {
      icon: BarChart3,
      title: "Financial Analytics",
      desc: "Monitor clinic performance through real-time revenue dashboards, visit trends, and payment tracking.",
      iconBg: "bg-amber-600/10 text-amber-600",
    },
    {
      icon: MessageCircle,
      title: "Patient Communication",
      desc: "Timely reminders for upcoming appointments, follow-up checkups, and pending payments.",
      iconBg: "bg-violet-600/10 text-violet-600",
    },
    {
      icon: Lock,
      title: "Security & Role Access",
      desc: "Secure JWT authentication with isolated clinic scoping for Doctors and Staff.",
      iconBg: "bg-slate-900/10 text-slate-900",
    },
  ];

  // 4 Verified AI Capabilities Data
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

  // Benefits
  const benefitsList = [
    {
      title: "Save Time",
      desc: "Reduce repetitive administrative work and digitize paper charts in minutes.",
      icon: Clock,
    },
    {
      title: "Better Patient Management",
      desc: "Keep patient records organized, searchable, and accessible anywhere.",
      icon: Users,
    },
    {
      title: "Smarter Clinic Operations",
      desc: "Manage appointments, treatments, and billing effortlessly in one place.",
      icon: Activity,
    },
    {
      title: "AI-Assisted Workflows",
      desc: "Complete common clinic actions faster with intelligent natural language actions.",
      icon: Sparkles,
    },
    {
      title: "Revenue Visibility",
      desc: "Understand clinic financial performance and daily collections clearly.",
      icon: TrendingUp,
    },
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
          
          {/* Logo with Dental Red Accent */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="MyDentalClinicPro Logo" className="h-9 w-9 object-contain group-hover:scale-105 transition-transform" />
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
              <span>AI</span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-purple-100 text-[#7C3AED] font-bold">New</span>
            </a>
            <a href="#revenue" className="hover:text-[#2563EB] transition-colors">Revenue</a>
            <a href="#patient-engagement" className="hover:text-[#2563EB] transition-colors">Patient Engagement</a>
            <a href="#pricing" className="hover:text-[#2563EB] transition-colors">Pricing</a>
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
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in">
            <nav className="flex flex-col space-y-3 font-medium text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Features
              </a>
              <a
                href="#ai"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-purple-50 text-[#7C3AED] flex items-center justify-between"
              >
                <span>AI Assistant</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-purple-200 text-purple-800 rounded">AI</span>
              </a>
              <a
                href="#revenue"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Revenue
              </a>
              <a
                href="#patient-engagement"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Patient Engagement
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Pricing
              </a>
            </nav>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Login
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSignupModal();
                }}
                className="w-full py-2.5 text-center font-semibold text-white bg-[#2563EB] rounded-xl shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-white pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left" data-aos="fade-right">

              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200/60 text-xs font-semibold text-blue-900 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                <span>Built for modern dental clinics</span>
                <span className="text-blue-300">•</span>
                <span className="text-blue-700 font-medium">Dental SaaS</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
                Run Your Dental Clinic <span className="gradient-text-blue-cyan">Smarter</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#475569] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Manage patients, appointments, treatments, prescriptions, billing and revenue — with AI-powered tools that help you get more done in less time.
              </p>

              {/* CTAs with Instant Modal Triggers */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={openSignupModal}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-full shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                  <span>Get Started</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={openBookDemoModal}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-[#0F172A] font-semibold border border-slate-300 rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={18} className="text-[#2563EB]" />
                  <span>Request a Demo</span>
                </button>
              </div>

              {/* HERO MICRO FEATURES */}
              <div className="pt-6 border-t border-slate-200/60">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm font-semibold text-[#475569]">
                  <div className="flex items-center justify-center lg:justify-start gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>Patient Management</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>Smart Appointments</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5">
                    <CheckCircle2 size={16} className="text-[#7C3AED] flex-shrink-0" />
                    <span>AI-Powered Actions</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>Revenue Analytics</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Showcase Visual */}
            <div className="lg:col-span-6" data-aos="fade-left" data-aos-delay="150">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                
                {/* Visual Frame */}
                <div className="relative rounded-2xl bg-white p-2.5 sm:p-3 shadow-2xl border border-slate-200/80 glow-blue">
                  
                  {/* Browser Window Bar */}
                  <div className="bg-[#0F172A] rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveShowcaseTab("dashboard")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          activeShowcaseTab === "dashboard" ? "bg-[#2563EB] text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => setActiveShowcaseTab("treatments")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          activeShowcaseTab === "treatments" ? "bg-[#2563EB] text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Treatments
                      </button>
                    </div>
                  </div>

                  {/* Screenshot Container */}
                  <div className="relative mt-2 overflow-hidden rounded-xl bg-slate-900 aspect-[16/10]">
                    <img
                      src={activeShowcaseTab === "dashboard" ? dashboardimg : treatmentsimg}
                      alt="MyDentalClinicPro SaaS Product Preview"
                      className="w-full h-full object-cover object-top rounded-xl transition-all duration-500"
                    />

                    

                    {/* Floating Overlay Badge 2 */}
                    <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-purple-500/40 rounded-xl p-3 shadow-xl flex items-center gap-3 text-white hidden sm:flex">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <div className="text-[11px] text-purple-300 font-semibold tracking-wider">AI Assistant</div>
                        <div className="text-xs font-bold text-white">4 Workflows Ready</div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-4 text-center">
                  <span className="text-xs font-medium text-[#475569] inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#2563EB]" />
                    <span>Real Application Interface • Verified Enterprise Security</span>
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="bg-white py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">

            <div className="text-center pt-4 sm:pt-0" data-aos="fade-up">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#2563EB] tracking-tight">Digital</div>
              <div className="mt-2 text-sm font-bold text-[#0F172A]">Patient Records</div>
              <div className="text-xs text-[#475569] mt-1">Medical history, charts & files</div>
            </div>

            <div className="text-center pt-4 sm:pt-0" data-aos="fade-up" data-aos-delay="100">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#2563EB] tracking-tight">Smart</div>
              <div className="mt-2 text-sm font-bold text-[#0F172A]">Appointments</div>
              <div className="text-xs text-[#475569] mt-1">Schedule & availability slots</div>
            </div>

            <div className="text-center pt-4 sm:pt-0" data-aos="fade-up" data-aos-delay="200">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#7C3AED] tracking-tight">AI-Powered</div>
              <div className="mt-2 text-sm font-bold text-[#0F172A]">Clinic Actions</div>
              <div className="text-xs text-[#475569] mt-1">Create & update via instructions</div>
            </div>

            <div className="text-center pt-4 sm:pt-0" data-aos="fade-up" data-aos-delay="300">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#06B6D4] tracking-tight">Clear</div>
              <div className="mt-2 text-sm font-bold text-[#0F172A]">Revenue Visibility</div>
              <div className="text-xs text-[#475569] mt-1">Daily & monthly collections</div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURE SECTION */}
      <section id="features" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-blue-100 px-3 py-1 rounded-full">
              Full Feature Inventory
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Everything Your Dental Clinic Needs
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#475569]">
              Built with purpose to streamline patient care, clinical treatments, billing, and practice performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuresList.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  data-aos="fade-up"
                  data-aos-delay={idx * 60}
                  className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.iconBg} mb-5 group-hover:scale-110 transition-transform`}>
                    <IconComp size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* AI SECTION — MAJOR DIFFERENTIATOR */}
      <section id="ai" className="py-24 bg-[#0F172A] text-white relative overflow-hidden">
        {/* Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-600/40 text-xs font-bold text-purple-300">
              <Sparkles size={14} className="text-purple-400" />
              <span>Real Conversational AI</span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              AI That Helps You Run Your Clinic
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Use simple AI-powered commands to create and update clinic information faster.
            </p>
          </div>

          {/* Interactive AI Showcase Container */}
          <div className="max-w-5xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl glow-purple" data-aos="zoom-in">
            
            {/* 4 Real AI Capability Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 pb-6 border-b border-slate-800">
              {Object.keys(aiFlows).map((key) => {
                const flow = aiFlows[key];
                const IconC = flow.icon;
                const isActive = activeAITab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveAITab(key)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                      isActive
                        ? "bg-purple-900/40 border-purple-500 text-white shadow-lg shadow-purple-900/30"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-purple-400">{flow.id}</span>
                      <IconC size={18} className={isActive ? "text-purple-400" : "text-slate-500"} />
                    </div>
                    <span className="text-xs font-bold">{flow.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active AI Workflow Demo */}
            {(() => {
              const currentFlow = aiFlows[activeAITab];
              return (
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  
                  {/* Flow Summary */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
                      <Bot size={16} />
                      <span>Capability #{currentFlow.id}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{currentFlow.name}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{currentFlow.description}</p>
                    
                    <div className="p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-purple-400 flex-shrink-0" />
                      <span>Requires Doctor Confirmation before database save</span>
                    </div>

                    <button
                      onClick={openBookDemoModal}
                      className="mt-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#4338CA] text-white font-semibold rounded-full shadow-lg shadow-purple-600/30 transition-all text-sm inline-flex items-center gap-2"
                    >
                      <span>Try AI Workflow</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Conversational Command & Confirmation Mockup */}
                  <div className="md:col-span-7 bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4 font-sans">
                    
                    {/* User Command Bubble */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        Dr
                      </div>
                      <div className="bg-blue-950/60 border border-blue-500/30 rounded-2xl rounded-tl-none p-3.5 text-xs text-blue-100 max-w-sm">
                        <div className="font-mono text-[10px] text-blue-400 mb-1">Doctor Command</div>
                        "{currentFlow.userInput}"
                      </div>
                    </div>

                    {/* AI Response & Action Preparation Bubble */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        AI
                      </div>
                      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl rounded-tl-none p-4 text-xs text-slate-200 w-full space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-purple-400 font-bold">Action Prepared</span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px] font-bold">Awaiting Confirmation</span>
                        </div>
                        <p className="text-slate-300 font-medium">{currentFlow.aiResponse}</p>

                        {/* Extracted Details Table */}
                        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1.5">
                          {currentFlow.actionDetails.map((det, i) => (
                            <div key={i} className="flex justify-between text-[11px]">
                              <span className="text-slate-400">{det.label}:</span>
                              <span className="text-white font-semibold">{det.val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Confirmation Bar */}
                        <div className="pt-2 flex items-center gap-2">
                          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5">
                            <Check size={14} />
                            <span>Confirm & Save</span>
                          </button>
                          <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium">
                            Edit Details
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })()}

          </div>

        </div>
      </section>

      {/* REVENUE / CLINIC PERFORMANCE SECTION */}
      <section id="revenue" className="py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-[#06B6D4] bg-cyan-100 px-3 py-1 rounded-full">
              Financial Intelligence
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              See Your Clinic Revenue Clearly
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#475569]">
              Get real-time visibility into your clinic's daily collections, monthly performance, and outstanding balances.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl" data-aos="fade-up">
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">Today's Revenue</div>
                <div className="mt-2 text-3xl font-extrabold text-[#0F172A]">Tracked Live</div>
                <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <TrendingUp size={14} />
                  <span>Real-time collection monitoring</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">Monthly Revenue & Trends</div>
                <div className="mt-2 text-3xl font-extrabold text-[#2563EB]">Categorized</div>
                <div className="mt-2 text-xs font-semibold text-[#475569]">Breakdown by dental procedures</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">Outstanding Balances</div>
                <div className="mt-2 text-3xl font-extrabold text-amber-600">Pending Dues</div>
                <div className="mt-2 text-xs font-semibold text-[#475569]">Clear unpaid patient tracking</div>
              </div>
            </div>

            {/* Dashboard Visual Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
              <img
                src={dashboardimg}
                alt="MyDentalClinicPro Revenue Analytics Dashboard"
                className="w-full h-auto object-cover"
              />
            </div>

          </div>

        </div>
      </section>

      {/* PATIENT ENGAGEMENT / NOTIFICATION SECTION */}
      <section id="patient-engagement" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6" data-aos="fade-right">
              <span className="text-xs font-bold uppercase tracking-widest text-[#06B6D4] bg-cyan-100 px-3 py-1 rounded-full">
                Automated Reminders
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                Keep Patients Connected
              </h2>
              <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
                Never miss a patient follow-up with automated reminders and clinic notifications.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="p-3 rounded-xl bg-blue-50 text-[#2563EB]">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Appointment Reminders</h3>
                    <p className="text-xs sm:text-sm text-[#475569] mt-0.5">Timely notifications so patients arrive on time for scheduled visits.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="p-3 rounded-xl bg-cyan-50 text-[#06B6D4]">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Care Follow-Up Reminders</h3>
                    <p className="text-xs sm:text-sm text-[#475569] mt-0.5">Notify patients when post-procedure checkups or root canals are due.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Payment Reminders</h3>
                    <p className="text-xs sm:text-sm text-[#475569] mt-0.5">Automated updates regarding outstanding clinic treatment balances.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Phone Mockup */}
            <div className="lg:col-span-6 flex justify-center" data-aos="fade-left">
              <div className="w-full max-w-sm bg-[#0F172A] p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 relative">
                <div className="w-32 h-4 bg-slate-800 mx-auto rounded-full mb-4" />

                <div className="bg-slate-950 rounded-[28px] p-4 text-white space-y-3 min-h-[480px]">
                  <div className="text-center text-xs font-semibold text-slate-400 py-2">
                    Clinic Notification Feed
                  </div>

                  <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 shadow-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-blue-400 font-semibold">
                      <span className="flex items-center gap-1"><Bell size={12} /> Appointment</span>
                      <span className="text-[10px] text-slate-400">Just Now</span>
                    </div>
                    <div className="text-xs font-bold text-white">Tomorrow's Visit</div>
                    <div className="text-xs text-slate-300">
                      "Your appointment with Dr. Swati Lahane is tomorrow at 10:30 AM."
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Care Follow-Up</span>
                      <span className="text-[10px] text-slate-400">2h ago</span>
                    </div>
                    <div className="text-xs font-bold text-white">Dental Follow-up</div>
                    <div className="text-xs text-slate-300">
                      "Your dental follow-up checkup is due this week."
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                      <span className="flex items-center gap-1"><CreditCard size={12} /> Billing</span>
                      <span className="text-[10px] text-slate-400">Yesterday</span>
                    </div>
                    <div className="text-xs font-bold text-white">Payment Due</div>
                    <div className="text-xs text-slate-300">
                      "Your outstanding clinic payment balance is due."
                    </div>
                  </div>

                </div>

                <div className="w-28 h-1 bg-slate-700 mx-auto rounded-full mt-3" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* WHY CLINICS CHOOSE US */}
      <section className="py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Why Dental Clinics Choose <span className="text-[#2563EB]">MyDentalClinicPro</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {benefitsList.map((b, i) => {
              const BIcon = b.icon;
              return (
                <div
                  key={i}
                  data-aos="zoom-in"
                  data-aos-delay={i * 80}
                  className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200/80 hover:shadow-lg transition-all"
                >
                  <BIcon size={24} className="text-[#2563EB] mb-3" />
                  <h3 className="text-base font-bold text-[#0F172A]">{b.title}</h3>
                  <p className="mt-2 text-xs text-[#475569] leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECURITY / TRUST SECTION */}
      <section className="py-20 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-12" data-aos="fade-up">
            <ShieldCheck size={40} className="mx-auto text-[#06B6D4] mb-4" />
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Your Clinic. Your Data. Your Control.
            </h2>
            <p className="mt-3 text-slate-400">
              Built with enterprise security standards, role-based clinic scoping, and encrypted transmission.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <Lock size={24} className="mx-auto text-blue-400 mb-2" />
              <div className="font-bold text-white">Role-Based Access</div>
              <div className="text-xs text-slate-400 mt-1">Separate Doctor and Staff access controls.</div>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <Shield size={24} className="mx-auto text-cyan-400 mb-2" />
              <div className="font-bold text-white">Protected Records</div>
              <div className="text-xs text-slate-400 mt-1">Encrypted clinic-isolated database storage.</div>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <Zap size={24} className="mx-auto text-purple-400 mb-2" />
              <div className="font-bold text-white">Continuous Uptime</div>
              <div className="text-xs text-slate-400 mt-1">Instant web and mobile synchronization 24/7.</div>
            </div>
          </div>

        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-20 bg-slate-50 text-center">
        <div className="max-w-3xl mx-auto px-6" data-aos="fade-up">
          <div className="flex justify-center gap-1 text-amber-400 mb-4">
            <Star size={20} fill="currentColor" />
            <Star size={20} fill="currentColor" />
            <Star size={20} fill="currentColor" />
            <Star size={20} fill="currentColor" />
            <Star size={20} fill="currentColor" />
          </div>
          <p className="text-xl sm:text-2xl italic text-[#0F172A] font-medium leading-relaxed">
            “Managing my clinic has become 10x easier. Everything is digital now.”
          </p>
          <div className="mt-6">
            <div className="font-bold text-[#0F172A] text-lg">Dr. Swati Lahane</div>
            <div className="text-xs text-[#2563EB] font-semibold uppercase tracking-wider mt-0.5">Clinical Advisor & Dentist</div>
          </div>
        </div>
      </section>

      {/* PRICING ANCHOR SECTION */}
      <section id="pricing" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-blue-100 px-3 py-1 rounded-full">
              SaaS Pricing Plans
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Flexible Plans for Modern Dental Clinics
            </h2>
            <p className="mt-4 text-base text-[#475569]">
              Choose the tier that matches your clinic's scale and AI requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Standard Plan */}
            <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-200 flex flex-col justify-between" data-aos="fade-right">
              <div>
                <div className="text-lg font-bold text-[#0F172A]">Standard Practice Tier</div>
                <p className="text-xs text-[#475569] mt-1">Ideal for individual dental practitioners & growing clinics.</p>

                <ul className="mt-6 space-y-3 text-sm text-[#0F172A]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Digital Patient & Medical History</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Smart Appointment Scheduling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Billing & Financial Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Mobile Access Portal</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={openSignupModal}
                className="mt-8 w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold rounded-xl transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Pro AI Plan */}
            <div className="bg-gradient-to-b from-blue-900 to-indigo-950 text-white rounded-3xl p-8 border border-blue-700/50 flex flex-col justify-between relative shadow-xl glow-blue" data-aos="fade-left">
              <div className="absolute top-4 right-4 bg-[#7C3AED] text-white text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full">
                AI Included
              </div>

              <div>
                <div className="text-lg font-bold text-white">Pro AI Practice Tier</div>
                <p className="text-xs text-blue-200 mt-1">Includes 4 conversational AI workflows & prescription assistance.</p>

                <ul className="mt-6 space-y-3 text-sm text-blue-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#06B6D4]" />
                    <span>Everything in Standard Tier</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-purple-300" />
                    <span>AI Create Patient & Prescription</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-purple-300" />
                    <span>AI Update Patient & Treatment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#06B6D4]" />
                    <span>Automated Reminders & Priority Support</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={openBookDemoModal}
                className="mt-8 w-full py-3 bg-[#06B6D4] hover:bg-cyan-300 text-slate-950 font-bold rounded-xl transition-all shadow-md"
              >
                Request a Demo
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-10 sm:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl mx-auto space-y-6 relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Ready to Run Your Clinic Smarter?
              </h2>
              <p className="text-base sm:text-xl text-blue-100 leading-relaxed">
                Bring patient management, appointments, treatments, AI-powered workflows and clinic performance into one modern platform.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={openSignupModal}
                  className="px-8 py-4 bg-[#06B6D4] hover:bg-cyan-300 text-slate-950 font-bold rounded-full shadow-lg transition-all transform hover:scale-105"
                >
                  Get Started
                </button>

                <button
                  onClick={openBookDemoModal}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-full transition-all"
                >
                  Request a Demo
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F172A] text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

            {/* Brand Column */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <img src={logo} alt="MyDentalClinicPro Logo" className="h-8 w-8 object-contain" />
                <span className="text-xl font-extrabold text-white tracking-tight">
                  <span className="text-[#2563EB]">My</span>
                  <span className="text-[#DC2626]">Dental</span>
                  <span className="text-white">ClinicPro</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Modern dental clinic management for appointments, patient care, AI-powered workflows and clinic performance.
              </p>
            </div>

            {/* Product Links */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-[#06B6D4] transition-colors">Features</a></li>
                <li><a href="#ai" className="hover:text-[#7C3AED] transition-colors">AI</a></li>
                <li><a href="#revenue" className="hover:text-[#06B6D4] transition-colors">Revenue</a></li>
                <li><a href="#pricing" className="hover:text-[#06B6D4] transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/app/customer-care" className="hover:text-[#06B6D4] transition-colors">Contact & Support</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-[#06B6D4] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Stay Updated */}
            <div className="md:col-span-4 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Stay Updated</h3>
              <p className="text-xs text-slate-400">Subscribe for clinic management tips and SaaS product updates.</p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-sm transition-colors flex-shrink-0"
                >
                  Subscribe
                </button>
              </form>
              {newsletterStatus && (
                <div className="text-xs text-emerald-400 font-medium">{newsletterStatus}</div>
              )}
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-slate-900 text-center text-xs text-slate-500 space-y-2">
            <p>© 2026 MyDentalClinicPro. All rights reserved. • <Link to="/privacy-policy" className="text-slate-400 hover:text-[#06B6D4] underline">Privacy Policy</Link></p>
            <p>Built by Ajaykumar Bhatane and Clinical Advisor Dr. Swati Lahane/Bhatane.</p>
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

      {/* SIGNUP REQUEST MODAL (INSTANT OPEN, SUB-MILLISECOND VISIBILITY) */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 modal-backdrop-instant">
          <div className="w-full max-w-5xl max-h-[94dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col modal-content-instant">
            
            {/* Header */}
            <div className="flex-shrink-0 bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Request Clinic Signup</h3>
                <p className="text-xs text-slate-500 mt-0.5">Fill Doctor Info and Clinic registration details</p>
              </div>
              <button
                type="button"
                onClick={closeSignupModal}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSignupSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
                
                {signupError && (
                  <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
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
                      <label className="label">Email *</label>
                      <input
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => handleSignupInput("email", e.target.value)}
                        className={`input2 w-full ${signupErrors.email ? "border-red-500" : ""}`}
                        placeholder="Enter doctor email"
                        required
                      />
                      {signupErrors.email && <p className="mt-1 text-xs text-red-600">{signupErrors.email}</p>}
                    </div>

                    <div>
                      <label className="label">Gender *</label>
                      <ChoiceSelect
                        which="user/gender"
                        value={signupForm.gender}
                        onChange={(e) => handleSignupInput("gender", e.target.value)}
                        className="input2 w-full"
                        required
                        placeholder="Select Gender"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">Primary Phone *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={signupForm.mobile}
                        onChange={(e) => handleSignupInput("mobile", e.target.value)}
                        className={`input2 w-full ${signupErrors.mobile ? "border-red-500" : ""}`}
                        placeholder="+91 XXXXX XXXXX"
                        required
                      />
                      {signupErrors.mobile && <p className="mt-1 text-xs text-red-600">{signupErrors.mobile}</p>}
                    </div>

                    <div>
                      <label className="label">Secondary Phone</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={signupForm.secondary_phone_number}
                        onChange={(e) => handleSignupInput("secondary_phone_number", e.target.value)}
                        className="input2 w-full"
                        placeholder="Optional"
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
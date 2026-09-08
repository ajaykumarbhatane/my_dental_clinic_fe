import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  FileText, 
  Database, 
  Server, 
  Smartphone, 
  UserCheck, 
  Trash2, 
  Mail, 
  Phone, 
  ArrowLeft, 
  CheckCircle2,
  Stethoscope,
  Eye,
  Bell,
  CreditCard,
  Building2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import logo from '../assets/mydentalclinicpro_logo.png';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = "September 8, 2026";
  const appName = "My Dental Clinic Pro";
  const appId = "com.mydentalclinicpro.app";
  const contactEmail = "support@mydentalproclinicpro.com";
  const contactPhone = "+91 9970609951";

  const quickNavItems = [
    { id: "introduction", label: "1. Introduction" },
    { id: "scope", label: "2. Scope of Policy" },
    { id: "information-collected", label: "3. Information We Collect" },
    { id: "personal-info", label: "4. Personal Information" },
    { id: "health-dental-info", label: "5. Health & Dental Information" },
    { id: "patient-info", label: "6. Patient Record Data" },
    { id: "account-auth", label: "7. Account & Auth Information" },
    { id: "appointments-treatments", label: "8. Appointment & Treatment Data" },
    { id: "images-documents", label: "9. Images & Prescriptions" },
    { id: "device-technical", label: "10. Technical Data" },
    { id: "how-we-use", label: "11. How We Use Information" },
    { id: "storage-location", label: "12. Storage & Hosting" },
    { id: "data-security", label: "13. Data Security Measures" },
    { id: "data-sharing", label: "14. Data Sharing & Disclosure" },
    { id: "third-parties", label: "15. Third-Party Services" },
    { id: "data-retention", label: "16. Data Retention" },
    { id: "account-deletion", label: "17. Account & Data Deletion" },
    { id: "user-rights", label: "18. Healthcare Provider & User Rights" },
    { id: "childrens-privacy", label: "19. Children's Privacy" },
    { id: "medical-disclaimer", label: "20. Healthcare Disclaimer" },
    { id: "international-transfers", label: "21. Data Transfers" },
    { id: "policy-changes", label: "22. Changes to Policy" },
    { id: "contact-us", label: "23. Contact Information" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="My Dental Clinic Pro Logo" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  <span className="text-blue-600">MyDental</span>ClinicPro
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">Privacy Policy</p>
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Official Google Play Privacy Document
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Detailed information regarding data collection, health record processing, security safeguards, and user rights for <span className="text-white font-semibold">{appName}</span>.
          </p>
          <div className="pt-2 text-xs text-slate-400 flex flex-wrap justify-center gap-4">
            <span><strong>Application ID:</strong> {appId}</span>
            <span>•</span>
            <span><strong>Effective Date:</strong> {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-4 gap-8">
        
        {/* QUICK NAVIGATION (SIDEBAR ON DESKTOP) */}
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-20 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
              Policy Sections
            </h3>
            <nav className="space-y-1">
              {quickNavItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block px-2.5 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium truncate"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* POLICY CONTENT */}
        <article className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-10">
          
          {/* SUMMARY BOX */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Key Privacy Commitments at a Glance</span>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2 text-xs text-blue-950">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">•</span>
                <span>Designed specifically for licensed dental professionals and clinic staff.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">•</span>
                <span>We <strong>do not sell</strong> personal or medical data to any third party.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">•</span>
                <span>Encrypted transit (HTTPS/TLS) for API & media transfers.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">•</span>
                <span>Full support for in-app record management & account deletion.</span>
              </li>
            </ul>
          </div>

          {/* 1. INTRODUCTION */}
          <section id="introduction" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">1.</span> Introduction
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Welcome to <strong>My Dental Clinic Pro</strong> ("Application", "Service", "We", "Us", or "Our"). This Privacy Policy explains how <strong>My Dental Clinic Pro</strong> (Application ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 text-xs">{appId}</code>) collects, stores, uses, processes, and protects information when dental clinic operators, doctors, clinical staff, and administrative users utilize our application and platform.
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              My Dental Clinic Pro serves as a professional dental practice management application created to assist dental clinic staff in organizing appointment scheduling, managing patient clinical histories, generating digital prescriptions, recording visit progress, and administering clinic subscriptions.
            </p>
          </section>

          {/* 2. SCOPE */}
          <section id="scope" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">2.</span> Scope of this Privacy Policy
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              This policy applies to all features, functions, web portals, and Android mobile application deployments of <strong>My Dental Clinic Pro</strong>.
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              The primary users of this application are healthcare professionals (dentists, dental specialists, clinic administrators, and support staff). When clinic users input information concerning their patients into the application, the clinic user acts as the primary data controller for their patient clinical records, while My Dental Clinic Pro acts as a secure data processor providing platform infrastructure.
            </p>
          </section>

          {/* 3. INFORMATION WE COLLECT */}
          <section id="information-collected" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">3.</span> Information We Collect
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              To deliver dental practice management tools, appointment tracking, and billing services, we collect specific categories of personal, clinical, financial, and technical information strictly necessary for operational functionality.
            </p>
          </section>

          {/* 4. PERSONAL INFORMATION */}
          <section id="personal-info" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>4. Personal Information (Healthcare Providers & Staff)</span>
            </h3>
            <p className="text-sm leading-relaxed text-slate-700">
              When dentists or staff register an account, request a clinic sign-up, or manage user profiles, we collect:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
              <li><strong>User Account Details:</strong> First Name, Last Name, Email Address (used as primary login identifier), and Password (stored as secure salted hashes).</li>
              <li><strong>Contact Information:</strong> Primary Mobile Phone Number (10-digit format), Secondary Phone Number.</li>
              <li><strong>Professional Identifiers:</strong> Professional Qualification (e.g., BDS, MDS), Dental Council Medical Registration Number, Role assignment (Doctor, Admin, Staff, Associate).</li>
              <li><strong>Clinic Organization Data:</strong> Clinic Name, Clinic Contact Number, Clinic Street Address, and Clinic Operating Details.</li>
            </ul>
          </section>

          {/* 5. HEALTH AND DENTAL INFORMATION */}
          <section id="health-dental-info" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              <span>5. Health and Dental Information</span>
            </h3>
            <p className="text-sm leading-relaxed text-slate-700">
              My Dental Clinic Pro enables dental clinics to record and store sensitive health information required for clinical diagnosis and continuous dental care. This includes:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm text-slate-700">
              <p><strong>• Patient Medical History:</strong> Recorded systemic medical conditions (e.g., diabetes, hypertension, cardiac history, bleeding disorders, drug allergies).</p>
              <p><strong>• Patient Dental History:</strong> Past oral procedures, previous extractions, restorations, and dental complaints.</p>
              <p><strong>• Clinical Findings & Diagnosis:</strong> Initial clinical examination observations, tooth cavity identification, periodontal assessments, and diagnostic notes.</p>
              <p><strong>• Treatment Planning & Progress Notes:</strong> Assigned treatment types (e.g., Root Canal Treatment, Orthodontic Braces, Dental Crowns/Caps, Extractions, Fillings), estimated procedure duration, braces category (metal/ceramic), cap/crown materials (zirconia/ceramic/metal/CAD-CAM), and visit-by-visit treatment progress notes.</p>
            </div>
          </section>

          {/* 6. PATIENT RECORD DATA */}
          <section id="patient-info" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>6. Patient Record Information</span>
            </h3>
            <p className="text-sm leading-relaxed text-slate-700">
              When clinic users add or manage patients within their clinic account, the following patient details are maintained:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li>Patient Full Name (First Name, Last Name)</li>
              <li>Primary Mobile Number & Secondary Mobile Number</li>
              <li>Date of Birth / Calculated Age</li>
              <li>Gender</li>
              <li>Residential / Contact Address</li>
            </ul>
          </section>

          {/* 7. ACCOUNT AND AUTHENTICATION */}
          <section id="account-auth" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">7.</span> Account and Authentication Information
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Authentication relies on token-based security architecture (Django REST Knox). Upon authentication, an encrypted session token is stored locally on the user's mobile device via <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-800">localStorage</code> (or fallback <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-800">sessionStorage</code>). This token authorizes subsequent API requests and automatically expires upon logout.
            </p>
          </section>

          {/* 8. APPOINTMENTS AND TREATMENTS */}
          <section id="appointments-treatments" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">8.</span> Appointment, Visit, and Financial Information
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              The application tracks scheduled patient visits, next appointment dates, visit treatment notes, patient complaints, planned treatment costs, and individual visit payment amounts (categorized by payment modes such as Cash, Card, or UPI).
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              For clinic subscription plan purchases, the application incorporates the <strong>Razorpay Android Checkout SDK</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-800">com.razorpay:checkout</code>) and supports UPI payment gateway app interactions. Payment transaction IDs and subscription expiry dates are stored for subscription verification.
            </p>
          </section>

          {/* 9. IMAGES AND DOCUMENTS */}
          <section id="images-documents" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">9.</span> Images, Documents, and Files
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              The application manages digital media and documents crucial to dental practice:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
              <li><strong>Patient Visit Images:</strong> Intraoral photos, pre-and post-procedure images uploaded by clinic staff are stored securely in Amazon Web Services (AWS S3) cloud storage and accessed via secure presigned URLs.</li>
              <li><strong>Prescription Documents:</strong> Generated digital prescriptions containing clinic headers, doctor credentials, prescribed medications, dosages, frequency, and instructions are compiled into PDF documents stored in AWS S3.</li>
              <li><strong>Educational Media:</strong> Patient education treatment reference videos are stored in AWS S3 for clinical demonstration.</li>
            </ul>
          </section>

          {/* 10. DEVICE AND TECHNICAL INFORMATION */}
          <section id="device-technical" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">10.</span> Device and Technical Information
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              When operating the mobile application, the following device parameters are processed:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
              <li><strong>Push Notification Tokens:</strong> Firebase Cloud Messaging (FCM) device registration tokens, device model names, and application versions are registered to deliver appointment reminders and subscription expiration warnings.</li>
              <li><strong>Android App Permissions:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1 text-xs text-slate-600">
                  <li><code className="bg-slate-100 px-1 py-0.5 rounded">INTERNET</code>: Required for secure communication with backend servers, AWS S3 file hosting, and subscription gateways.</li>
                  <li><code className="bg-slate-100 px-1 py-0.5 rounded">POST_NOTIFICATIONS</code>: Required on Android 13+ (API level 33+) to display appointment reminders and system alerts.</li>
                </ul>
              </li>
            </ul>
            <p className="text-xs text-slate-500 italic">
              Note: The application does NOT request or access Camera, Device Location, Device Contacts, or General External Storage permissions.
            </p>
          </section>

          {/* 11. HOW WE USE INFORMATION */}
          <section id="how-we-use" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">11.</span> How We Use Information
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Information collected is used strictly for legitimate practice management purposes:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-900 mb-1">Clinic Management</p>
                <p className="text-xs text-slate-600">To maintain patient dental charts, visit timelines, diagnostic notes, and treatment histories.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-900 mb-1">Prescriptions & Invoicing</p>
                <p className="text-xs text-slate-600">To generate downloadable PDF prescriptions and record visit billing summaries.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-900 mb-1">Notifications & Reminders</p>
                <p className="text-xs text-slate-600">To dispatch automated appointment notifications and clinic plan renewal alerts.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-900 mb-1">AI Assistant Features</p>
                <p className="text-xs text-slate-600">To process clinical summary requests with automated server-side PII scrubbing prior to model evaluation.</p>
              </div>
            </div>
          </section>

          {/* 12. STORAGE AND LOCATION */}
          <section id="storage-location" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">12.</span> Storage and Hosting Infrastructure
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Application databases are hosted on secure cloud database servers running PostgreSQL. Digital media assets (patient visit photos, prescription PDFs, treatment videos) are stored in Amazon Web Services (AWS S3) bucket storage with restricted public access and presigned temporary URL access models.
            </p>
          </section>

          {/* 13. DATA SECURITY */}
          <section id="data-security" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">13.</span> Data Security Safeguards
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              We employ robust administrative, technical, and physical security measures to safeguard user and patient data:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
              <li><strong>Encryption in Transit:</strong> All communications between the mobile app, web application, and backend APIs occur over encrypted HTTPS/TLS protocols.</li>
              <li><strong>Role-Based Access Control (RBAC):</strong> Access controls ensure doctors and clinic staff can only view and manage patient records assigned to their specific clinic organization.</li>
              <li><strong>PII Scrubbing for AI Tasks:</strong> Tools connecting with OpenAI API automatically filter and scrub personal identifiers (such as mobile numbers, emails, home addresses, and names) prior to processing.</li>
              <li><strong>Token Expiry & Isolation:</strong> Authentication sessions use Django REST Knox cryptographic tokens stored securely.</li>
            </ul>
          </section>

          {/* 14. DATA SHARING AND DISCLOSURE */}
          <section id="data-sharing" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">14.</span> Data Sharing and Disclosure
            </h2>
            <p className="text-sm leading-relaxed font-semibold text-slate-900">
              We DO NOT sell, rent, trade, or monetize personal, medical, or dental data to advertising networks, data brokers, or third-party marketers under any circumstances.
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              Data is shared strictly with essential service infrastructure providers to perform application operations:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li><strong>Cloud Storage:</strong> Amazon Web Services (AWS S3) for secure image and document hosting.</li>
              <li><strong>Push Notifications:</strong> Google Firebase Cloud Messaging (FCM) for push alert delivery.</li>
              <li><strong>Payment Processing:</strong> Razorpay for processing subscription transactions.</li>
              <li><strong>Legal Compliance:</strong> If required by law, subpoena, or valid government regulation.</li>
            </ul>
          </section>

          {/* 15. THIRD PARTY SERVICES */}
          <section id="third-parties" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">15.</span> Third-Party Services
            </h2>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-semibold text-slate-900">1. Google Firebase Cloud Messaging (FCM)</p>
                <p className="text-xs text-slate-600 mt-1">Used to dispatch mobile push notifications. Processes device push tokens and notification payloads under Google's Privacy Policy.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-semibold text-slate-900">2. Amazon Web Services (AWS S3)</p>
                <p className="text-xs text-slate-600 mt-1">Used for encrypted file hosting of patient images, prescriptions, and videos under AWS Data Security standards.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-semibold text-slate-900">3. Razorpay Payment Gateway</p>
                <p className="text-xs text-slate-600 mt-1">Used for processing clinic software subscription billing securely under Razorpay PCI-DSS compliant checkout systems.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-semibold text-slate-900">4. OpenAI API</p>
                <p className="text-xs text-slate-600 mt-1">Used for optional AI clinical assistant tools with server-side PII sanitization.</p>
              </div>
            </div>
          </section>

          {/* 16. DATA RETENTION */}
          <section id="data-retention" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">16.</span> Data Retention Policy
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Personal information and clinical records are retained for as long as the clinic maintains an active account with My Dental Clinic Pro to enable continuous dental care delivery and medical record access.
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              When a patient record or visit entry is deleted by clinic staff in the application, associated database records and S3 images are removed. If an account is closed or account deletion is requested, all account user data and associated clinic data will be permanently purged within 30 days, except where longer retention is mandated by law or tax compliance.
            </p>
          </section>

          {/* 17. ACCOUNT AND DATA DELETION */}
          <section id="account-deletion" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>17. Account and Data Deletion Procedures</span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              My Dental Clinic Pro respects your right to data deletion in compliance with Google Play User Data policies:
            </p>
            <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-3 text-sm text-slate-800">
              <p className="font-bold text-red-900">In-App Record Deletion:</p>
              <p className="text-xs text-slate-700">Clinic staff can directly delete individual patient records, visit entries, treatment entries, prescriptions, and visit images at any time directly through the application interface.</p>
              <p className="font-bold text-red-900">Full Account & Clinic Data Erasure Request:</p>
              <p className="text-xs text-slate-700">To request complete removal of your doctor account, clinic profile, and all associated patient records, you can submit a written request to our support team:</p>
              <div className="bg-white p-3 rounded-lg border border-red-200 text-xs font-mono text-slate-800 space-y-1">
                <p>Email: <a href={`mailto:${contactEmail}`} className="text-blue-600 underline">{contactEmail}</a></p>
                <p>Subject: Account Deletion Request - [Clinic Name / Email]</p>
              </div>
              <p className="text-xs text-slate-600">Upon verification, your account, authentication tokens, FCM device registrations, and database records will be permanently deleted.</p>
            </div>
          </section>

          {/* 18. USER RIGHTS */}
          <section id="user-rights" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">18.</span> User Rights
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Healthcare providers and account owners possess the following rights regarding their data:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li><strong>Right to Access:</strong> View and export clinic records, patient profiles, and visit notes at any time.</li>
              <li><strong>Right to Rectification:</strong> Edit and update user details, clinic settings, and patient clinical records.</li>
              <li><strong>Right to Erasure:</strong> Delete specific records or request full account termination.</li>
              <li><strong>Right to Withdraw Consent:</strong> Unregister device push notification settings or log out of active sessions.</li>
            </ul>
          </section>

          {/* 19. CHILDREN'S PRIVACY */}
          <section id="childrens-privacy" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">19.</span> Children's Privacy
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              The application account registration is intended solely for adult healthcare professionals and clinic staff.
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              Pediatric dental patient records (children under 18 years of age) may only be entered into the system by authorized clinic staff with appropriate parent or guardian consent in accordance with standard clinical care practices. We do not knowingly collect personal information directly from children.
            </p>
          </section>

          {/* 20. HEALTHCARE DISCLAIMER */}
          <section id="medical-disclaimer" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>20. Healthcare & Medical Disclaimer</span>
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed space-y-2">
              <p className="font-bold">Important Clinical Notice:</p>
              <p>My Dental Clinic Pro is practice management software intended to support workflow administration. The software does NOT provide medical advice, independent diagnosis, or professional clinical treatment decisions.</p>
              <p>Licensed dental practitioners remain solely responsible for validating all treatment plans, clinical diagnostic notes, prescription dosages, and dental procedures before administration to patients.</p>
            </div>
          </section>

          {/* 21. INTERNATIONAL DATA TRANSFERS */}
          <section id="international-transfers" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">21.</span> International Data Transfers
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Data processed by My Dental Clinic Pro is stored primarily on cloud infrastructure. If cloud services process data outside your state or country, appropriate contractual and security safeguards (such as encrypted storage and TLS transit) ensure protection consistent with this Privacy Policy.
            </p>
          </section>

          {/* 22. CHANGES TO PRIVACY POLICY */}
          <section id="policy-changes" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-blue-600">22.</span> Changes to This Privacy Policy
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              We may update this Privacy Policy periodically to reflect operational modifications or regulatory updates. When updates occur, the "Effective Date" at the top of this document will be revised. We encourage users to review this policy periodically. Continued use of the application following updates constitutes acceptance of the modified policy.
            </p>
          </section>

          {/* 23. CONTACT US */}
          <section id="contact-us" className="space-y-4 scroll-mt-24 bg-slate-900 text-white p-6 rounded-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Mail className="w-5 h-5 text-blue-400" />
              <span>23. Contact Information</span>
            </h2>
            <p className="text-sm text-slate-300">
              For questions regarding this Privacy Policy, data safety practices, or account deletion requests, please contact our support team:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <p className="font-semibold text-slate-200">Official Support Email</p>
                <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline mt-1 block font-mono">
                  {contactEmail}
                </a>
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <p className="font-semibold text-slate-200">Support Phone / WhatsApp</p>
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="text-blue-400 hover:underline mt-1 block font-mono">
                  {contactPhone}
                </a>
              </div>
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
              <p><strong>App Name:</strong> {appName}</p>
              <p><strong>Application ID:</strong> {appId}</p>
              <p><strong>Clinical Advisor & Founder:</strong> Dr. Swati Lahane / Ajaykumar Bhatane</p>
            </div>
          </section>

        </article>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-xs space-y-2">
        <p>© 2026 MyDentalClinicPro ({appId}). All rights reserved.</p>
        <p className="text-slate-500">Official Google Play Store Privacy Document</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;

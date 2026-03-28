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
} from "lucide-react";
import dashboardimg from "../assets/dashboard.png";
import treatmentsimg from "../assets/treatments.png";

const features = [
  {
    icon: FileText,
    title: "100% Digital Patient Records",
    desc: "Securely manage history, treatment plans, x-rays & insurance.",
  },
  {
    icon: Calendar,
    title: "Smart Appointment Scheduler",
    desc: "Real-time booking, reminders & intelligent scheduling.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly Clinic Portal",
    desc: "Access your clinic anytime, anywhere seamlessly.",
  },
  {
    icon: MessageCircle,
    title: "Patient Communication Hub",
    desc: "SMS, email reminders & automated follow-ups.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Save 2+ Hours Daily",
  },
  {
    icon: TrendingUp,
    title: "Increase Patient Retention",
  },
  {
    icon: Shield,
    title: "99.9% Secure Data",
  },
];

const Landing = () => {
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  const slides = [
    { img: dashboardimg },
    { img: treatmentsimg }
  ];

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!paused) {
      const interval = setInterval(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [paused, slides.length]);

  return (
    <div className="text-slate-700">

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex justify-between items-center px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold">
            <span className="text-blue-600">MyDental</span>ClinicPro
          </h1>

          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition"
          >
            Login
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-24">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">

          <div data-aos="fade-right">
            <h1 className="text-4xl font-bold leading-tight">
              Dental Clinic Management <br /> Made Simple
            </h1>

            <p className="mt-4 text-blue-100">
              Manage patients, appointments, billing & analytics — all in one platform.
            </p>

            <p className="mt-3 text-sm text-blue-200">
              Trusted by clinics across Maharashtra • Setup in 2 minutes
            </p>

            <div className="mt-6 flex gap-4">
              <button className="bg-cyan-400 text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition shadow-lg">
                Start Free Setup
              </button>

              <button className="border border-white px-6 py-3 rounded-full hover:bg-white/10 transition">
                Book Demo
              </button>
            </div>
          </div>

          {/* ✅ WORKING SLIDER */}
          <div
  onMouseEnter={() => setPaused(true)}
  onMouseLeave={() => setPaused(false)}
  className="relative rounded-2xl p-3 bg-white/10 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition"
>
  {/* INNER LAYER */}
  <div className="bg-white/5 rounded-xl p-3">

    {/* SLIDER */}
    <div className="overflow-hidden rounded-xl h-[300px]">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${current * 100}%)`,
        }}
      >
        {slides.map((slide, i) => (
          <img
            key={i}
            src={slide.img}
            className="w-full h-[300px] object-cover flex-shrink-0 rounded-xl"
          />
        ))}
      </div>
    </div>

    {/* DOTS */}
    <div className="flex justify-center mt-4 gap-2">
      {slides.map((_, i) => (
        <div
          key={i}
          onClick={() => setCurrent(i)}
          className={`h-2 w-2 rounded-full cursor-pointer transition-all ${
            current === i
              ? "bg-cyan-400 w-5"
              : "bg-white/40"
          }`}
        />
      ))}
    </div>

  </div>
</div>
          </div>
      </section>

      {/* STATS */}
      <section className="bg-white py-20 border-b border-slate-200">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">

            <div data-aos="fade-up">
              <h3 className="text-4xl font-bold text-blue-600">1000+</h3>
              <p className="mt-2 text-slate-600">Appointments Managed</p>
            </div>

            <div data-aos="fade-up" data-aos-delay="150">
              <h3 className="text-4xl font-bold text-blue-600">500+</h3>
              <p className="mt-2 text-slate-600">Patients Handled</p>
            </div>

            <div data-aos="fade-up" data-aos-delay="300">
              <h3 className="text-4xl font-bold text-blue-600">99.9%</h3>
              <p className="mt-2 text-slate-600">Data Security</p>
            </div>

          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 text-center">

          <h2 className="text-3xl font-bold mb-10" data-aos="fade-up">
            Why Clinics Choose Us
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  data-aos="zoom-in"
                  className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition"
                >
                  <Icon className="mx-auto text-blue-600 mb-3" />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-20">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6">

          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900">
              Our Best of <span className="text-blue-600">Key Features</span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item, i) => {
              const Icon = item.icon;

              return (
                <div
                  key={i}
                  data-aos="zoom-in"
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                    <Icon size={22} />
                  </div>

                  <h3 className="font-semibold text-slate-800">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-slate-50 py-20 text-center">
        <div className="max-w-3xl mx-auto px-6" data-aos="fade-up">
          <p className="text-lg italic text-slate-700">
            “Managing my clinic has become 10x easier. Everything is digital now.”
          </p>
          <h4 className="mt-4 font-semibold text-blue-600">
            Dr. Swati Lahane
          </h4>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-20 text-center">
        <h2 className="text-3xl font-bold">
          Ready to Digitize Your Clinic?
        </h2>

        <p className="mt-3 text-blue-100">
          Start managing your clinic in just 2 minutes.
        </p>

        <button className="mt-6 bg-cyan-400 text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition">
          Get Started Now
        </button>
      </section>

      {/* WHATSAPP FLOAT */}
      <a
        href="https://wa.me/917558291536"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition z-50"
      >
        💬
      </a>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-4 gap-10">

          <div>
            <h3 className="text-white text-xl font-bold mb-3">
              MyDentalClinicPro
            </h3>
            <p className="text-sm text-slate-400">
              Modern dental clinic management system for appointments,
              patient care and automation.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Stay Updated</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="px-3 py-2 rounded-md bg-slate-700 text-sm w-full"
              />
              <button className="bg-blue-600 px-4 py-2 rounded-md text-sm">
                Subscribe
              </button>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-700 text-center text-xs py-6 text-slate-500">
          © 2026 MyDentalClinicPro. All rights reserved.
          <br></br>
          Built by Ajaykumar Bhatane and Clinical Advisor Dr. Swati Lahane.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
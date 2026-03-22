import { Phone, Mail, MessageCircle, HelpCircle } from 'lucide-react';

const CustomerCare = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#e0f2fe] to-[#eef2ff] text-gray-900 p-4 sm:p-6 md:p-8 space-y-10">

      {/* 🌊 TOP WAVE BACKGROUND */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg className="relative block w-[calc(100%+1.3px)] h-28" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22,103.59,29,158,17,70-16,136-56,206-62C438,1,512,31,583,53c69,21,138,23,209,2,36-11,69-29,104-35,69-12,138,8,204,35V0Z" opacity=".15" className="fill-blue-400"></path>
        </svg>
      </div>

      {/* ✨ LIGHT GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.15),transparent_40%)] pointer-events-none"></div>

      {/* 🔥 HEADER */}
      <div className="text-center relative z-10">
        <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase">
          DentalPro Support
        </p>

        <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">
          How can we help you today? 👋
        </h1>

        <p className="text-gray-600 max-w-2xl mx-auto mt-3">
          Get instant support for your clinic operations. Smooth, fast and reliable assistance.
        </p>
      </div>

      {/* 🚀 SUPPORT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">

        {/* CARD */}
        {[
          {
            icon: <Phone />,
            title: 'Call Support',
            desc: 'Speak directly with our team.',
            color: 'from-blue-500 to-indigo-500',
            link: 'tel:+919970609951',
            btn: 'Call Now →',
          },
          {
            icon: <MessageCircle />,
            title: 'WhatsApp',
            desc: 'Quick support via chat.',
            color: 'from-green-500 to-emerald-500',
            link: 'https://wa.me/919970609951',
            btn: 'Chat Now →',
          },
          {
            icon: <Mail />,
            title: 'Email Support',
            desc: 'Send queries anytime.',
            color: 'from-blue-500 to-sky-500',
            link: 'mailto:support@mydentalproclinicpro.com',
            btn: 'Send Email →',
          },
          {
            icon: <HelpCircle />,
            title: 'Help Center',
            desc: 'Browse FAQs & guides.',
            color: 'from-purple-500 to-indigo-500',
            link: '/help-center',
            btn: 'Explore →',
          },
        ].map((item, i) => (
          <div
            key={i}
            className="group bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white mb-3 shadow-md group-hover:scale-110 transition`}>
              {item.icon}
            </div>

            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="text-sm text-gray-600 mt-2">{item.desc}</p>

            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className={`inline-block mt-4 px-4 py-2 rounded-lg bg-gradient-to-r ${item.color} text-white text-sm font-semibold shadow hover:scale-105 transition`}
            >
              {item.btn}
            </a>
          </div>
        ))}
      </div>

      {/* 🕒 SUPPORT TIMING */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 text-center shadow-md relative z-10">
        <h3 className="text-xl font-bold">Support Availability</h3>
        <p className="text-gray-600 mt-2">
          Monday – Saturday: 9:00 AM – 8:00 PM <br />
          Sunday: Emergency support only
        </p>
      </div>

      {/* 👨‍💻 TEAM */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-md relative z-10">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold">Our Support Team</h3>
          <p className="text-gray-600">Helping clinics succeed every day.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Ajaykumar Bhatane', role: 'Technical Support' },
            { name: 'Dr. Swati Lahane', role: 'Clinical Advisor' },
            { name: 'Rahul', role: 'Customer Success' },
            { name: 'Priya', role: 'Product Support' },
          ].map((m, i) => (
            <div key={i} className="text-center bg-white rounded-2xl p-4 shadow hover:shadow-lg transition">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg mb-3">
                {m.name.charAt(0)}
              </div>
              <h4 className="font-semibold">{m.name}</h4>
              <p className="text-sm text-gray-500">{m.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 📱 FLOATING WHATSAPP */}
      <a
        href="https://wa.me/919970609951"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg animate-bounce z-50"
      >
        <MessageCircle size={24} />
      </a>

    </div>
  );
};

export default CustomerCare;

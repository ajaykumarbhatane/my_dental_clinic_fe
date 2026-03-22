const CustomerCare = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Care</h1>
          <p className="text-sm text-gray-600 mt-1">Support and contact information for your clinic.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Get Help</h2>
        <p className="text-gray-600 mb-6">If you need support, please use one of the options below to contact our team.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800">Phone</h3>
            <p className="text-gray-600 mt-1">+91-9970609951</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800">Email</h3>
            <p className="text-gray-600 mt-1">support@clinic.com</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
            <h3 className="font-semibold text-gray-800">Address</h3>
            <p className="text-gray-600 mt-1">New Delhi, India</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
            <h3 className="font-semibold text-gray-800">Working Hours</h3>
            <p className="text-gray-600 mt-1">Mon - Fri: 9:00 AM - 6:00 PM</p>
            <p className="text-gray-600">Sat: 9:00 AM - 2:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCare;

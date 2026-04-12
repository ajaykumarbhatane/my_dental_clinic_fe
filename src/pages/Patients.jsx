import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Phone } from 'lucide-react';
import { patientApi } from '../api/patientApi';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/dateUtils';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients(currentPage, searchTerm);
  }, [currentPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPatients(1, searchTerm);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = { page };
      if (search) params.search = search;

      const res = await patientApi.getAll(params);

      setPatients(res.data.results || res.data);
      setTotalCount(res.data.count || res.data.length);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 10));
      setCurrentPage(page);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-40">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow">
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients..."
          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Container */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full">

            {/* Sticky Header */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-sm text-gray-600">
                <th className="px-5 py-3 text-left font-semibold">Patient</th>
                <th className="px-5 py-3 text-left font-semibold">Mobile</th>
                <th className="px-5 py-3 text-left font-semibold">Doctor</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y">
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => navigate(`${patient.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition"
                >

                  {/* Patient */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <span className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </span>
                    </div>
                  </td>

                  {/* Mobile */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
                        {patient.mobile || 'N/A'}
                      </span>

                      {patient.mobile && (
                        <a
                          href={`tel:${patient.mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Doctor */}
                  <td className="px-5 py-3 text-gray-600">
                    {patient.assigned_doctor || 'N/A'}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(patient.created_at)}
                  </td>

                  {/* Actions */}
                  <td
                    className="px-5 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-3">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <Edit className="w-4 h-4 text-yellow-600" />
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fixed Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemCountText={`${((currentPage - 1) * 10) + 1} - ${Math.min(currentPage * 10, totalCount)} of ${totalCount}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
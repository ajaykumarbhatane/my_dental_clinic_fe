import { useState, useEffect } from 'react';
import { Video, Film } from 'lucide-react';
import { treatmentVideosApi } from '../api/treatmentVideosApi';

const TreatmentVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await treatmentVideosApi.getAll();
        setVideos(response.data);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Unable to load treatment videos.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Videos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Learn treatment protocols with video demos.
          </p>
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <Film className="w-6 h-6" />
          <span className="text-sm font-medium">Video Library</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
          <Video className="w-12 h-12 mb-4" />
          <p className="font-medium">No videos available yet.</p>
          <p className="text-sm">An admin can upload training videos from the Django admin panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{video.treatment_name}</h2>
                <p className="text-sm text-gray-500 mb-4">{video.description || 'Training video'}</p>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-full object-cover"
                    src={video.video_url}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreatmentVideos;

import apiClient from './apiClient';

export const visitsApi = {
  getAll: () => apiClient.get('/visits/'),
  getById: (id) => apiClient.get(`/visits/${id}/`),
  create: (data) => apiClient.post('/visits/', data),
  update: (id, data) => apiClient.put(`/visits/${id}/`, data),
  delete: (id) => apiClient.delete(`/visits/${id}/`),
  getByTreatment: (treatmentId) => apiClient.get('/visits/', { params: { treatment: treatmentId } }),
};

export const visitImagesApi = {
  getAll: () => apiClient.get('/visit-images/'),
  getById: (id) => apiClient.get(`/visit-images/${id}/`),
  getByVisit: (visitId) => apiClient.get('/visit-images/', { params: { visit: visitId } }),
  create: (data) => {
    const formData = new FormData();
    
    // Ensure file is properly appended
    if (data.image instanceof File || data.image instanceof Blob) {
      // Use filename if available, otherwise generate one
      const filename = data.image.name || `image_${Date.now()}.jpg`;
      formData.append('image', data.image, filename);
    } else if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.visit) {
      formData.append('visit', data.visit);
    }
    
    if (data.caption) {
      formData.append('caption', data.caption);
    }

    // Use longer timeout for mobile networks and large files
    return apiClient.post('/visit-images/', formData, {
      timeout: 60000, // 60 second timeout for image upload
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          // Can be used to update progress bar in UI
          console.log(`Upload progress: ${percentComplete}%`);
        }
      },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    if (data.image instanceof File || data.image instanceof Blob) {
      const filename = data.image.name || `image_${Date.now()}.jpg`;
      formData.append('image', data.image, filename);
    } else if (data.image instanceof File) {
      formData.append('image', data.image);
    }
    
    if (data.caption) {
      formData.append('caption', data.caption);
    }

    return apiClient.patch(`/visit-images/${id}/`, formData, {
      timeout: 60000, // 60 second timeout for image upload
    });
  },
  delete: (id) => apiClient.delete(`/visit-images/${id}/`),
};

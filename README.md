# Dental Clinic Management System - Frontend

A modern React frontend for managing dental clinic operations, built with Vite, React Router, Axios, TailwindCSS, and Lucide React Icons.

## Features

- **Dashboard**: Overview with statistics, charts, and upcoming visits

### Charts

The dashboard now includes two charts:

1. **Patients per Clinic** – bar chart showing number of patients associated with each clinic.
2. **Treatment Distribution** – doughnut chart showing count of treatments by type.

These are implemented using [Chart.js](https://www.chartjs.org/) and [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2).

After pulling the latest changes, install the new dependencies with:

```bash
cd dental_fe
npm install
```
- **Patient Management**: View, search, and manage patient records
- **Treatment Management**: Track treatments, visits, and medical history
- **Settings**: User profile management and system preferences
- **Responsive Design**: Clean, medical-themed UI with TailwindCSS

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## Project Structure

```
src/
├── api/
│   ├── apiClient.js      # Base API configuration
│   └── patientApi.js     # Patient-related API calls
├── components/
│   └── layout/
│       ├── Sidebar.jsx   # Navigation sidebar
│       ├── Header.jsx    # Top header
│       └── DashboardLayout.jsx  # Main layout wrapper
├── pages/
│   ├── Dashboard.jsx     # Main dashboard
│   ├── Patients.jsx      # Patient list
│   ├── PatientDetail.jsx # Individual patient view
│   ├── Treatments.jsx    # Treatment management
│   └── Settings.jsx      # User settings
├── routes/
│   └── AppRoutes.jsx     # Route configuration
├── App.jsx               # Main app component
├── main.jsx              # App entry point
└── index.css             # Global styles
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## API Integration

The frontend communicates with a Django REST Framework backend running on `http://localhost:8000/api`.

### Authentication
Uses Knox token authentication. Include the token in requests as `Authorization: Token <token>`.

### Available Endpoints
- `/api/login/` - User authentication
- `/api/user/` - User management
- `/api/clinic/` - Clinic management
- `/api/patient/` - Patient CRUD
- `/api/treatments/` - Treatment management
- `/api/visits/` - Visit tracking

## Environment Setup

Make sure the backend is running on `http://localhost:8000` before starting the frontend.

## Development

- Uses ESLint for code linting
- Hot module replacement with Vite
- TailwindCSS for styling
- Responsive design principles

## Contributing

1. Follow the existing code structure
2. Use TailwindCSS classes for styling
3. Implement proper error handling
4. Add loading states for API calls
5. Test responsiveness across devices
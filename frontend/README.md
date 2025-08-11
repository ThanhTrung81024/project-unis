# Unis Forecast Frontend

React frontend application for the Unis Forecast ML demand forecasting system.

## Tech Stack

- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- TanStack Query (React Query) for data fetching
- Axios for HTTP requests
- React Router for navigation
- Zod for validation
- Sonner for notifications
- Recharts for data visualization

## Getting Started

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Features

### Dashboard
- System overview with key metrics
- Health status monitoring
- Performance charts and trends
- Alert notifications

### Datasets
- Upload Excel/CSV files with drag & drop
- View dataset details and statistics
- Download processed datasets
- Data visualization charts

### Training
- Start ML model training jobs
- Monitor training progress with real-time updates
- View training results and metrics
- Support for XGBoost, Prophet, LightGBM, and LSTM models

### Models
- Manage trained models
- Deploy models for predictions
- Single and batch predictions
- Model performance metrics
- Download trained model files

## API Integration

The frontend integrates with the backend API running on `http://localhost:8000` by default.

Key endpoints:
- `/datasets/` - Dataset management
- `/train/` - Training operations
- `/models/` - Model management
- `/dashboard/` - Dashboard metrics

## Development

The application uses TypeScript in strict mode and follows React best practices:

- Custom hooks for API operations
- Proper error handling and loading states
- Responsive design with Tailwind CSS
- Real-time updates using React Query polling
- Form validation with Zod schemas

## Project Structure

```
src/
├── api/          # API client functions
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Configuration and utilities
├── pages/        # Page components
├── types/        # TypeScript type definitions
└── utils/        # Helper functions
```
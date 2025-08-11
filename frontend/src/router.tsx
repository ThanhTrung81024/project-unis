import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { DatasetsListPage } from './pages/Datasets/DatasetsListPage'
import { DatasetDetailPage } from './pages/Datasets/DatasetDetailPage'
import { UploadDatasetPage } from './pages/Datasets/UploadDatasetPage'
import { JobsListPage } from './pages/Training/JobsListPage'
import { JobDetailPage } from './pages/Training/JobDetailPage'
import { StartTrainingPage } from './pages/Training/StartTrainingPage'
import { ModelsListPage } from './pages/Models/ModelsListPage'
import { ModelDetailPage } from './pages/Models/ModelDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'datasets',
        element: <DatasetsListPage />,
      },
      {
        path: 'datasets/upload',
        element: <UploadDatasetPage />,
      },
      {
        path: 'datasets/:id',
        element: <DatasetDetailPage />,
      },
      {
        path: 'training',
        element: <JobsListPage />,
      },
      {
        path: 'training/start',
        element: <StartTrainingPage />,
      },
      {
        path: 'training/jobs/:jobId',
        element: <JobDetailPage />,
      },
      {
        path: 'models',
        element: <ModelsListPage />,
      },
      {
        path: 'models/:id',
        element: <ModelDetailPage />,
      },
    ],
  },
])
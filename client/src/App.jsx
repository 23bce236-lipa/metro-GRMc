import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OperationsDashboard from './pages/OperationsDashboard'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/citizen"
          element={
            <ProtectedRoute allowedRoles={['Citizen', 'Tech', 'Admin']}>
              <OperationsDashboard initialRole="Citizen" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <OperationsDashboard initialRole="Admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tech"
          element={
            <ProtectedRoute allowedRoles={['Tech', 'Admin']}>
              <OperationsDashboard initialRole="Tech" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

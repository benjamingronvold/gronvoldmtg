import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import Navbar from './components/layout/Navbar.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

import Home from './routes/Home.jsx'
import Login from './routes/Login.jsx'
import AuthCallback from './routes/AuthCallback.jsx'
import Dashboard from './routes/Dashboard.jsx'
import FindTheLine from './routes/FindTheLine.jsx'
import MatchTracker from './routes/MatchTracker.jsx'
import MetaAnalyser from './routes/MetaAnalyser.jsx'
import Admin from './routes/Admin.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-mtg-bg text-mtg-text font-body">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/find-the-line" element={<FindTheLine />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            <Route path="/tracker" element={
              <ProtectedRoute requiredRole="bruker"><MatchTracker /></ProtectedRoute>
            } />

            <Route path="/meta" element={
              <ProtectedRoute requiredRole="teammedlem"><MetaAnalyser /></ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute requiredRole="superadmin"><Admin /></ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

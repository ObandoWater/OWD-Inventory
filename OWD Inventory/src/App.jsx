import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLogs from "./pages/admin/Logs";
import UserInventory from "./pages/user/UserInventory";
import AdminStatistics from "./pages/admin/Statistics";
import AdminEmployees from "./pages/admin/Employees";

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<UserInventory />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* PROTECTED ROUTES */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/logs" 
          element={
            <ProtectedRoute>
              <AdminLogs />
            </ProtectedRoute>
          } 
        />
      </Routes>

      <Routes>
        <Route 
          path="/admin/statistics" 
          element={
            <ProtectedRoute>
              <AdminStatistics />
            </ProtectedRoute>
          } 
        />
      </Routes>

      <Routes>
        <Route 
          path="/admin/employees" 
          element={
            <ProtectedRoute>
              <AdminEmployees />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
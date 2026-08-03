import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  // If there is no logged-in user, redirect them to the login page.
  // The 'replace' prop prevents them from using the back button to return to the protected page.
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // If they are logged in, render the component they requested (the 'children')
  return children;
}
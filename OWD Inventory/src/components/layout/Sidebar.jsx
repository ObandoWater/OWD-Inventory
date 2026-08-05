import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; // Import Link and useLocation
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation(); // This gets the current URL path
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to the login page after successful logout
      navigate("/admin/login");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="avatar-placeholder"></div>
      <div className="yellow-divider"></div>

      <div className="nav-links">
        {/* Inventory Link */}
        <Link
          to="/admin"
          className={`nav-item ${location.pathname === "/admin" ? "active" : ""}`}
        >
          Inventory
        </Link>

        {/* Logs Link */}
        <Link
          to="/admin/logs"
          className={`nav-item ${location.pathname === "/admin/logs" ? "active" : ""}`}
        >
          Logs
        </Link>

        <Link
          to="/admin/statistics"
          className={`nav-item ${location.pathname === "/admin/statistics" ? "active" : ""}`}
        >
          Statistics
        </Link>

        <Link
          to="/admin/employees"
          className={`nav-item ${location.pathname === "/admin/employees" ? "active" : ""}`}
        >
          Employees
        </Link>
      </div>

      <button
        className="collapse-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        &lt;
      </button>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}

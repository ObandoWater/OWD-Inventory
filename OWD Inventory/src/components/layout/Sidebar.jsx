import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function Sidebar() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to the login page after successful logout
      navigate('/admin/login');
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="avatar-placeholder"></div>
      <div className="yellow-divider"></div>
      
      <div className="nav-links">
        {/* You can change these to <Link> tags from react-router-dom later! */}
        <div className="nav-item"></div>
        <div className="nav-item"></div>
        <div className="nav-item"></div>
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
import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import Sidebar from '../../components/layout/Sidebar'; 
import '../../index.css'; 

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  
  // NEW: State for file upload
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null); 

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "employees"), 
      (snapshot) => {
        const empList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        empList.sort((a, b) => a.name.localeCompare(b.name));
        setEmployees(empList);
      },
      (error) => console.error("Error fetching employees: ", error.message)
    );
    return () => unsubscribe();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) return;

    setIsUploading(true);
    let finalImageUrl = "";

    try {
      // 1. If a file was selected, upload it to Cloudinary first
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        
        // REPLACE THESE WITH YOUR CLOUDINARY DETAILS
        formData.append("upload_preset", "OWD-Employee"); 
        const cloudName = "srrvdlsp"; 

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        
        if (uploadData.secure_url) {
          finalImageUrl = uploadData.secure_url;
        } else {
          console.error("Cloudinary upload failed:", uploadData);
          alert("Image upload failed. Saving employee without photo.");
        }
      }

      // 2. Save the employee data (and the new Cloudinary URL) to Firebase
      await addDoc(collection(db, "employees"), {
        name: newName.trim(),
        employeeId: newId.trim(),
        imageUrl: finalImageUrl 
      });

      // 3. Clear the form
      setNewName("");
      setNewId("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Resets the file input UI

    } catch (error) {
      console.error("Error adding employee: ", error);
      alert("Failed to add employee.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to revoke access for ${name}?`);
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "employees", id));
      } catch (error) {
        console.error("Error deleting employee: ", error);
        alert("Failed to remove employee.");
      }
    }
  };

  const totalPages = Math.ceil(employees.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [employees.length, currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = employees.slice(startIndex, endIndex);

  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="main-content">
        <header className="admin-header" style={{ marginBottom: '30px' }}>
          <h1>Manage Employees</h1>
        </header>

        <section className="graph-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '20px', color: '#1b3671', fontSize: '20px' }}>Add Authorized Employee</h2>
          
          <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Employee ID</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. EMP-001"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Upload Photo (Optional)</label>
              
              {/* UPDATED: Changed from a text input to a file input */}
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}
              />
            </div>
            
            {/* UPDATED: Disable button and show loading text while uploading */}
            <button 
              type="submit" 
              className="save-btn" 
              disabled={isUploading}
              style={{ 
                height: '40px', 
                padding: '0 20px', 
                opacity: isUploading ? 0.7 : 1,
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              {isUploading ? "Uploading..." : "+ Add to List"}
            </button>
          </form>
        </section>

        <section className="logs-card">
          <div className="logs-body">
            <table className="inventory-table logs-table">
              <thead>
                <tr>
                  <th style={{ width: '90px', textAlign: 'center' }}>PHOTO</th>
                  <th>EMPLOYEE NAME</th>
                  <th>ID NUMBER</th>
                  <th style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      {emp.imageUrl ? (
                        <img 
                          src={emp.imageUrl} 
                          alt={emp.name} 
                          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                        />
                      ) : (
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1b3671', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', margin: '0 auto' }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#333' }}>{emp.name}</td>
                    <td style={{ color: '#555' }}>{emp.employeeId}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(emp.id, emp.name)}
                        style={{ backgroundColor: '#fce8e6', color: '#c83f3f', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        Remove Access
                      </button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      No authorized employees found. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINATION CONTROLS */}
            {employees.length > 0 && (
              <div className="pagination-controls" style={{ marginTop: '20px' }}>
                <span className="page-info">
                  Showing {startIndex + 1} to {Math.min(endIndex, employees.length)} of {employees.length} entries
                </span>
                
                <div className="page-btn-group">
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <span style={{ padding: '6px 12px', fontWeight: 'bold' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button 
                    className="page-btn" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </section>
      </main>
    </div>
  );
}
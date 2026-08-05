import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import Sidebar from '../../components/layout/Sidebar'; 
import '../../index.css'; 

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Adjust this number to show more or fewer rows per page

  // Fetch authorized employees from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "employees"), 
      (snapshot) => {
        const empList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort alphabetically by name
        empList.sort((a, b) => a.name.localeCompare(b.name));
        setEmployees(empList);
      },
      (error) => console.error("Error fetching employees: ", error.message)
    );
    
    return () => unsubscribe();
  }, []);

  // Add a new employee to Firebase
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) return;

    try {
      await addDoc(collection(db, "employees"), {
        name: newName.trim(),
        employeeId: newId.trim()
      });
      setNewName("");
      setNewId("");
    } catch (error) {
      console.error("Error adding employee: ", error);
      alert("Failed to add employee.");
    }
  };

  // Delete an employee from Firebase
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

  // --- PAGINATION MATH & LOGIC ---
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  
  // Safety check: if they delete the last item on page 2, bump them back to page 1
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
            <button type="submit" className="save-btn" style={{ height: '40px', padding: '0 20px' }}>
              + Add to List
            </button>
          </form>
        </section>

        <section className="logs-card">
          <div className="logs-body">
            <table className="inventory-table logs-table">
              <thead>
                <tr>
                  <th>EMPLOYEE NAME</th>
                  <th>ID NUMBER</th>
                  <th style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through currentEmployees instead of the full employees array */}
                {currentEmployees.map((emp) => (
                  <tr key={emp.id}>
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
                    <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
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
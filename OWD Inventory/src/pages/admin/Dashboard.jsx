import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import '../../index.css';

export default function AdminDashboard() {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Listen to the 'items' collection in real-time
    const unsubscribe = onSnapshot(collection(db, "items"), (snapshot) => {
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(itemsList);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="admin-layout">
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="avatar-placeholder"></div>
        <div className="yellow-divider"></div>
        
        <div className="nav-links">
          <div className="nav-item"></div>
          <div className="nav-item"></div>
        </div>

        <button className="collapse-btn">&lt;</button>
        <button className="logout-btn"></button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="admin-header">
          <h1>Inventory</h1>
        </header>

        <section className="table-container">
          <div className="table-controls">
            <input type="text" placeholder="Search" className="search-input" />
            <div className="filter-group">
              <select><option>Category</option></select>
              <select><option>Status</option></select>
            </div>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>ITEM NAME &#9662;</th>
                <th>CATEGORY</th>
                <th>QUANTITY</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {/* Loop through the live Firebase data */}
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.currentStock}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="edit-btn">Edit</button>
                  </td>
                </tr>
              ))}
              
              {/* Show this if database is empty */}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
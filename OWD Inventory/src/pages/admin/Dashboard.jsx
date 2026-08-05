import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AddItemModal from '../../components/ui/AddItemModal';
import EditItemModal from '../../components/ui/EditItemModal';
import Sidebar from '../../components/layout/Sidebar';
import '../../index.css';

export default function AdminDashboard() {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "items"), 
      (snapshot) => {
        const itemsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(itemsList);

        const maxPages = Math.ceil(itemsList.length / itemsPerPage);
        if (currentPage > maxPages && maxPages > 0) {
          setCurrentPage(maxPages);
        }
      },
      (error) => console.error("Error fetching inventory: ", error.message)
    );
    return () => unsubscribe();
  }, [currentPage]);

  // --- FILTERING LOGIC ---
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === "In Stock") {
      matchesStatus = item.currentStock >= 15; // Updated to >= 15
    } else if (selectedStatus === "Low Supply") {
      matchesStatus = item.currentStock > 0 && item.currentStock < 15; // New logic
    } else if (selectedStatus === "Out of Stock") {
      matchesStatus = item.currentStock <= 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ["All", ...new Set(inventory.map(item => item.category))];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredInventory.slice(startIndex, endIndex);

  return (
    <div className="admin-layout">
      
      <Sidebar />

      <main className="main-content">
        <header className="admin-header">
          <h1>Inventory</h1>
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Add New Item</button>
        </header>

        <section className="table-container">
          <div className="table-controls">
            <input 
              type="text" 
              placeholder="Search" 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="filter-group">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              
              {/* UPDATED STATUS DROPDOWN */}
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Supply">Low Supply</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>ITEM NAME &#9662;</th>
                <th>CATEGORY</th>
                <th>UNIT</th>
                <th>QUANTITY</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => {
                
                // Determine status label and CSS class dynamically
                let statusLabel = "In Stock";
                let statusClass = "status-in-stock";
                
                if (item.currentStock <= 0) {
                  statusLabel = "Out of Stock";
                  statusClass = "status-out-of-stock";
                } else if (item.currentStock < 15) {
                  statusLabel = "Low Supply";
                  statusClass = "status-low-supply";
                }

                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.unit}</td>
                    <td>{item.currentStock}</td>
                    <td>
                      <span className={statusClass}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="edit-btn"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredInventory.length > 0 && (
            <div className="pagination-controls">
              <span className="page-info">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredInventory.length)} of {filteredInventory.length} entries
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

        </section>
      </main>

      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <EditItemModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }} 
        item={selectedItem}
      />

    </div>
  );
}
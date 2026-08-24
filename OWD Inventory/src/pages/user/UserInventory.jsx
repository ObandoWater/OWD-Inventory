import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import CheckoutModal from '../../components/ui/CheckoutModal';
import '../../index.css'; 

export default function UserInventory() {
  // 1. Setup state to hold our inventory data
  const [inventory, setInventory] = useState([]);

  // --- SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 2. Fetch data from Firebase when the component mounts
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "items"), 
      (snapshot) => {
        const itemsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(itemsList);
      }
    );
    return () => unsubscribe();
  }, []);
  

  // --- FILTERING LOGIC ---
  // We filter the inventory based on the search input and selected category
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories from the database for the dropdown
  const categories = ["All", ...new Set(inventory.map(item => item.category))];

  // Reset to page 1 whenever the user types a search or changes a category
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);


  // --- FIREBASE SUBMIT LOGIC ---
  const handleConfirmCheckout = async (checkoutData) => {
    try {
      // 1. Reference the specific item in the database
      const itemRef = doc(db, "items", checkoutData.item.id);
      
      // 2. Deduct the requested quantity from the current stock
      await updateDoc(itemRef, {
        currentStock: checkoutData.item.currentStock - Number(checkoutData.quantity)
      });

      // 3. Log this action in a "transactions" collection for the Admin reports
      await addDoc(collection(db, "transactions"), {
        itemId: checkoutData.item.id,
        itemName: checkoutData.item.name,
        employeeName: checkoutData.name,
        employeeId: checkoutData.employeeId,
        unit: checkoutData.item.unit,
        quantityTaken: Number(checkoutData.quantity),
        note: checkoutData.note,
        timestamp: serverTimestamp() // Uses Google's exact server time
      });

      // 4. Close the modal and optionally show a success message
      setIsModalOpen(false);
      setSelectedItem(null);
      alert(`Success! You have checked out ${checkoutData.quantity} ${checkoutData.item.name}(s).`);

    } catch (error) {
      console.error("Error during checkout: ", error);
      alert("An error occurred while processing your request.");
    }
  };


  // --- PAGINATION MATH ---
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredInventory.slice(startIndex, endIndex);


  return (
    <div className="user-layout">
      
      {/* HEADER */}
      <header className="user-header">
        <div className="logo-placeholder"></div>
        <h1>OWD <span>Inventory</span></h1>
      </header>

      {/* CONTROLS */}
      <div className="user-controls">
        <input 
          type="text" 
          placeholder="Search Item" 
          className="search-input" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="filter-group">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {/* Dynamically render category options */}
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="user-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Quantity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* 3. Loop through the inventory data to render rows */}
            {currentItems.map((item) => (
              <tr key={item.id}>
                <td data-label="Particulars">{item.name}</td>
                <td data-label="Category">{item.category}</td>
                <td data-label="Unit">{item.unit}</td>
                <td data-label="Quantity">{item.currentStock}</td>
                <td data-label="" style={{ textAlign: 'center' }}>
                  <button 
                    className="select-btn"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsModalOpen(true);
                    }}
                    // Disable the button if stock is 0
                    disabled={item.currentStock === 0}
                    style={{ opacity: item.currentStock === 0 ? 0.5 : 1 }}
                  >
                    {item.currentStock === 0 ? "OUT OF STOCK" : "SELECT"}
                  </button>
                </td>
              </tr>
            ))}

            {/* Fallback message if the database is empty */}
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                  No items found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION CONTROLS (Only show if there are items) */}
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
      </div>
      
      {/* RENDER THE MODAL AT THE BOTTOM */}
      <CheckoutModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        selectedItem={selectedItem}
        onConfirm={handleConfirmCheckout}
      />

    </div>
  );
}
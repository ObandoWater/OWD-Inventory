import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import '../../index.css';

export default function EditItemModal({ isOpen, onClose, item }) {
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    currentStock: 0,
    unit: ""
  });

  // When the modal opens and receives an item, pre-fill the form data
  useEffect(() => {
    if (item) {
      setEditData({
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // --- FIREBASE UPDATE LOGIC ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const itemRef = doc(db, "items", item.id);
      await updateDoc(itemRef, {
        name: editData.name,
        category: editData.category,
        currentStock: Number(editData.currentStock),
        unit: editData.unit
      });
      onClose();
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update item.");
    }
  };

  // --- FIREBASE DELETE LOGIC ---
  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${item.name}?`);
    if (confirmDelete) {
      try {
        const itemRef = doc(db, "items", item.id);
        await deleteDoc(itemRef);
        onClose();
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete item.");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Item</h2>
        
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Item Name</label>
            <input 
              type="text" 
              required 
              value={editData.name} 
              onChange={(e) => setEditData({...editData, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select 
              value={editData.category} 
              onChange={(e) => setEditData({...editData, category: e.target.value})}
            >
              <option value="Office Supplies">Office Supplies</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Cleaning Supplies">Cleaning Supplies</option>
              <option value="Papers">Papers</option>
            </select>
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input 
              type="text" 
              required 
              value={editData.unit} 
              onChange={(e) => setEditData({...editData, unit: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Current Quantity</label>
            <input 
              type="number" 
              required 
              min="0"
              value={editData.currentStock} 
              onChange={(e) => setEditData({...editData, currentStock: e.target.value})}
            />
          </div>
          
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button type="button" onClick={handleDelete} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Delete Item
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="save-btn">Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
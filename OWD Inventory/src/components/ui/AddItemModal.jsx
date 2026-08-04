import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import '../../index.css';

export default function AddItemModal({ isOpen, onClose }) {
  // Local state just for this form
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Office Supplies",
    currentStock: 0,
    unit: "PCS"
  });

  // If the modal isn't supposed to be open, render nothing
  if (!isOpen) return null;

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "items"), {
        name: newItem.name,
        category: newItem.category,
        currentStock: Number(newItem.currentStock),
        unit: newItem.unit
      });
      
      // Reset form and tell the parent component to close the modal
      setNewItem({ name: "", category: "Office Supplies", currentStock: 0, unit: "PCS" });
      onClose();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Item</h2>
        <form onSubmit={handleAddItem}>
          <div className="form-group">
            <label>Item Name</label>
            <input 
              type="text" 
              required 
              value={newItem.name} 
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select 
              value={newItem.category} 
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
            >
              <option value="Office Supplies">Office Supplies</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Cleaning Supplies">Cleaning Supplies</option>
              <option value="Stationary">Stationary</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input 
              type="text" 
              required 
              placeholder="e.g., PCS, Boxes, Reams"
              value={newItem.unit} 
              onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Initial Quantity</label>
            <input 
              type="number" 
              required 
              min="0"
              value={newItem.currentStock} 
              onChange={(e) => setNewItem({...newItem, currentStock: e.target.value})}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="save-btn">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  );
}
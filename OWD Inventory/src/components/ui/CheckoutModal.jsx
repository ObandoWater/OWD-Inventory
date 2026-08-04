import React, { useState, useEffect } from 'react';
import '../../index.css';

export default function CheckoutModal({ isOpen, onClose, selectedItem, onConfirm }) {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    quantity: "",
    note: ""
  });

  // Reset the form completely every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", employeeId: "", quantity: "", note: "" });
    }
  }, [isOpen]);

  // If modal is closed or no item is selected, render nothing
  if (!isOpen || !selectedItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the form data AND the item data back to the parent component
    onConfirm({ ...formData, item: selectedItem });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '500px', padding: '40px' }}>
        
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-row-2">
            <input 
              type="text" 
              className="checkout-input" 
              placeholder="Enter your name *" 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <input 
              type="text" 
              className="checkout-input" 
              placeholder="Enter employee ID *" 
              required 
              value={formData.employeeId} 
              onChange={e => setFormData({...formData, employeeId: e.target.value})} 
            />
          </div>
          
          {/* Disabled input showing the item name */}
          <input 
            type="text" 
            className="checkout-input" 
            value={`Item: ${selectedItem.name}`} 
            disabled 
          />
          
          <input 
            type="number" 
            className="checkout-input" 
            placeholder="Quantity: *" 
            required 
            min="1" 
            max={selectedItem.currentStock} // Prevents them from taking more than exists!
            value={formData.quantity} 
            onChange={e => setFormData({...formData, quantity: e.target.value})} 
          />
          
          <textarea 
            className="checkout-input" 
            placeholder="Additional Note:" 
            value={formData.note} 
            onChange={e => setFormData({...formData, note: e.target.value})} 
          />
          
          <div className="checkout-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm">Confirm</button>
          </div>
        </form>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Ensure this path is correct based on your folder structure
import '../../index.css';

export default function CheckoutModal({ isOpen, onClose, selectedItem, onConfirm }) {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    quantity: "",
    note: ""
  });
  
  const [error, setError] = useState("");
  
  // NEW: State to hold the dynamic list of employees from Firebase
  const [authorizedEmployees, setAuthorizedEmployees] = useState([]);

  // 1. Fetch the employees list from Firebase when the modal opens
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "employees"));
        const empList = querySnapshot.docs.map(doc => doc.data());
        setAuthorizedEmployees(empList);
      } catch (err) {
        console.error("Error fetching authorized employees:", err);
        setError("Failed to load authorization records. Please try again.");
      }
    };

    if (isOpen) {
      setFormData({ name: "", employeeId: "", quantity: "", note: "" });
      setError(""); 
      fetchEmployees(); // Trigger the fetch
    }
  }, [isOpen]);

  if (!isOpen || !selectedItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); 

    const trimmedName = formData.name.trim();
    const trimmedId = formData.employeeId.trim();
    const qty = Number(formData.quantity);

    if (!trimmedName || !trimmedId) {
      setError("Please provide a valid name and employee ID.");
      return;
    }

    // 2. Check against the dynamic Firebase list instead of the hardcoded one
    const isValidEmployee = authorizedEmployees.some(emp => 
      emp.name.toLowerCase() === trimmedName.toLowerCase() && 
      emp.employeeId === trimmedId // Make sure this matches the field name in your Firestore!
    );

    if (!isValidEmployee) {
      setError("Verification failed: Name and ID do not match our authorized records.");
      return;
    }

    if (!qty || qty < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (qty > selectedItem.currentStock) {
      setError(`You cannot check out more than the available stock (${selectedItem.currentStock}).`);
      return;
    }

    onConfirm({ 
      ...formData, 
      name: trimmedName, 
      employeeId: trimmedId,
      quantity: qty, 
      item: selectedItem 
    });
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
              onChange={e => {
                setFormData({...formData, name: e.target.value});
                setError(""); 
              }} 
            />
            <input 
              type="text" 
              className="checkout-input" 
              placeholder="Enter employee ID *" 
              required 
              value={formData.employeeId} 
              onChange={e => {
                setFormData({...formData, employeeId: e.target.value});
                setError(""); 
              }} 
            />
          </div>
          
          <input 
            type="text" 
            className="checkout-input" 
            value={`Item: ${selectedItem.name}`} 
            disabled 
            style={{ backgroundColor: '#f5f5f5', color: '#666' }}
          />
          
          <input 
            type="number" 
            className="checkout-input" 
            placeholder={`Quantity: * (Max ${selectedItem.currentStock})`} 
            required 
            min="1" 
            max={selectedItem.currentStock} 
            value={formData.quantity} 
            onChange={e => {
              setFormData({...formData, quantity: e.target.value});
              setError(""); 
            }} 
          />
          
          <textarea 
            className="checkout-input" 
            placeholder="Additional Note:" 
            value={formData.note} 
            onChange={e => setFormData({...formData, note: e.target.value})} 
          />
          
          {error && (
            <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: '500' }}>
              ⚠️ {error}
            </div>
          )}
          
          <div className="checkout-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm">Confirm</button>
          </div>
        </form>

      </div>
    </div>
  );
}
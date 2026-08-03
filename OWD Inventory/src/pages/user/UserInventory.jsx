import React from 'react';
import '../../index.css'; 

export default function UserInventory() {
  return (
    <div className="user-layout">
      
      {/* HEADER */}
      <header className="user-header">
        <div className="logo-placeholder"></div>
        <h1>OWD <span>Inventory</span></h1>
      </header>

      {/* CONTROLS */}
      <div className="user-controls">
        <input type="text" placeholder="Search Item" className="search-input" />
        <div className="filter-group">
          <select><option>Category</option></select>
        </div>
      </div>

      {/* TABLE */}
      <div className="user-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th>Unit</th>
              <th>Quantity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sharpener</td>
              <td>PCS</td>
              <td>15</td>
              <td style={{ textAlign: 'center' }}>
                <button className="select-btn">SELECT</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
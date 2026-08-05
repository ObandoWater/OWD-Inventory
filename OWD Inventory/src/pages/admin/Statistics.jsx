import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import Sidebar from '../../components/layout/Sidebar'; 
import '../../index.css'; 

export default function AdminStatistics() {
  const [transactions, setTransactions] = useState([]);
  
  // --- FILTER STATES ---
  const currentYear = new Date().getFullYear(); // 2026
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState("All"); // Options: "All", "Q1", "Q2", "Q3", "Q4"

  // Generate an array of the last 5 years for the dropdown (e.g., [2026, 2025, 2024, 2023, 2022])
  const lastFiveYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "transactions"), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTransactions(data);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- FILTER LOGIC: YEAR & QUARTER ---
  const filteredTransactions = transactions.filter(tx => {
    if (!tx.timestamp) return false;
    
    const txDate = tx.timestamp.toDate();
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth(); // 0-11

    // 1. Filter by Year
    if (txYear !== Number(selectedYear)) return false;

    // 2. Filter by Quarter
    if (activeTab === "Q1" && (txMonth < 0 || txMonth > 2)) return false; // Jan - Mar
    if (activeTab === "Q2" && (txMonth < 3 || txMonth > 5)) return false; // Apr - Jun
    if (activeTab === "Q3" && (txMonth < 6 || txMonth > 8)) return false; // Jul - Sep
    if (activeTab === "Q4" && (txMonth < 9 || txMonth > 11)) return false; // Oct - Dec

    return true;
  });

  // --- DATA PROCESSING: TOP 25 ITEMS ---
  const itemUsage = {};
  filteredTransactions.forEach(tx => {
    if (tx.itemName && tx.quantityTaken) {
      if (!itemUsage[tx.itemName]) {
        itemUsage[tx.itemName] = 0;
      }
      itemUsage[tx.itemName] += tx.quantityTaken;
    }
  });

  // Sort items by highest usage and grab the top 25
  const topItems = Object.entries(itemUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);
    
  // Find the max value to scale our CSS bars properly
  const maxItemUsage = topItems.length > 0 ? topItems[0][1] : 1;

  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="main-content">
        
        {/* Header with Year Dropdown Filter */}
        <header className="admin-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Statistics</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#ddd' }}>Select Year:</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px', fontWeight: 'bold', color: '#1b3671', backgroundColor: 'white' }}
            >
              {lastFiveYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </header>

        <section className="graph-card" style={{ padding: '30px' }}>
          
          {/* QUARTER TABS */}
          <div className="tabs-container">
            {["All", "Q1", "Q2", "Q3", "Q4"].map(tab => (
              <button 
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "All" ? "Full Year" : tab}
              </button>
            ))}
          </div>

          <h2 style={{ marginBottom: '30px', color: '#333' }}>
            Top 25 Most Requested Items
          </h2>
          
          <div className="chart-container" style={{ border: 'none', padding: 0, backgroundColor: 'transparent' }}>
            {topItems.length > 0 ? (
              topItems.map(([name, count], index) => {
                const widthPercent = (count / maxItemUsage) * 100;
                
                return (
                  <div className="bar-row" key={index} style={{ marginBottom: '20px' }}>
                    <div className="bar-label">{name}</div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${Math.max(widthPercent, 5)}%`, 
                          backgroundColor: '#ffeb3b', 
                          color: '#1b3671', 
                        }}
                      >
                        {count} units
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                No transactions found for {activeTab === "All" ? "the full year" : activeTab} of {selectedYear}.
              </p>
            )}
          </div>
        </section>
        
      </main>
    </div>
  );
}
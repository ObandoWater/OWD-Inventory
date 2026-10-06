import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import Sidebar from '../../components/layout/Sidebar'; 
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import '../../index.css'; 

export default function AdminStatistics() {
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]); // Needed to get live stock and units
  
  // --- FILTER STATES ---
  const currentYear = new Date().getFullYear(); 
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState("All"); 

  const lastFiveYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    // Fetch Transactions
    const unsubscribeTx = onSnapshot(collection(db, "transactions"), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTransactions(data);
      }
    );

    // Fetch Live Inventory
    const unsubscribeInv = onSnapshot(collection(db, "items"), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(data);
      }
    );

    return () => {
      unsubscribeTx();
      unsubscribeInv();
    };
  }, []);

  // --- FILTER LOGIC FOR CHARTS ---
  const filteredTransactions = transactions.filter(tx => {
    if (!tx.timestamp) return false;
    
    const txDate = tx.timestamp.toDate();
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth(); 

    if (txYear !== Number(selectedYear)) return false;
    if (activeTab === "Q1" && (txMonth < 0 || txMonth > 2)) return false; 
    if (activeTab === "Q2" && (txMonth < 3 || txMonth > 5)) return false; 
    if (activeTab === "Q3" && (txMonth < 6 || txMonth > 8)) return false; 
    if (activeTab === "Q4" && (txMonth < 9 || txMonth > 11)) return false; 

    return true;
  });

  const itemUsage = {};
  filteredTransactions.forEach(tx => {
    if (tx.itemName && tx.quantityTaken) {
      if (!itemUsage[tx.itemName]) {
        itemUsage[tx.itemName] = 0;
      }
      itemUsage[tx.itemName] += tx.quantityTaken;
    }
  });

  const topItems = Object.entries(itemUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);
    
  const maxItemUsage = topItems.length > 0 ? topItems[0][1] : 1;

  // --- AUTOMATED EXPORT LOGIC ---
  const generateReportData = () => {
    let startMonth = 0;
    let endMonth = 11;
    if (activeTab === "Q1") { startMonth = 0; endMonth = 2; }
    if (activeTab === "Q2") { startMonth = 3; endMonth = 5; }
    if (activeTab === "Q3") { startMonth = 6; endMonth = 8; }
    if (activeTab === "Q4") { startMonth = 9; endMonth = 11; }

    const startDate = new Date(selectedYear, startMonth, 1);
    const endDate = new Date(selectedYear, endMonth + 1, 0, 23, 59, 59, 999);

    const reportData = inventory.map(item => {
      const itemTx = transactions.filter(tx => tx.itemId === item.id || tx.itemName === item.name);

      let deductionsTarget = 0;
      let deductionsAfter = 0;

      itemTx.forEach(tx => {
        if (!tx.timestamp) return;
        const txDate = tx.timestamp.toDate();

        if (txDate >= startDate && txDate <= endDate) {
          deductionsTarget += tx.quantityTaken || 0;
        } else if (txDate > endDate) {
          deductionsAfter += tx.quantityTaken || 0;
        }
      });

      // Reverse calculate historical balances from live stock
      const endingBalance = (item.currentStock || 0) + deductionsAfter;
      const beginningBalance = endingBalance + deductionsTarget;

      return {
        particulars: item.name,
        unit: item.unit || "piece",
        begBalance: beginningBalance,
        deductions: deductionsTarget,
        endBalance: endingBalance
      };
    });

    // Sort alphabetically to match standard logbook structure
    return reportData.sort((a, b) => a.particulars.localeCompare(b.particulars));
  };

  const handleExportExcel = () => {
    const data = generateReportData();
    const formattedData = data.map(item => ({
      "Particulars": item.particulars,
      "Unit": item.unit,
      "Beginning Balance": item.begBalance,
      "Deductions": item.deductions,
      "Ending Balance": item.endBalance
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
    
    XLSX.writeFile(workbook, `OWD_Inventory_${selectedYear}_${activeTab}.xlsx`);
  };

const handleExportPDF = () => {
    const doc = new jsPDF();
    const data = generateReportData();

    // Replicate the physical form header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("OBANDO WATER DISTRICT", 14, 15);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`APP-CSE ${selectedYear} - OTHER ITEMS`, 14, 20);
    
    doc.setFont("helvetica", "italic");
    doc.text(`Report Period: ${activeTab === "All" ? "Full Year" : activeTab}`, 14, 25);
    
    // Account details matching the photo
    doc.setFont("helvetica", "normal");
    doc.text("ACCOUNT", 80, 25);
    doc.text("Office supplies", 120, 25);
    
    // Blue highlight block for the account code
    doc.setFillColor(180, 220, 255); 
    doc.rect(160, 21, 35, 6, 'F');
    doc.text("50203010", 170, 25);

    const tableColumn = ["PARTICULARS", "UNIT", "BEG. BALANCE", "DEDUCTIONS", "END BALANCE"];
    const tableRows = data.map(item => [
      item.particulars,
      item.unit,
      item.begBalance,
      item.deductions,
      item.endBalance
    ]);

    // <-- THIS IS THE FIX: Pass 'doc' as the first argument
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 80 }, 
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      }
    });

    doc.save(`OWD_Inventory_${selectedYear}_${activeTab}.pdf`);
  };

  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="main-content">
        
        <header className="admin-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Statistics & Reports</h1>
          
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
          
          {/* TABS & EXPORT BUTTONS ROW */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="tabs-container" style={{ margin: 0 }}>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleExportExcel}
                style={{ backgroundColor: '#217346', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
               Export Excel
              </button>
              <button 
                onClick={handleExportPDF}
                style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
               Export PDF
              </button>
            </div>
          </div>

          <h2 style={{ marginBottom: '30px', color: '#333' }}>
            Top 25 Most Used Items
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
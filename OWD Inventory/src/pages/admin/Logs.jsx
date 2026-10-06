import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import Sidebar from '../../components/layout/Sidebar'; 
import LogsTable from '../../components/ui/LogsTable'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../index.css'; 

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const logsQuery = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(logsQuery, 
      (snapshot) => {
        const logsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLogs(logsList);
      },
      (error) => console.error("Error fetching logs: ", error.message)
    );
    
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.itemName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStartDate = true;
    let matchesEndDate = true;
    
    const logDate = log.timestamp ? log.timestamp.toDate() : new Date();

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesStartDate = logDate >= start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesEndDate = logDate <= end;
    }

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  // --- EXPORT PDF LOGIC ---
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // 1. Add Report Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Transaction Logs", 14, 20);

    // 2. Add Date Range Subtitle dynamically based on active filters
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let dateText = "All time";
    if (startDate && endDate) {
      dateText = `${startDate} to ${endDate}`;
    } else if (startDate) {
      dateText = `From ${startDate}`;
    } else if (endDate) {
      dateText = `Until ${endDate}`;
    }
    doc.text(`Date Range: ${dateText}`, 14, 28);

    // 3. Setup Table Data exactly as it appears in the UI
    const tableColumn = ["DATE & TIME", "USER", "ACTION", "DETAILS"];
    const tableRows = filteredLogs.map(log => {
      const dateStr = log.timestamp ? log.timestamp.toDate().toLocaleString() : "N/A";
      const userStr = `${log.employeeName}\nID: ${log.employeeId}`;
      const actionStr = `Checked out ${log.quantityTaken} ${log.unit ? log.unit : "Unit"}(s) of ${log.itemName}`;
      const detailsStr = log.note || "-";
      
      return [dateStr, userStr, actionStr, detailsStr];
    });

    // 4. Generate Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, valign: 'middle' },
      headStyles: { fillColor: [27, 54, 113], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 45 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 40 }
      }
    });

    // 5. Save the file with a smart filename
    const filename = `OWD_Logs_${startDate || 'start'}_to_${endDate || 'end'}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="admin-layout">
      
      <Sidebar />

      <main className="main-content">
        <div className="logs-card">
          
          <header className="logs-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Logs</h2>
            
            {/* EXPORT BUTTON */}
            <button 
              onClick={handleExportPDF}
              style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
             Export Filtered PDF
            </button>
          </header>

          <div className="logs-body">
            <p className="logs-desc">
              View and filter transaction logs for all items in the inventory.
            </p>

            <div className="logs-controls">
              <input 
                type="text" 
                placeholder="Search" 
                className="search-input logs-search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="date-filters">
                <div className="date-filter-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    className="date-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-filter-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    className="date-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <LogsTable logs={filteredLogs} />
            
          </div>
        </div>
      </main>
    </div>
  );
}
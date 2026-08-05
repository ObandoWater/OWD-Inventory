import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import Sidebar from '../../components/layout/Sidebar'; 
import LogsTable from '../../components/ui/LogsTable'; 
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

  return (
    <div className="admin-layout">
      
      <Sidebar />

      <main className="main-content">
        <div className="logs-card">
          
          <header className="logs-header">
            <h2>Logs</h2>
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
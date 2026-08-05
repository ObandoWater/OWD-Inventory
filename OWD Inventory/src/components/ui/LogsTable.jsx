import React from 'react';

export default function LogsTable({ logs }) {
  return (
    <table className="inventory-table logs-table">
      <thead>
        <tr>
          <th>DATE & TIME</th>
          <th>USER</th>
          <th>ACTION</th>
          <th>DETAILS</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td className="log-date">
              {log.timestamp ? log.timestamp.toDate().toLocaleString() : "Processing..."}
            </td>
            <td>
              <div className="log-user-name">{log.employeeName}</div>
              <div className="log-user-id">ID: {log.employeeId}</div>
            </td>
            <td>
              <span className="log-action">
                Checked out {log.quantityTaken} {log.unit} of {log.itemName}(s)
              </span>
            </td>
            <td className="log-details">
              {log.note || "-"}
            </td>
          </tr>
        ))}
        {logs.length === 0 && (
          <tr>
            <td colSpan="4" className="log-empty">
              No transaction logs match your criteria.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
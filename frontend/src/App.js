import React, { useState, useEffect } from 'react';

const API = 'http://localhost:6969';

function App() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(${API}/tables)
      .then(res => res.json())
      .then(setTables)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedTable) return;
    setLoading(true);
    fetch(${API}/table/)
      .then(res => res.json())
      .then(data => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedTable]);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>SQLite Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '200px' }}>
          <h3>Tabellen</h3>
          <ul>
            {tables.map(t => (
              <li key={t}>
                <button onClick={() => setSelectedTable(t)}>{t}</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Daten: {selectedTable}</h3>
          {loading ? (
            <p>Lädt...</p>
          ) : (
            <table
              border="1"
              cellPadding="5"
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr>
                  {rows[0] &&
                    Object.keys(rows[0]).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, idx) => (
                      <td key={idx}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

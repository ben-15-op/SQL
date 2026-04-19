import { useState, useEffect } from 'react';
import axios from 'axios';

const COLORS = {
  indigo: '#534AB7',
  teal: '#14b8a6',
  amber: '#f59e0b',
  coral: '#f87171',
  bg: '#0b0d11',
  card: '#12141a',
  border: '#1e293b',
  textPrimary: '#e2e8f0',
  textSecondary: '#64748b',
};

export function CatalogView() {
  const [catalog, setCatalog] = useState<{ tables: any[] }>({ tables: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get('/catalog')
      .then(res => { setCatalog(res.data); setLoading(false); })
      .catch(() => { setError('Cannot reach the MiniSQL API.'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textSecondary, fontSize: '14px' }}>
        Loading catalog...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ background: 'rgba(248, 113, 113, 0.06)', border: `0.5px solid rgba(248, 113, 113, 0.2)`, borderRadius: '8px', padding: '24px' }}>
          <div style={{ color: COLORS.coral, fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '16px', marginBottom: '10px' }}>⚠ API Unreachable</div>
          <div style={{ color: COLORS.textSecondary, fontSize: '13px', marginBottom: '14px' }}>Make sure the FastAPI backend is running:</div>
          <div style={{ background: '#0b0d11', borderRadius: '6px', padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: COLORS.teal }}>
            uvicorn api:app --host 127.0.0.1 --port 8000 --reload
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', color: COLORS.textPrimary, marginBottom: '20px' }}>
        System Catalog — {catalog.tables.length} Table{catalog.tables.length !== 1 ? 's' : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
        {catalog.tables.map((table: any) => (
          <div key={table.name} style={{
            background: COLORS.card, border: `0.5px solid ${COLORS.border}`, borderRadius: '8px', padding: '20px',
            borderTop: `3px solid ${COLORS.indigo}`,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: COLORS.textPrimary }}>{table.name}</span>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(83, 74, 183, 0.15)', color: COLORS.indigo, padding: '3px 10px', borderRadius: '999px', fontWeight: 600 }}>
                {table.rows} rows
              </span>
            </div>

            {/* Columns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {table.columns.map((col: any) => (
                <div key={col.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 10px', background: '#0b0d11', borderRadius: '5px',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: COLORS.textPrimary }}>
                    {col.name}
                    {table.primary_key === col.name && <span style={{ marginLeft: '6px', fontSize: '10px' }}>🔑</span>}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                    padding: '2px 8px', borderRadius: '4px',
                    background: col.type === 'INT' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: col.type === 'INT' ? COLORS.teal : COLORS.amber,
                  }}>
                    {col.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

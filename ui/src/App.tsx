import { useState, useEffect } from 'react';
import axios from 'axios';
import { QueryGraph } from './components/QueryGraph';
import { StorageMonitor } from './components/StorageMonitor';
import { CatalogView } from './components/CatalogView';
import { ArchitectureView } from './components/ArchitectureView';

const C = {
  indigo: '#534AB7',
  teal: '#14b8a6',
  amber: '#f59e0b',
  coral: '#f87171',
  green: '#22c55e',
  bg: '#0b0d11',
  sidebar: '#0f1115',
  card: '#12141a',
  editor: '#090b0e',
  border: '#1e293b',
  text1: '#e2e8f0',
  text2: '#94a3b8',
  text3: '#64748b',
  text4: '#334155',
};

const QUICK_QUERIES = [
  { label: 'Create Schema', sql: "CREATE TABLE Orders (id INT, customer_id INT);\nCREATE TABLE Customers (id INT, name TEXT);" },
  { label: 'Insert Data', sql: "INSERT INTO Customers VALUES (1, 'Alice');\nINSERT INTO Customers VALUES (2, 'Bob');\nINSERT INTO Orders VALUES (101, 1);\nINSERT INTO Orders VALUES (102, 1);\nINSERT INTO Orders VALUES (103, 2);" },
  { label: 'Basic Select', sql: "SELECT * FROM Orders;" },
  { label: 'Where Filter', sql: "SELECT * FROM Orders WHERE id > 101;" },
  { label: 'Inner Join', sql: "SELECT o.id, c.name FROM Orders o INNER JOIN Customers c ON o.customer_id = c.id;" },
  { label: 'Group & Having', sql: "SELECT customer_id, COUNT(*) FROM Orders GROUP BY customer_id HAVING COUNT(*) > 1;" },
  { label: 'Order & Limit', sql: "SELECT * FROM Orders ORDER BY customer_id DESC LIMIT 2;" },
  { label: 'Update Row', sql: "UPDATE Orders SET customer_id = 999 WHERE id = 101;" },
  { label: 'Delete Row', sql: "DELETE FROM Orders WHERE id = 102;" },
  { label: 'Truncate Table', sql: "TRUNCATE TABLE Orders;" },
  { label: 'Drop Tables', sql: "DROP TABLE Orders;\nDROP TABLE Customers;" },
  { label: 'Rishi Insert', sql: "INSERT INTO Customers VALUES (99, 'Rishi');" },
  { label: 'Rishi Select', sql: "SELECT * FROM Customers WHERE name = 'Rishi';" },
];

type MainTab = 'query' | 'storage' | 'catalog' | 'architecture';
type ResultTab = 'results' | 'plan' | 'algebra' | 'timings';

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('query');
  const [resultTab, setResultTab] = useState<ResultTab>('results');
  const [query, setQuery] = useState("SELECT * FROM Orders;");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [catalog, setCatalog] = useState<{ tables: any[] }>({ tables: [] });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Record<string, boolean>>({});

  // Check API health
  useEffect(() => {
    axios.get('/catalog')
      .then(() => setApiReady(true))
      .catch(() => setApiReady(false));
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await axios.get('/catalog');
      setCatalog(res.data);
      setApiReady(true);
    } catch { setApiReady(false); }
  };

  useEffect(() => { fetchCatalog(); }, []);

  const handleRun = async () => {
    setLoading(true);
    setResponse(null);
    const statements = query.split(';').map(s => s.trim()).filter(s => s.length > 0);
    let lastResponse: any = null;
    try {
      for (const stmt of statements) {
        lastResponse = (await axios.post('/query', { query: stmt + ';' })).data;
      }
      setResponse(lastResponse);
      setQueryCount(prev => prev + 1);
      fetchCatalog();
    } catch (e: any) {
      setResponse({ status: 'error', message: e.response?.data?.detail || e.message });
    }
    setLoading(false);
  };

  const toggleSidebar = (name: string) => {
    setSidebarCollapsed(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const totalTime = response?.timings
    ? (Object.values(response.timings) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0).toFixed(2)
    : null;

  // ─── TAB BUTTON ───
  const TabBtn = ({ id, label, icon }: { id: MainTab; label: string; icon: string }) => (
    <button
      onClick={() => setMainTab(id)}
      style={{
        background: mainTab === id ? 'rgba(83, 74, 183, 0.12)' : 'transparent',
        border: 'none',
        borderBottom: mainTab === id ? `2px solid ${C.indigo}` : '2px solid transparent',
        color: mainTab === id ? C.text1 : C.text3,
        padding: '12px 18px',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span> {label}
    </button>
  );

  // ─── RESULT SUB-TAB ───
  const SubTab = ({ id, label }: { id: ResultTab; label: string }) => (
    <button
      onClick={() => setResultTab(id)}
      style={{
        background: resultTab === id ? C.card : 'transparent',
        border: `0.5px solid ${resultTab === id ? C.border : 'transparent'}`,
        color: resultTab === id ? C.text1 : C.text3,
        padding: '7px 14px',
        borderRadius: '5px',
        fontSize: '11px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif", overflow: 'hidden', color: C.text2 }}>

      {/* ════════ LEFT SIDEBAR ════════ */}
      <div style={{ width: '220px', minWidth: '220px', background: C.sidebar, borderRight: `0.5px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px', color: C.text1 }}>MiniSQL</span>
          <span style={{ fontSize: '10px', color: C.indigo, background: 'rgba(83,74,183,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>IDE</span>
        </div>

        {/* Schema Tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: C.text3, fontWeight: 600, letterSpacing: '1px', marginBottom: '10px' }}>
            Schema Explorer
          </div>

          {catalog.tables.map((table: any) => (
            <div key={table.name} style={{ marginBottom: '4px' }}>
              <button
                onClick={() => toggleSidebar(table.name)}
                style={{
                  width: '100%', background: 'transparent', border: 'none', color: C.text2,
                  padding: '7px 8px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <span style={{ fontSize: '10px', color: C.text3, transition: 'transform 0.2s', transform: sidebarCollapsed[table.name] ? 'rotate(0deg)' : 'rotate(90deg)' }}>▶</span>
                <span>📋</span>
                <span style={{ fontWeight: 500, color: C.text1, flex: 1 }}>{table.name}</span>
                <span style={{ fontSize: '10px', color: C.text3 }}>{table.rows}</span>
              </button>
              {!sidebarCollapsed[table.name] && (
                <div style={{ paddingLeft: '28px', animation: 'slideIn 0.2s ease' }}>
                  {table.columns.map((col: any) => (
                    <div key={col.name} style={{ fontSize: '11px', color: C.text3, padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{col.name}</span>
                      <span style={{ color: col.type === 'INT' ? C.teal : C.amber, fontSize: '10px' }}>{col.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Quick Queries */}
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: C.text3, fontWeight: 600, letterSpacing: '1px', marginTop: '20px', marginBottom: '10px' }}>
            Quick Queries
          </div>
          {QUICK_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => { setQuery(q.sql); setMainTab('query'); }}
              style={{
                width: '100%', background: 'transparent', border: `0.5px solid ${C.border}`,
                color: C.text2, padding: '7px 10px', borderRadius: '5px', fontSize: '11px',
                cursor: 'pointer', textAlign: 'left', marginBottom: '4px',
                fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
              }}
              onMouseOver={e => { (e.currentTarget).style.borderColor = C.indigo; (e.currentTarget).style.color = C.text1; }}
              onMouseOut={e => { (e.currentTarget).style.borderColor = C.border; (e.currentTarget).style.color = C.text2; }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════ MAIN AREA ════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* ── TOP BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: `0.5px solid ${C.border}`, background: C.sidebar }}>
          <TabBtn id="query" label="Query Editor" icon="⌨" />
          <TabBtn id="storage" label="Storage Monitor" icon="💾" />
          <TabBtn id="catalog" label="Catalog" icon="📋" />
          <TabBtn id="architecture" label="Architecture" icon="🏗" />

          <div style={{ marginLeft: 'auto', paddingRight: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: apiReady ? C.green : C.coral,
              animation: apiReady ? 'pulse 2s infinite' : undefined,
            }} />
            <span style={{ fontSize: '11px', color: apiReady ? C.green : C.coral, fontWeight: 500 }}>
              {apiReady ? 'API Ready' : 'API Offline'}
            </span>

            {/* Badges */}
            {response?.timings && totalTime && (
              <span style={{ fontSize: '10px', background: 'rgba(83,74,183,0.15)', color: C.indigo, padding: '3px 10px', borderRadius: '999px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", marginLeft: '8px' }}>
                {totalTime}ms
              </span>
            )}
            {response?.rows && (
              <span style={{ fontSize: '10px', background: 'rgba(20,184,166,0.15)', color: C.teal, padding: '3px 10px', borderRadius: '999px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                {response.rows.length} rows
              </span>
            )}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflow: 'hidden' }}>

          {/* ════════ QUERY EDITOR TAB ════════ */}
          {mainTab === 'query' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* Editor */}
              <div style={{ height: '38%', position: 'relative', background: C.editor, borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
                  <button
                    onClick={handleRun}
                    disabled={loading}
                    style={{
                      background: C.indigo, color: '#fff', border: 'none',
                      padding: '9px 22px', borderRadius: '6px', cursor: loading ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '7px',
                      fontWeight: 600, fontSize: '12px', fontFamily: "'Inter', sans-serif",
                      opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
                    }}
                  >
                    {loading ? '⏳' : '▶'} {loading ? 'Running...' : 'Run Query'}
                  </button>
                </div>
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="-- Write SQL here..."
                  spellCheck={false}
                  style={{
                    width: '100%', height: '100%', padding: '20px', paddingRight: '150px',
                    background: 'transparent', color: C.text1,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', lineHeight: '1.8',
                    border: 'none', outline: 'none', resize: 'none',
                  }}
                />
              </div>

              {/* Results */}
              <div style={{ height: '62%', display: 'flex', flexDirection: 'column', background: C.sidebar, overflow: 'hidden' }}>

                {/* Sub-tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg }}>
                  <SubTab id="results" label="📊 Results" />
                  <SubTab id="plan" label="🌳 Plan Tree" />
                  <SubTab id="algebra" label="∑ Rel. Algebra" />
                  <SubTab id="timings" label="⏱ Timings" />

                  {response?.timings && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: C.text3 }}>
                      <span>parse: <b style={{ color: C.teal }}>{response.timings.parse_ms}ms</b></span>
                      <span>exec: <b style={{ color: C.indigo }}>{response.timings.exec_ms}ms</b></span>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                  {!response ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text4, fontSize: '13px' }}>
                      Execute a query to see results
                    </div>
                  ) : response.status === 'error' ? (
                    <div style={{ padding: '20px', color: C.coral, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                      ❌ {response.message}
                    </div>
                  ) : (
                    <>
                      {/* ── RESULTS TAB ── */}
                      {resultTab === 'results' && (
                        <div style={{ animation: 'fadeIn 0.2s ease' }}>
                          {response.message && !response.rows && (
                            <div style={{ padding: '20px', color: C.green, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>✓ {response.message}</div>
                          )}
                          {response.rows && response.rows.length > 0 && (
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {response.columns.map((col: string) => (
                                    <th key={col} style={{ padding: '10px 16px', borderBottom: `0.5px solid ${C.border}`, color: C.text3, fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'sticky', top: 0, background: C.card }}>{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {response.rows.map((row: any, i: number) => (
                                  <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}` }}
                                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(83,74,183,0.04)')}
                                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    {response.columns.map((col: string) => {
                                      const val = row[col];
                                      const isNum = typeof val === 'number' || (!isNaN(Number(val)) && String(val).trim() !== '');
                                      return (
                                        <td key={col} style={{
                                          padding: '9px 16px',
                                          fontFamily: "'JetBrains Mono', monospace",
                                          color: isNum ? C.teal : C.amber,
                                          fontSize: '12px',
                                        }}>
                                          {String(val)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {response.rows && response.rows.length === 0 && (
                            <div style={{ padding: '20px', color: C.text3, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>Empty set (0 rows)</div>
                          )}
                        </div>
                      )}

                      {/* ── PLAN TREE TAB ── */}
                      {resultTab === 'plan' && (
                        <div style={{ height: '100%', width: '100%' }}>
                          <QueryGraph plan={response.plan_tree} />
                        </div>
                      )}

                      {/* ── RELATIONAL ALGEBRA TAB ── */}
                      {resultTab === 'algebra' && (
                        <div style={{ padding: '20px', animation: 'fadeIn 0.2s ease' }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: C.text3, fontWeight: 600, letterSpacing: '1px', marginBottom: '12px' }}>Relational Algebra Expression</div>
                          <div style={{
                            background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '8px',
                            padding: '20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '15px',
                            color: C.indigo, lineHeight: '2', letterSpacing: '0.5px',
                          }}>
                            {response.ra_string || 'No relational algebra expression available for this query type.'}
                          </div>
                        </div>
                      )}

                      {/* ── TIMINGS TAB ── */}
                      {resultTab === 'timings' && response.timings && (
                        <div style={{ padding: '20px', animation: 'fadeIn 0.2s ease' }}>
                          {/* Metric Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
                            {[
                              { label: 'Parse', key: 'parse_ms', color: C.teal },
                              { label: 'Semantic', key: 'semantic_ms', color: C.amber },
                              { label: 'Logical', key: 'logical_ms', color: C.indigo },
                              { label: 'Optimize', key: 'optimize_ms', color: C.coral },
                              { label: 'Execute', key: 'exec_ms', color: C.green },
                            ].map(m => (
                              <div key={m.key} style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{m.label}</div>
                                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'Syne', sans-serif", color: m.color }}>
                                  {response.timings[m.key]}
                                </div>
                                <div style={{ fontSize: '10px', color: C.text3 }}>ms</div>
                              </div>
                            ))}
                          </div>

                          {/* Bar Chart */}
                          <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '20px' }}>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '13px', color: C.text1, marginBottom: '16px' }}>Execution Breakdown</div>
                            {[
                              { label: 'Parse', key: 'parse_ms', color: C.teal },
                              { label: 'Semantic', key: 'semantic_ms', color: C.amber },
                              { label: 'Logical', key: 'logical_ms', color: C.indigo },
                              { label: 'Optimize', key: 'optimize_ms', color: C.coral },
                              { label: 'Execute', key: 'exec_ms', color: C.green },
                            ].map(m => {
                              const val = response.timings[m.key] || 0;
                              const max = Math.max(...Object.values(response.timings).map(Number).filter(n => !isNaN(n)), 1);
                              const pct = Math.max(2, (val / max) * 100);
                              return (
                                <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                  <div style={{ width: '70px', fontSize: '11px', color: C.text3, fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>{m.label}</div>
                                  <div style={{ flex: 1, background: C.bg, borderRadius: '4px', height: '14px', overflow: 'hidden' }}>
                                    <div style={{
                                      width: `${pct}%`, height: '100%', background: m.color,
                                      borderRadius: '4px', transition: 'width 0.5s ease',
                                    }} />
                                  </div>
                                  <div style={{ width: '50px', fontSize: '11px', color: C.text2, fontFamily: "'JetBrains Mono', monospace" }}>{val}ms</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STORAGE MONITOR TAB ════════ */}
          {mainTab === 'storage' && <StorageMonitor queryCount={queryCount} />}

          {/* ════════ CATALOG TAB ════════ */}
          {mainTab === 'catalog' && <CatalogView />}

          {/* ════════ ARCHITECTURE TAB ════════ */}
          {mainTab === 'architecture' && <ArchitectureView />}
        </div>
      </div>
    </div>
  );
}

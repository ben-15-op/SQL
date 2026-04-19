import { useState } from 'react';
import axios from 'axios';

const C = {
  indigo: '#534AB7', teal: '#14b8a6', amber: '#f59e0b',
  coral: '#f87171', green: '#22c55e', bg: '#0b0d11',
  card: '#12141a', border: '#1e293b', textPrimary: '#e2e8f0', textSecondary: '#94a3b8'
};

const tokenColors: Record<string, string> = {
  IDENT: C.teal, NUMBER: C.green, STRING: C.green,
  SELECT: C.indigo, FROM: C.indigo, WHERE: C.indigo, INSERT: C.indigo, UPDATE: C.indigo, DELETE: C.indigo, CREATE: C.indigo, TABLE: C.indigo,
  EQ: C.amber, NEQ: C.amber, GT: C.amber, LT: C.amber, GTE: C.amber, LTE: C.amber, AND: C.amber, OR: C.amber
};

interface ASTNodeProps { node: any, name: string }
const ASTNodeView = ({ node, name }: ASTNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  
  if (node === null || node === undefined) return <span style={{ color: C.textSecondary }}>null</span>;
  if (typeof node === 'string') return <span style={{ color: C.amber }}>"{node}"</span>;
  if (typeof node === 'number' || typeof node === 'boolean') return <span style={{ color: C.teal }}>{node}</span>;
  
  if (Array.isArray(node)) {
    if (node.length === 0) return <span style={{ color: C.textSecondary }}>[]</span>;
    return (
      <div style={{ marginLeft: 20 }}>
        {node.map((n, i) => (
          <div key={i} style={{ display: 'flex' }}>
            <span style={{ color: C.textSecondary }}>├── </span>
            <ASTNodeView node={n} name={`[${i}]`} />
          </div>
        ))}
      </div>
    );
  }

  const keys = Object.keys(node).filter(k => k !== 'type');
  return (
    <div style={{ marginLeft: name ? 20 : 0 }}>
      {name && <span style={{ color: C.textSecondary }}>{name}: </span>}
      <span 
        style={{ color: C.indigo, fontWeight: 'bold', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▼' : '▶'} {node.type || 'Object'}
      </span>
      {expanded && keys.map((k, i) => (
        <div key={k} style={{ display: 'flex' }}>
          <span style={{ color: C.textSecondary }}>{i === keys.length - 1 ? '└── ' : '├── '}</span>
          <ASTNodeView node={node[k]} name={k} />
        </div>
      ))}
    </div>
  );
};

export function PipelineDebugger() {
  const [query, setQuery] = useState("SELECT name FROM Customers WHERE id > 1;");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDebug = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/pipeline', { query });
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  const StepCard = ({ num, title, ms, children }: any) => (
    <div style={{ display: 'flex', marginBottom: 20, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16 }}>
        <div style={{ 
          width: 28, height: 28, borderRadius: '50%', backgroundColor: C.indigo, color: '#fff', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14,
          boxShadow: `0 0 10px ${C.indigo}88`, zIndex: 2
        }}>
          {num}
        </div>
        <div style={{ flex: 1, width: 2, backgroundColor: C.indigo, opacity: 0.5, marginTop: 4 }}></div>
      </div>
      <div style={{ flex: 1, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, pb: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: C.textPrimary, fontFamily: "'Syne', sans-serif" }}>{title}</h3>
          <span style={{ fontSize: 12, color: C.teal, backgroundColor: `${C.teal}22`, padding: '2px 8px', borderRadius: 12, fontFamily: "'JetBrains Mono', monospace" }}>{ms}ms</span>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      
      {/* Query Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          style={{ flex: 1, padding: 12, backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.textPrimary, borderRadius: 6, fontFamily: "'JetBrains Mono', monospace" }} 
          placeholder="Enter SQL Query to debug..."
        />
        <button 
          onClick={handleDebug} 
          disabled={loading}
          style={{ padding: '0 20px', backgroundColor: C.indigo, color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Debugging...' : 'Debug Pipeline'}
        </button>
      </div>

      {error && <div style={{ color: C.coral, marginBottom: 20, padding: 12, border: `1px solid ${C.coral}`, borderRadius: 6, background: `${C.coral}22` }}>{error}</div>}

      {data && data.stages && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Stage 1: Lexer */}
          {data.stages.tokens && (
            <StepCard num="1" title="LEXER — Tokenization" ms={data.timings.lex_ms}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: "'JetBrains Mono', monospace" }}>
                {data.stages.tokens.map((t: any, i: number) => {
                  const color = tokenColors[t.type] || C.textSecondary;
                  return (
                    <div key={i} style={{ padding: '4px 8px', border: `1px solid ${color}`, borderRadius: 6, backgroundColor: `${color}11`, color }}>
                      {t.type === 'IDENT' || t.type === 'NUMBER' || t.type === 'STRING' ? `${t.type} "${t.value}"` : t.type}
                    </div>
                  )
                })}
              </div>
            </StepCard>
          )}

          {/* Stage 2: Parser */}
          {data.stages.ast && (
            <StepCard num="2" title="PARSER — AST Construction" ms={data.timings.parse_ms}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: C.bg, padding: 12, borderRadius: 6, border: `1px solid ${C.border}` }}>
                <ASTNodeView node={data.stages.ast} name="" />
              </div>
            </StepCard>
          )}

          {/* Stage 3: Semantic Analyzer */}
          {data.stages.semantic && (
            <StepCard num="3" title="SEMANTIC ANALYZER — Validation" ms={data.timings.semantic_ms}>
              {data.stages.semantic.status === 'success' ? (
                <div style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>✓</span> <span>All checks passed. AST is semantically valid.</span>
                </div>
              ) : (
                <div style={{ color: C.coral }}>
                  <span style={{ fontSize: 20 }}>✗</span> Semantic Error: {data.stages.semantic.error}
                </div>
              )}
            </StepCard>
          )}

          {/* Stage 4: Logical Plan */}
          {data.stages.logical_plan && data.stages.logical_plan.after_optimization && (
            <StepCard num="4" title="LOGICAL PLANNER — Plan Tree" ms={data.timings.logical_ms + data.timings.optimize_ms}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: C.bg, padding: 12, borderRadius: 6, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ color: C.textSecondary, marginBottom: 8, fontSize: 11, textTransform: 'uppercase' }}>Optimized Logical Plan</div>
                <ASTNodeView node={data.stages.logical_plan.after_optimization} name="" />
              </div>
              <div style={{ color: C.indigo, fontFamily: "'JetBrains Mono', monospace", padding: 12, border: `1px solid ${C.indigo}44`, borderRadius: 6, backgroundColor: `${C.indigo}11` }}>
                <span style={{ color: C.textSecondary, fontSize: 11, textTransform: 'uppercase', marginRight: 10 }}>Relational Algebra:</span>
                {data.stages.logical_plan.ra_string}
              </div>
            </StepCard>
          )}

          {/* Stage 5: Physical Plan */}
          {data.stages.physical_plan && data.stages.physical_plan.mappings && (
            <StepCard num="5" title="PHYSICAL PLANNER — Executor Mapping" ms={data.timings.physical_ms}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                <thead>
                  <tr style={{ color: C.textSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left' }}>
                    <th style={{ padding: '8px 0' }}>Logical Node</th>
                    <th></th>
                    <th>Physical Executor</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stages.physical_plan.mappings.map((m: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 0', color: C.amber }}>{m.logical}</td>
                      <td style={{ color: C.textSecondary }}>→</td>
                      <td style={{ color: C.teal }}>{m.physical}</td>
                      <td style={{ color: C.textSecondary, fontFamily: "'Inter', sans-serif", fontSize: 12 }}>{m.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </StepCard>
          )}

          {/* Stage 6: Execution */}
          {data.stages.execution && (
            <StepCard num="6" title="EXECUTOR — Volcano Model Execution" ms={data.timings.exec_ms}>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: C.textSecondary, fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>Execution Trace</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: C.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.stages.execution.trace.map((tr: string, i: number) => <li key={i}>{tr}</li>)}
                </ul>
              </div>

              {data.stages.execution.rows && data.stages.execution.rows.length > 0 && (
                <div>
                  <div style={{ color: C.textSecondary, fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>Final Result set ({data.stages.execution.rows.length} rows)</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
                    <thead style={{ background: C.bg }}>
                      <tr>
                        {data.stages.execution.columns?.map((c: string) => <th key={c} style={{ padding: '8px 12px', textAlign: 'left', color: C.textPrimary, borderBottom: `1px solid ${C.border}` }}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.stages.execution.rows.map((row: any, i: number) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          {data.stages.execution.columns?.map((c: string) => <td key={c} style={{ padding: '8px 12px', color: typeof row[c] === 'number' ? C.teal : C.amber }}>{String(row[c])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </StepCard>
          )}

        </div>
      )}
    </div>
  );
}

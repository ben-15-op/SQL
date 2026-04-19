const COLORS = {
  indigo: '#534AB7',
  teal: '#14b8a6',
  amber: '#f59e0b',
  coral: '#f87171',
  green: '#22c55e',
  bg: '#0b0d11',
  card: '#12141a',
  border: '#1e293b',
  textPrimary: '#e2e8f0',
  textSecondary: '#64748b',
};

export function ArchitectureView() {
  const aotStages = [
    { label: 'Lexer', color: COLORS.teal, strike: false },
    { label: 'Parser', color: COLORS.teal, strike: false },
    { label: 'Semantic', color: COLORS.teal, strike: false },
    { label: 'Logical Plan', color: COLORS.teal, strike: false },
    { label: 'C Codegen', color: COLORS.coral, strike: true },
    { label: 'gcc compile', color: COLORS.coral, strike: true },
    { label: 'exec binary', color: COLORS.coral, strike: true },
  ];

  const newStages = [
    { label: 'Lexer', color: COLORS.teal, highlight: false },
    { label: 'Parser', color: COLORS.teal, highlight: false },
    { label: 'Semantic', color: COLORS.teal, highlight: false },
    { label: 'Logical Plan', color: COLORS.teal, highlight: false },
    { label: 'Optimizer', color: COLORS.green, highlight: true },
    { label: 'Physical Plan', color: COLORS.green, highlight: true },
    { label: 'Volcano Exec', color: COLORS.green, highlight: true },
  ];

  const cards = [
    {
      title: 'Storage Manager',
      icon: '💾',
      desc: 'Manages persistent data files on disk. Each table is a file segmented into fixed 4KB pages. The DiskManager handles raw I/O operations — reading and writing page blocks to the filesystem.',
      color: COLORS.teal,
    },
    {
      title: 'Buffer Pool Manager',
      icon: '🧊',
      desc: 'An LRU-based caching layer sitting between disk and execution. Fetches pages into a finite set of memory frames, pins active pages, and evicts cold pages to stay within memory limits.',
      color: COLORS.indigo,
    },
    {
      title: 'Volcano Iterator Model',
      icon: '🌋',
      desc: 'A pull-based execution model where every operator exposes init(), next(), close(). The root operator pulls tuples upward through the tree — enabling elegant pipelining without materializing intermediate results.',
      color: COLORS.amber,
    },
    {
      title: 'Logical Optimizer',
      icon: '🧠',
      desc: 'Rewrites the logical plan before execution. Performs predicate pushdown (moving filters below joins) and cost-based join reordering using catalog statistics to minimize tuple flow.',
      color: COLORS.coral,
    },
  ];

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.3s ease' }}>

      {/* Pipeline Comparison */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', color: COLORS.textPrimary, marginBottom: '20px' }}>
          Execution Pipeline Evolution
        </div>

        {/* AOT Pipeline */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: COLORS.coral, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            ✗ Original AOT System
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            {aotStages.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  padding: '8px 14px', borderRadius: '6px', fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                  background: s.strike ? 'rgba(248, 113, 113, 0.08)' : COLORS.card,
                  border: `0.5px solid ${s.strike ? 'rgba(248, 113, 113, 0.3)' : COLORS.border}`,
                  color: s.strike ? COLORS.coral : COLORS.textPrimary,
                  textDecoration: s.strike ? 'line-through' : 'none',
                  opacity: s.strike ? 0.6 : 1,
                }}>
                  {s.label}
                </div>
                {i < aotStages.length - 1 && <span style={{ color: '#334155', fontSize: '16px' }}>→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* New Pipeline */}
        <div>
          <div style={{ fontSize: '11px', color: COLORS.green, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            ✓ Redesigned DBMS System
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            {newStages.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  padding: '8px 14px', borderRadius: '6px', fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                  background: s.highlight ? 'rgba(34, 197, 94, 0.08)' : COLORS.card,
                  border: `0.5px solid ${s.highlight ? 'rgba(34, 197, 94, 0.3)' : COLORS.border}`,
                  color: s.highlight ? COLORS.green : COLORS.textPrimary,
                }}>
                  {s.label}
                </div>
                {i < newStages.length - 1 && <span style={{ color: '#334155', fontSize: '16px' }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: COLORS.card, border: `0.5px solid ${COLORS.border}`, borderRadius: '8px', padding: '20px',
            borderLeft: `3px solid ${card.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>{card.icon}</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: COLORS.textPrimary }}>{card.title}</span>
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textSecondary, lineHeight: '1.7' }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Why AOT Was Wrong */}
      <div style={{ background: 'rgba(248, 113, 113, 0.05)', border: `0.5px solid rgba(248, 113, 113, 0.2)`, borderRadius: '8px', padding: '20px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: COLORS.coral, marginBottom: '12px' }}>
          Why AOT Compilation Was Fundamentally Wrong
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { title: 'Ephemeral Data', desc: 'Data is embedded as C arrays inside the compiled binary. When the program exits, the entire dataset vanishes — zero persistence.' },
            { title: 'Recompile on INSERT', desc: 'Every INSERT requires rewriting the entire .c source file and invoking gcc/clang again — a full system compilation for a single row addition.' },
            { title: 'No Transaction Isolation', desc: 'Without a storage abstraction layer, there is no mechanism for concurrent access, locking, or ACID guarantees.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: COLORS.coral, fontSize: '14px', marginTop: '2px' }}>✗</span>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textPrimary }}>{item.title}: </span>
                <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

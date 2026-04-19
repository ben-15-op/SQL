import { useState, useEffect } from 'react';

const COLORS = {
  indigo: '#534AB7',
  teal: '#14b8a6',
  amber: '#f59e0b',
  coral: '#f87171',
  green: '#22c55e',
  gray: '#1e293b',
  bg: '#0b0d11',
  card: '#12141a',
  border: '#1e293b',
  textPrimary: '#e2e8f0',
  textSecondary: '#64748b',
};

type FrameState = 'empty' | 'clean' | 'pinned' | 'dirty' | 'evicting';

const stateColors: Record<FrameState, string> = {
  empty: COLORS.gray,
  clean: COLORS.green,
  pinned: COLORS.indigo,
  dirty: COLORS.amber,
  evicting: COLORS.coral,
};

const stateLabels: Record<FrameState, string> = {
  empty: 'Empty',
  clean: 'Clean',
  pinned: 'Pinned',
  dirty: 'Dirty',
  evicting: 'Evicting',
};

interface StorageMonitorProps {
  queryCount: number;
}

export function StorageMonitor({ queryCount }: StorageMonitorProps) {
  const [frames, setFrames] = useState<{ state: FrameState; pageId: number | null; table: string }[]>(
    Array.from({ length: 16 }, () => ({ state: 'empty' as FrameState, pageId: null, table: '' }))
  );
  const [metrics, setMetrics] = useState({ reads: 0, writes: 0, hitRate: 0, evictions: 0 });
  const [animatingFrame, setAnimatingFrame] = useState<number | null>(null);

  // When a query runs, simulate warming some frames
  useEffect(() => {
    if (queryCount === 0) return;
    const tables = ['Customers', 'Orders', 'Students'];
    const newFrames = [...frames];
    const states: FrameState[] = ['clean', 'pinned', 'dirty'];

    // Warm 2-4 random frames
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * 16);
      const table = tables[Math.floor(Math.random() * tables.length)];
      newFrames[idx] = {
        state: states[Math.floor(Math.random() * states.length)],
        pageId: Math.floor(Math.random() * 8),
        table,
      };
      setAnimatingFrame(idx);
      setTimeout(() => setAnimatingFrame(null), 600);
    }

    setFrames(newFrames);
    setMetrics(prev => ({
      reads: prev.reads + count,
      writes: prev.writes + Math.floor(Math.random() * 2),
      hitRate: Math.min(99, 40 + queryCount * 8 + Math.floor(Math.random() * 10)),
      evictions: prev.evictions + (queryCount > 3 ? 1 : 0),
    }));
  }, [queryCount]);

  const simulateAccess = () => {
    const newFrames = frames.map(() => {
      const r = Math.random();
      const states: FrameState[] = ['empty', 'clean', 'pinned', 'dirty', 'evicting'];
      const tables = ['Customers', 'Orders', 'Students'];
      return {
        state: states[Math.floor(r * 5)],
        pageId: Math.floor(Math.random() * 8),
        table: tables[Math.floor(Math.random() * tables.length)],
      };
    });
    setFrames(newFrames);
    setMetrics(prev => ({
      reads: prev.reads + 4,
      writes: prev.writes + 2,
      hitRate: Math.min(99, prev.hitRate + 5),
      evictions: prev.evictions + 1,
    }));
  };

  // Simulated slotted page data
  const slottedPage = [
    { slot: 'HDR', offset: '0x00', length: '24B', data: 'page_id=0 | num_slots=4 | free_ptr=2048' },
    { slot: 'SLOT[0]', offset: '0x18', length: '48B', data: '{id: 101, name: "Indu"}' },
    { slot: 'SLOT[1]', offset: '0x48', length: '52B', data: '{id: 102, name: "Dhanya"}' },
    { slot: 'SLOT[2]', offset: '0x7C', length: '52B', data: '{id: 103, name: "Jyothi"}' },
    { slot: 'FREE', offset: '0xB0', length: '3920B', data: '— available —' },
  ];

  // Disk I/O simulation
  const diskIO = [
    { table: 'Customers.tbl', reads: 65 },
    { table: 'Orders.tbl', reads: 85 },
    { table: 'Students.tbl', reads: 30 },
  ];

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%', animation: 'fadeIn 0.3s ease' }}>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Page Reads', value: metrics.reads, color: COLORS.teal },
          { label: 'Page Writes', value: metrics.writes, color: COLORS.amber },
          { label: 'Hit Rate', value: `${metrics.hitRate}%`, color: COLORS.indigo },
          { label: 'Evictions', value: metrics.evictions, color: COLORS.coral },
        ].map((m, i) => (
          <div key={i} style={{ background: COLORS.card, border: `0.5px solid ${COLORS.border}`, borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'Syne', sans-serif", color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Buffer Pool Grid */}
        <div style={{ background: COLORS.card, border: `0.5px solid ${COLORS.border}`, borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: COLORS.textPrimary }}>Buffer Pool (16 Frames)</div>
            <button
              onClick={simulateAccess}
              style={{
                background: 'transparent', border: `0.5px solid ${COLORS.indigo}`, color: COLORS.indigo,
                padding: '6px 14px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontWeight: 500, transition: 'all 0.15s',
              }}
            >
              Simulate Access
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {frames.map((frame, i) => (
              <div
                key={i}
                style={{
                  background: '#0b0d11',
                  border: `0.5px solid ${stateColors[frame.state]}`,
                  borderRadius: '6px',
                  padding: '10px 8px',
                  textAlign: 'center',
                  animation: animatingFrame === i ? 'warmFrame 0.6s ease' : undefined,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '9px', color: stateColors[frame.state], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stateLabels[frame.state]}
                </div>
                {frame.pageId !== null && frame.state !== 'empty' && (
                  <>
                    <div style={{ fontSize: '11px', color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', monospace", marginTop: '4px' }}>P{frame.pageId}</div>
                    <div style={{ fontSize: '9px', color: COLORS.textSecondary, marginTop: '2px' }}>{frame.table}</div>
                  </>
                )}
                {frame.state === 'empty' && (
                  <div style={{ fontSize: '10px', color: '#334155', marginTop: '4px' }}>—</div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            {(Object.keys(stateColors) as FrameState[]).map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: COLORS.textSecondary }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stateColors[s] }} />
                {stateLabels[s]}
              </div>
            ))}
          </div>
        </div>

        {/* Disk I/O */}
        <div style={{ background: COLORS.card, border: `0.5px solid ${COLORS.border}`, borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: COLORS.textPrimary, marginBottom: '16px' }}>Disk I/O Reads</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {diskIO.map((d, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: COLORS.textSecondary, marginBottom: '6px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.table}</span>
                  <span>{d.reads}%</span>
                </div>
                <div style={{ background: '#0b0d11', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${d.reads}%`, height: '100%', background: COLORS.teal, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slotted Page Diagram */}
      <div style={{ marginTop: '20px', background: COLORS.card, border: `0.5px solid ${COLORS.border}`, borderRadius: '8px', padding: '20px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: COLORS.textPrimary, marginBottom: '16px' }}>
          Slotted Page Layout — <span style={{ color: COLORS.teal, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>Customers.tbl Page 0</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['Section', 'Offset', 'Length', 'Data'].map(h => (
                <th key={h} style={{ padding: '10px 14px', borderBottom: `0.5px solid ${COLORS.border}`, textAlign: 'left', color: COLORS.textSecondary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slottedPage.map((row, i) => (
              <tr key={i} style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: row.slot === 'HDR' ? COLORS.indigo : row.slot === 'FREE' ? COLORS.textSecondary : COLORS.teal, fontWeight: 600 }}>{row.slot}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: COLORS.textSecondary }}>{row.offset}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: COLORS.amber }}>{row.length}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: row.slot === 'FREE' ? '#334155' : COLORS.textPrimary }}>{row.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

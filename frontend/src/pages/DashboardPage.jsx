import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { formatBRL } from '../utils/format';
import { TrendingDownIcon, SparkleIcon, ChartIcon, ClockIcon, SearchIcon } from '../components/Icons';

const MOCK_INSIGHTS = [
  { produto: 'DIPIRONA 500MG', economia: 61, min: 4.99, max: 12.90, farmacia: 'Farmácia Popular Centro' },
  { produto: 'OMEPRAZOL 20MG', economia: 60, min: 8.90, max: 22.50, farmacia: 'Farmácia Popular Centro' },
  { produto: 'AMOXICILINA 500MG', economia: 57, min: 12.50, max: 28.90, farmacia: 'Farmácia Popular Centro' },
  { produto: 'LOSARTANA 50MG', economia: 57, min: 15.20, max: 35.00, farmacia: 'Farmácia Popular Centro' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStats().catch(() => null),
      fetch('/health').then(r => r.json()).catch(() => null)
    ]).then(([statsData, healthData]) => {
      setStats(statsData);
      setHealth(healthData);
      setLoading(false);
    });
  }, []);

  const avgEconomy = (MOCK_INSIGHTS.reduce((a, b) => a + b.economia, 0) / MOCK_INSIGHTS.length).toFixed(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Dashboard</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Visão geral de preços em Maceió</div>
      </div>

      <div className="page-content px-20" style={{ paddingTop: 16 }}>
        {/* Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: health?.tokenConfigured ? 'var(--green-light)' : 'var(--amber-light)',
          border: `1px solid ${health?.tokenConfigured ? '#86EFAC' : '#FCD34D'}`,
          borderRadius: 10, padding: '8px 12px', marginBottom: 16, fontSize: 12,
          color: health?.tokenConfigured ? '#166534' : '#92400E',
          fontWeight: 500
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: health?.tokenConfigured ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }} />
          {health?.tokenConfigured
            ? '✅ API SEFAZ conectada – dados em tempo real'
            : '⚠️ Modo simulado – configure o token SEFAZ no .env'}
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <StatCard
            icon={<TrendingDownIcon size={20} color="var(--green)" />}
            label="Economia média"
            value={`${avgEconomy}%`}
            sub="vs. maior preço"
            bg="var(--green-light)"
            color="var(--green)"
          />
          <StatCard
            icon={<SparkleIcon size={20} color="var(--primary)" />}
            label="Produtos analisados"
            value={MOCK_INSIGHTS.length.toString()}
            sub="medicamentos"
            bg="var(--primary-light)"
            color="var(--primary)"
          />
          <StatCard
            icon={<ChartIcon size={20} color="#7C3AED" />}
            label="Buscas realizadas"
            value={stats ? stats.totalBuscas.toString() : '0'}
            sub="nesta sessão"
            bg="#EDE9FE"
            color="#7C3AED"
          />
          <StatCard
            icon={<ClockIcon size={20} color="var(--amber)" />}
            label="Cache ativo"
            value={stats ? `${stats.cache?.keys || 0}` : '0'}
            sub="consultas salvas"
            bg="var(--amber-light)"
            color="var(--amber)"
          />
        </div>

        {/* Top economy opportunities */}
        <div className="section-title">Maiores variações de preço</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {MOCK_INSIGHTS.map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{ cursor: 'pointer', padding: '14px 16px' }}
              onClick={() => navigate(`/results?q=${encodeURIComponent(item.produto.split(' ')[0])}`)}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.produto}
                </div>
                <div style={{
                  background: 'var(--green-light)', color: 'var(--green)',
                  borderRadius: 8, padding: '3px 8px',
                  fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  -{item.economia}%
                </div>
              </div>

              {/* Price bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${(item.min / item.max) * 100}%`,
                    background: 'var(--green)', borderRadius: 99
                  }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, background: 'var(--red)', borderRadius: 99 }} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatBRL(item.min)}</span>
                  <span style={{ margin: '0 4px' }}>→</span>
                  <span style={{ color: 'var(--red)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatBRL(item.max)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.farmacia}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent searches */}
        {stats?.topBuscas?.length > 0 && (
          <>
            <div className="section-title">Produtos mais buscados</div>
            <div className="card" style={{ padding: '4px 0', marginBottom: 16 }}>
              {stats.topBuscas.map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-12"
                  style={{ padding: '10px 16px', borderBottom: idx < stats.topBuscas.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onClick={() => navigate(`/results?q=${encodeURIComponent(b.query)}`)}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: idx === 0 ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: idx === 0 ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{b.query}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.count}×</div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className="btn btn-primary btn-full"
          style={{ borderRadius: 'var(--radius-lg)', minHeight: 50, marginBottom: 8 }}
          onClick={() => navigate('/')}
        >
          <SearchIcon size={18} />
          Nova busca
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, bg, color }) {
  return (
    <div style={{
      background: bg, borderRadius: 16, padding: '16px 14px',
      border: `1px solid ${bg === 'var(--green-light)' ? '#86EFAC' : 'transparent'}`
    }}>
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 4, opacity: 0.85 }}>{label}</div>
      <div style={{ fontSize: 11, color, opacity: 0.6, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

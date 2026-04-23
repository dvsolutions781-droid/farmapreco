import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBasket } from '../hooks/useBasket';
import { api } from '../utils/api';
import { formatBRL, truncateProd } from '../utils/format';
import { TrashIcon, BasketIcon, SearchIcon } from '../components/Icons';

export default function BasketPage() {
  const { items, remove, clear } = useBasket();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (items.length > 0) loadRanking();
    else setRanking(null);
  }, [items]);

  async function loadRanking() {
    setComparing(true);
    try {
      const data = await api.compareBasket();
      setRanking(data);
    } catch {}
    setComparing(false);
  }

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '20px 20px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Cesta de Cotação</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Compare onde comprar mais barato</div>
        </div>
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-icon">
            <BasketIcon size={28} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Cesta vazia</div>
          <div style={{ fontSize: 14 }}>Busque produtos e adicione à cesta para comparar preços entre farmácias</div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/')}>
            <SearchIcon size={18} />
            Buscar produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="flex items-center justify-between" style={{ gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Cesta de Cotação</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{items.length} produto{items.length !== 1 ? 's' : ''}</div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            style={{ flexShrink: 0 }}
            onClick={() => { if (window.confirm('Limpar toda a cesta?')) clear(); }}
          >
            <TrashIcon size={14} />
            Limpar
          </button>
        </div>
      </div>

      <div className="page-content px-20" style={{ paddingTop: 14 }}>
        {/* Items */}
        <div className="section-title">Produtos</div>
        <div className="card" style={{ marginBottom: 16, padding: '4px 0' }}>
          {items.map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {truncateProd(item.descricao, 44)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {formatBRL(item.precoMinimo)} – {formatBRL(item.precoMaximo)}
                </div>
              </div>
              <button
                onClick={() => remove(item.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 8 }}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Ranking */}
        {comparing && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
            <div className="pulse">Calculando melhor preço...</div>
          </div>
        )}

        {ranking && !comparing && ranking.ranking?.length > 0 && (
          <>
            <div className="section-title">Ranking por farmácia</div>
            {ranking.ranking.map((est, idx) => (
              <RankCard key={est.cnpj || idx} est={est} isFirst={idx === 0} isLast={idx === ranking.ranking.length - 1} total={ranking.ranking.length} />
            ))}

            {ranking.ranking.length < items.length && (
              <div style={{
                background: 'var(--amber-light)', border: '1px solid #FCD34D',
                borderRadius: 12, padding: '10px 14px', marginTop: 8, fontSize: 12, color: '#92400E'
              }}>
                ⚠️ Nenhuma farmácia tem todos os {items.length} produtos. Ranking parcial exibido.
              </div>
            )}
          </>
        )}

        {ranking && !comparing && ranking.ranking?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Não foi possível calcular o ranking. Tente buscar os produtos novamente.
          </div>
        )}

        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: 8, borderRadius: 'var(--radius-lg)', minHeight: 50 }}
          onClick={() => navigate('/')}
        >
          <SearchIcon size={18} />
          Adicionar mais produtos
        </button>
      </div>
    </div>
  );
}

function RankCard({ est, isFirst, isLast, total }) {
  const rankLabel = isFirst ? 'Mais barato' : isLast && total > 1 ? 'Mais caro' : 'Intermediário';
  const rankClass = isFirst ? 'rank-cheapest' : isLast && total > 1 ? 'rank-expensive' : 'rank-mid';
  const borderColor = isFirst ? 'var(--green)' : isLast && total > 1 ? 'var(--red)' : 'var(--border)';

  return (
    <div
      className="card"
      style={{
        marginBottom: 10,
        border: `2px solid ${borderColor}`,
        position: 'relative'
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {est.nome}
          </div>
          {est.endereco && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {est.endereco}
            </div>
          )}
        </div>
        <span className={rankClass}>{rankLabel}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>Total estimado</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isFirst ? 'var(--green)' : 'var(--text)', letterSpacing: '-0.03em' }}>
            {formatBRL(est.total)}
          </div>
        </div>
        {isFirst && est.economia > 0 && (
          <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{est.economia}%</div>
            <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 500 }}>de economia</div>
          </div>
        )}
      </div>

      {/* Item breakdown */}
      {est.precos?.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {est.precos.map((p, i) => (
            <div key={i} className="flex items-center justify-between" style={{ marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                {truncateProd(p.descricao, 34)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text)', flexShrink: 0 }}>
                {formatBRL(p.preco)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

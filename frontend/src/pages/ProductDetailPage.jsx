import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatBRL, formatDate, calcEconomy } from '../utils/format';
import { ArrowLeftIcon, PlusIcon, CheckIcon, MapPinIcon, ClockIcon } from '../components/Icons';
import { useBasket } from '../hooks/useBasket';
import { api } from '../utils/api';

export default function ProductDetailPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { add, isInBasket } = useBasket();

  const stateProduct = location.state?.product;
  const gtin = params.get('gtin');
  const q = params.get('q');

  const [product, setProduct] = useState(stateProduct || null);
  const [loading, setLoading] = useState(!stateProduct);
  const [addStatus, setAddStatus] = useState('idle'); // idle | added | dup

  useEffect(() => {
    if (stateProduct) return;
    (async () => {
      setLoading(true);
      try {
        const data = await api.search(q, gtin);
        const found = data.produtos?.find(p => p.gtin === gtin || p.descricao === q);
        setProduct(found || data.produtos?.[0]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleAdd = async () => {
    if (!product) return;
    try {
      const result = await add(product);
      if (result === 'duplicate') setAddStatus('dup');
      else { setAddStatus('added'); setTimeout(() => setAddStatus('idle'), 2500); }
    } catch {}
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>;
  if (!product) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Produto não encontrado.</div>;

  const inBasket = isInBasket(product.gtin, product.descricao);
  const economy = calcEconomy(product.precoMinimo, product.precoMaximo);

  const chartData = product.estabelecimentos.slice(0, 8).map(e => ({
    name: e.nome.replace(/FARMÁCIA|DROGARIA|ULTRA|DROGÃO/gi, '').trim().split(' ').slice(0, 2).join(' '),
    preco: e.preco
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      return (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{payload[0].payload.name}</div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{formatBRL(payload[0].value)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-12">
          <button className="btn btn-ghost btn-sm" style={{ padding: 6, minHeight: 36 }} onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={20} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Detalhes do produto
          </div>
        </div>
      </div>

      <div className="page-content px-20" style={{ paddingTop: 16 }}>
        {/* Product name card */}
        <div className="card card-lg" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}>{product.descricao}</div>
          {product.gtin && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>GTIN: {product.gtin}</div>
          )}
        </div>

        {/* Price summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <PriceCard label="Mínimo" value={product.precoMinimo} color="var(--green)" bg="var(--green-light)" />
          <PriceCard label="Médio" value={product.precoMedio} color="var(--primary)" bg="var(--primary-light)" />
          <PriceCard label="Máximo" value={product.precoMaximo} color="var(--red)" bg="var(--red-light)" />
        </div>

        {economy > 0 && (
          <div style={{
            background: 'var(--amber-light)', border: '1px solid #FCD34D',
            borderRadius: 12, padding: '12px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ fontSize: 22 }}>💰</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Economia possível: {economy}%</div>
              <div style={{ fontSize: 12, color: '#92400E' }}>
                Diferença de {formatBRL(product.precoMaximo - product.precoMinimo)} entre os estabelecimentos
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Comparação de preços</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="preco" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#16A34A' : i === chartData.length - 1 ? '#DC2626' : '#2563EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Establishments list */}
        <div style={{ marginBottom: 12 }}>
          <div className="section-title">{product.estabelecimentos.length} Estabelecimento{product.estabelecimentos.length !== 1 ? 's' : ''}</div>
          <div className="card" style={{ padding: '4px 0' }}>
            {product.estabelecimentos.map((est, idx) => (
              <div key={idx} style={{ padding: '12px 16px', borderBottom: idx < product.estabelecimentos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {est.nome}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {idx === 0 && <span className="rank-cheapest">Mais barato</span>}
                    {idx === product.estabelecimentos.length - 1 && product.estabelecimentos.length > 1 && <span className="rank-expensive">Mais caro</span>}
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: idx === 0 ? 'var(--green)' : 'var(--text)', letterSpacing: '-0.02em' }}>
                      {formatBRL(est.preco)}
                    </div>
                  </div>
                </div>
                {est.endereco && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <MapPinIcon size={11} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{est.endereco}</span>
                  </div>
                )}
                {est.data && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <ClockIcon size={10} />
                    <span>Última venda: {formatDate(est.data)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add to basket */}
        <button
          className="btn btn-full"
          style={{
            background: addStatus === 'added' ? 'var(--green)' : inBasket ? 'var(--green-light)' : 'var(--primary)',
            color: (inBasket && addStatus !== 'added') ? 'var(--green)' : 'white',
            fontSize: 16, minHeight: 52, borderRadius: 'var(--radius-lg)',
            border: inBasket && addStatus === 'idle' ? '1.5px solid var(--green)' : 'none',
            transition: 'all 0.25s ease', marginBottom: 8
          }}
          onClick={handleAdd}
          disabled={inBasket && addStatus !== 'added'}
        >
          {addStatus === 'added' ? <><CheckIcon size={18} /> Adicionado à cesta!</> :
           addStatus === 'dup' ? <><CheckIcon size={18} /> Já está na cesta</> :
           inBasket ? <><CheckIcon size={18} /> Na cesta de cotação</> :
           <><PlusIcon size={18} /> Adicionar à cesta de cotação</>}
        </button>
      </div>
    </div>
  );
}

function PriceCard({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color, letterSpacing: '-0.02em' }}>{formatBRL(value)}</div>
    </div>
  );
}

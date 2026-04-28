import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { SearchIcon, ArrowLeftIcon, SortIcon, AlertIcon } from '../components/Icons';
import { useBasket } from '../hooks/useBasket';
import ProductCard from '../components/ProductCard';

const FilterIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const XIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function ResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q');
  const gtin = params.get('gtin');
  const lat = params.get('lat');
  const lng = params.get('lng');
  const ibge = params.get('ibge');
  const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
  const { add, isInBasket } = useBasket();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('asc');
  const [addedId, setAddedId] = useState(null);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [cidadeSel, setCidadeSel] = useState('');
  const [bairroSel, setBairroSel] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      setCidadeSel('');
      setBairroSel('');
      try {
        const result = await api.search(q, gtin, 7, location, ibge);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [q, gtin]);

  // Bairros disponíveis para a cidade selecionada
  const bairrosDaCidade = useMemo(() => {
    if (!data) return [];
    const set = new Set();
    for (const prod of data.produtos) {
      for (const est of prod.estabelecimentos) {
        if ((!cidadeSel || est.cidade === cidadeSel) && est.bairro) set.add(est.bairro);
      }
    }
    return [...set].sort();
  }, [data, cidadeSel]);

  // Produtos com filtro aplicado
  const produtosFiltrados = useMemo(() => {
    if (!data) return [];
    return data.produtos
      .map(prod => {
        const ests = prod.estabelecimentos.filter(e => {
          if (cidadeSel && e.cidade !== cidadeSel) return false;
          if (bairroSel && e.bairro !== bairroSel) return false;
          return true;
        });
        if (!ests.length) return null;
        const precos = ests.map(e => e.preco);
        return {
          ...prod,
          estabelecimentos: ests,
          precoMinimo: Math.min(...precos),
          precoMaximo: Math.max(...precos),
          precoMedio: precos.reduce((a, b) => a + b, 0) / precos.length
        };
      })
      .filter(Boolean)
      .sort((a, b) => sort === 'asc'
        ? a.precoMinimo - b.precoMinimo
        : b.precoMinimo - a.precoMinimo
      );
  }, [data, cidadeSel, bairroSel, sort]);

  const temFiltro = !!(cidadeSel || bairroSel);
  const qtdFiltrosAtivos = [cidadeSel, bairroSel].filter(Boolean).length;

  const handleAddToBasket = async (product) => {
    try {
      const result = await add(product);
      if (result === 'duplicate') alert('Este produto já está na cesta!');
      else {
        setAddedId(product.gtin || product.descricao);
        setTimeout(() => setAddedId(null), 2000);
      }
    } catch {}
  };

  const limparFiltros = () => { setCidadeSel(''); setBairroSel(''); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 20px 10px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>

        {/* Linha 1: voltar + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: 6, minHeight: 36 }} onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={20} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {q || `GTIN: ${gtin}`}
          </div>
        </div>

        {/* Linha 2: contagem + botões */}
        {data && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>
              {temFiltro ? `${produtosFiltrados.length} de ${data.total}` : data.total} produto{data.total !== 1 ? 's' : ''}
              {data.usedMock && <span style={{ color: 'var(--amber)', marginLeft: 4 }}>· simulado</span>}
            </span>

            {/* Botão Filtrar */}
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: showFilters || temFiltro ? 'var(--primary)' : 'var(--bg-subtle)',
                color: showFilters || temFiltro ? 'white' : 'var(--text-secondary)',
                border: 'none', borderRadius: 8, padding: '6px 11px',
                fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              <FilterIcon size={13} />
              Filtrar
              {qtdFiltrosAtivos > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,0.3)', borderRadius: 99,
                  padding: '0 5px', fontSize: 10, fontWeight: 700, lineHeight: '16px'
                }}>
                  {qtdFiltrosAtivos}
                </span>
              )}
            </button>

            {/* Botão Ordenar */}
            <button
              onClick={() => setSort(s => s === 'asc' ? 'desc' : 'asc')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--bg-subtle)', border: 'none', borderRadius: 8, padding: '6px 10px',
                fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500,
                color: 'var(--text-secondary)', cursor: 'pointer'
              }}
            >
              <SortIcon size={13} />
              {sort === 'asc' ? 'Menor preço' : 'Maior preço'}
            </button>
          </div>
        )}

        {/* ── Painel de filtros ── */}
        {showFilters && data && (
          <div style={{
            marginTop: 10, background: 'var(--bg-card)', border: '1.5px solid var(--primary)',
            borderRadius: 14, padding: '14px 14px 12px', animation: 'fadeInUp 0.18s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Localização</span>
              {temFiltro && (
                <button onClick={limparFiltros} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--red-light)', color: 'var(--red)',
                  border: 'none', borderRadius: 8, padding: '4px 10px',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}>
                  <XIcon size={11} /> Limpar
                </button>
              )}
            </div>

            {/* Cidades */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                Cidade
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Chip label="Todas" active={!cidadeSel} onClick={() => { setCidadeSel(''); setBairroSel(''); }} />
                {data.filtros.cidades.map(c => (
                  <Chip key={c} label={c} active={cidadeSel === c}
                    onClick={() => { setCidadeSel(c); setBairroSel(''); }} />
                ))}
              </div>
            </div>

            {/* Bairros */}
            {bairrosDaCidade.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                  Bairro {cidadeSel ? `— ${cidadeSel}` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Chip label="Todos" active={!bairroSel} onClick={() => setBairroSel('')} />
                  {bairrosDaCidade.map(b => (
                    <Chip key={b} label={b} active={bairroSel === b} onClick={() => setBairroSel(b)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags de filtros ativos (fora do painel) */}
        {temFiltro && !showFilters && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {cidadeSel && <ActiveTag label={cidadeSel} onRemove={() => { setCidadeSel(''); setBairroSel(''); }} />}
            {bairroSel && <ActiveTag label={bairroSel} onRemove={() => setBairroSel('')} />}
          </div>
        )}
      </div>

      {/* ── Lista ── */}
      <div className="page-content px-20" style={{ paddingTop: 12 }}>

        {loading && <SkeletonList />}

        {error && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div className="empty-icon" style={{ margin: '0 auto 12px' }}>
              <AlertIcon size={28} color="var(--red)" />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Erro na busca</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{error}</div>
            <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && produtosFiltrados.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><SearchIcon size={28} /></div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {data?.apiIndisponivel
                ? 'API SEFAZ indisponível'
                : temFiltro ? 'Nenhum produto nessa região' : 'Nenhum produto encontrado'}
            </div>
            <div style={{ fontSize: 14 }}>
              {data?.apiIndisponivel
                ? `O servidor do Economiza Alagoas está temporariamente fora do ar. Tente novamente em alguns minutos.${data.errCode ? ` [${data.errCode}]` : ''}`
                : temFiltro ? 'Tente outros filtros de cidade ou bairro' : 'Tente termos diferentes'}
            </div>
            {temFiltro && !data?.apiIndisponivel && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }} onClick={limparFiltros}>
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {!loading && produtosFiltrados.map((product, idx) => (
          <ProductCard
            key={product.gtin || idx}
            product={product}
            isFirst={idx === 0 && sort === 'asc'}
            inBasket={isInBasket(product.gtin, product.descricao)}
            justAdded={addedId === (product.gtin || product.descricao)}
            onAdd={() => handleAddToBasket(product)}
            onDetail={() => navigate(`/product?gtin=${product.gtin}&q=${encodeURIComponent(product.descricao)}`, { state: { product } })}
          />
        ))}
      </div>
    </div>
  );
}

// ── Sub-componentes ──

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--primary)' : 'var(--bg)',
      color: active ? 'white' : 'var(--text-secondary)',
      border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
      borderRadius: 99, padding: '5px 13px',
      fontFamily: 'var(--font)', fontSize: 13,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
    }}>
      {label}
    </button>
  );
}

function ActiveTag({ label, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'var(--primary)', color: 'white',
      borderRadius: 99, padding: '4px 8px 4px 12px',
      fontSize: 12, fontWeight: 600
    }}>
      {label}
      <button onClick={onRemove} style={{
        background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white',
        cursor: 'pointer', padding: 2, borderRadius: 99,
        display: 'flex', alignItems: 'center', lineHeight: 1
      }}>
        <XIcon size={11} />
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card" style={{ marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ height: 28, width: 80 }} />
            <div className="skeleton" style={{ height: 36, width: 100, borderRadius: 10 }} />
          </div>
        </div>
      ))}
    </>
  );
}

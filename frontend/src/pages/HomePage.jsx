import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, BarcodeIcon, MapPinIcon } from '../components/Icons';
import { useGeoLocation } from '../hooks/useGeoLocation';

const BarcodeScannerModal = lazy(() => import('../components/BarcodeScannerModal'));

const CameraIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const ChevronDownIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function HomePage() {
  const [gtin, setGtin] = useState('');
  const [descricao, setDescricao] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();
  const { status: geoStatus, location } = useGeoLocation();

  const canSearch = gtin.trim().length >= 2 || descricao.trim().length >= 2;

  const handleSearch = () => {
    if (!canSearch) return;
    const geo = location ? `&lat=${location.lat}&lng=${location.lng}` : '';
    if (gtin.trim()) {
      navigate(`/results?gtin=${encodeURIComponent(gtin.trim())}${geo}`);
    } else {
      navigate(`/results?q=${encodeURIComponent(descricao.trim())}${geo}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <>
      {showScanner && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            onDetected={(code) => {
              setShowScanner(false);
              navigate(`/results?gtin=${encodeURIComponent(code.trim())}`);
            }}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}

      <div className="page-content px-20">

        {/* Banner */}
        <div style={{
          margin: '20px 0 20px',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1px solid #BFDBFE',
          borderRadius: 20,
          padding: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
          }}>
            <BarcodeIcon size={28} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1E3A8A', lineHeight: 1.2, marginBottom: 4 }}>
              Buscar Medicamentos
            </div>
            <div style={{ fontSize: 13, color: '#3B82F6', lineHeight: 1.4 }}>
              Encontre pelo código de barras ou nome em farmácias de Maceió
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="card card-lg" style={{ marginBottom: 16 }}>

          {/* Identificação */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
              Identificação do Produto
            </div>

            {/* Código de barras */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Código de Barras (GTIN)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Apenas números"
                  value={gtin}
                  onChange={e => { setGtin(e.target.value); if (e.target.value) setDescricao(''); }}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1, height: 50,
                    border: '1.5px solid var(--border)',
                    borderRadius: 12, padding: '0 14px',
                    fontSize: 15, fontFamily: 'var(--font-mono)',
                    color: 'var(--text)', background: 'var(--bg)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={() => setShowScanner(true)}
                  title="Escanear código de barras"
                  style={{
                    width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                    background: 'var(--primary-light)',
                    border: '1.5px solid #BFDBFE',
                    color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <CameraIcon size={20} />
                </button>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Nome do Medicamento
              </label>
              <input
                type="text"
                placeholder="Ex: Dipirona, Amoxicilina, Omeprazol"
                value={descricao}
                onChange={e => { setDescricao(e.target.value); if (e.target.value) setGtin(''); }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%', height: 50,
                  border: '1.5px solid var(--border)',
                  borderRadius: 12, padding: '0 14px',
                  fontSize: 15, fontFamily: 'var(--font)',
                  color: 'var(--text)', background: 'var(--bg)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {/* Localização */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              Localização
            </div>

            {/* Toggle município */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{
                flex: 1, height: 48, borderRadius: 12,
                border: '2px solid var(--primary)',
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14
              }}>
                <MapPinIcon size={16} />
                Município
              </div>
            </div>

            {/* Município fixo */}
            <div style={{
              width: '100%', height: 50,
              border: '1.5px solid var(--border)',
              borderRadius: 12, padding: '0 14px',
              fontSize: 15, fontFamily: 'var(--font)',
              color: 'var(--text)', background: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: geoStatus === 'granted' ? 'var(--green)' : 'var(--amber)', fontWeight: 500 }}>●</span>
                <span style={{ fontWeight: 500 }}>
                  {geoStatus === 'granted' ? 'Localização atual (raio 15 km)' : 'MACEIÓ'}
                </span>
              </div>
              <ChevronDownIcon size={16} />
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Busca preços em farmácias do município selecionado
            </div>
          </div>

          {/* Botão buscar */}
          <button
            className="btn btn-primary btn-full"
            style={{ minHeight: 52, fontSize: 16, borderRadius: 14 }}
            onClick={handleSearch}
            disabled={!canSearch}
          >
            <SearchIcon size={20} />
            Buscar Produtos
          </button>
        </div>

        {/* Buscas rápidas */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-title">Buscas rápidas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Dipirona', 'Amoxicilina', 'Omeprazol', 'Losartana', 'Ibuprofeno', 'Metformina'].map(q => (
              <button
                key={q}
                onClick={() => navigate(`/results?q=${encodeURIComponent(q)}`)}
                style={{
                  background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                  borderRadius: 99, padding: '8px 16px',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                  color: 'var(--text)', cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </>
  );
}

import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, BarcodeIcon, MapPinIcon } from '../components/Icons';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { MUNICIPIOS, MACEIO, buscarMunicipios } from '../utils/municipios';

const BarcodeScannerModal = lazy(() => import('../components/BarcodeScannerModal'));

const CameraIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

export default function HomePage() {
  const [gtin, setGtin] = useState('');
  const [descricao, setDescricao] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Localização
  const [useGeo, setUseGeo] = useState(false);
  const [municipio, setMunicipio] = useState(MACEIO);
  const [busca, setBusca] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const navigate = useNavigate();
  const { status: geoStatus, location, requestLocation } = useGeoLocation();

  const resultados = buscarMunicipios(busca);
  const canSearch = gtin.trim().length >= 2 || descricao.trim().length >= 2;

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setBusca('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Quando geo é concedida, ativa automaticamente
  useEffect(() => {
    if (geoStatus === 'granted') setUseGeo(true);
  }, [geoStatus]);

  function buildGeoParam() {
    if (useGeo && location) return `&lat=${location.lat}&lng=${location.lng}`;
    return `&ibge=${municipio.ibge}`;
  }

  const handleSearch = () => {
    if (!canSearch) return;
    const geo = buildGeoParam();
    if (gtin.trim()) {
      navigate(`/results?gtin=${encodeURIComponent(gtin.trim())}${geo}`);
    } else {
      navigate(`/results?q=${encodeURIComponent(descricao.trim())}${geo}`);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const selecionarMunicipio = (m) => {
    setMunicipio(m);
    setBusca('');
    setShowDropdown(false);
    setUseGeo(false);
  };

  const ativarGeo = () => {
    if (geoStatus === 'denied' || geoStatus === 'unavailable') return;
    if (geoStatus !== 'granted') requestLocation();
    setUseGeo(true);
  };

  return (
    <>
      {showScanner && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            onDetected={(code) => {
              setShowScanner(false);
              navigate(`/results?gtin=${encodeURIComponent(code.trim())}${buildGeoParam()}`);
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
          border: '1px solid #BFDBFE', borderRadius: 20,
          padding: '20px', display: 'flex', alignItems: 'center', gap: 16
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
              Compare preços em farmácias de Alagoas
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

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Código de Barras (GTIN)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="tel" inputMode="numeric" pattern="[0-9]*"
                  placeholder="Apenas números"
                  value={gtin}
                  onChange={e => { setGtin(e.target.value); if (e.target.value) setDescricao(''); }}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1, height: 50, border: '1.5px solid var(--border)',
                    borderRadius: 12, padding: '0 14px', fontSize: 15,
                    fontFamily: 'var(--font-mono)', color: 'var(--text)',
                    background: 'var(--bg)', outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={() => setShowScanner(true)}
                  style={{
                    width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                    background: 'var(--primary-light)', border: '1.5px solid #BFDBFE',
                    color: 'var(--primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <CameraIcon size={20} />
                </button>
              </div>
            </div>

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
                autoComplete="off" spellCheck={false}
                style={{
                  width: '100%', height: 50, border: '1.5px solid var(--border)',
                  borderRadius: 12, padding: '0 14px', fontSize: 15,
                  fontFamily: 'var(--font)', color: 'var(--text)',
                  background: 'var(--bg)', outline: 'none', transition: 'border-color 0.2s',
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

            {/* Toggle GPS / Município */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={ativarGeo}
                disabled={geoStatus === 'denied' || geoStatus === 'unavailable'}
                style={{
                  flex: 1, height: 42, borderRadius: 10, cursor: 'pointer',
                  border: useGeo ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: useGeo ? 'var(--primary-light)' : 'var(--bg)',
                  color: useGeo ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: (geoStatus === 'denied' || geoStatus === 'unavailable') ? 0.4 : 1,
                }}
              >
                <MapPinIcon size={14} />
                Minha localização
              </button>
              <button
                onClick={() => setUseGeo(false)}
                style={{
                  flex: 1, height: 42, borderRadius: 10, cursor: 'pointer',
                  border: !useGeo ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: !useGeo ? 'var(--primary-light)' : 'var(--bg)',
                  color: !useGeo ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                Município
              </button>
            </div>

            {/* Seletor de município com busca */}
            {!useGeo && (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => { setShowDropdown(true); setBusca(''); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{
                    width: '100%', minHeight: 50, border: '1.5px solid var(--border)',
                    borderRadius: showDropdown ? '12px 12px 0 0' : 12,
                    padding: '0 14px', fontSize: 15, color: 'var(--text)',
                    background: 'var(--bg)', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', cursor: 'pointer',
                    borderColor: showDropdown ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPinIcon size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 600 }}>{municipio.nome}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>▼</span>
                </div>

                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: 'var(--bg-card)', border: '1.5px solid var(--primary)',
                    borderTop: 'none', borderRadius: '0 0 12px 12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}>
                    {/* Campo de busca */}
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Digite para filtrar município..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        style={{
                          width: '100%', height: 38, border: '1.5px solid var(--border)',
                          borderRadius: 8, padding: '0 12px', fontSize: 14,
                          fontFamily: 'var(--font)', outline: 'none',
                          background: 'var(--bg)', color: 'var(--text)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        autoComplete="off"
                      />
                    </div>

                    {/* Lista de municípios */}
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {resultados.length === 0 ? (
                        <div style={{ padding: '14px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                          Nenhum município encontrado
                        </div>
                      ) : (
                        resultados.map(m => (
                          <div
                            key={m.ibge}
                            onMouseDown={() => selecionarMunicipio(m)}
                            style={{
                              padding: '11px 16px', fontSize: 14, cursor: 'pointer',
                              fontWeight: m.ibge === municipio.ibge ? 700 : 400,
                              color: m.ibge === municipio.ibge ? 'var(--primary)' : 'var(--text)',
                              background: m.ibge === municipio.ibge ? 'var(--primary-light)' : 'transparent',
                              borderBottom: '1px solid var(--border)',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => { if (m.ibge !== municipio.ibge) e.currentTarget.style.background = 'var(--bg)'; }}
                            onMouseLeave={e => { if (m.ibge !== municipio.ibge) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {m.nome}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {resultados.length} municípios disponíveis em Alagoas
                </div>
              </div>
            )}

            {/* Status GPS */}
            {useGeo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: geoStatus === 'granted' ? 'var(--green-light)' : 'var(--amber-light)',
                border: `1px solid ${geoStatus === 'granted' ? '#86EFAC' : '#FCD34D'}`,
                fontSize: 13, fontWeight: 500,
                color: geoStatus === 'granted' ? '#166534' : '#92400E',
              }}>
                <span style={{ fontSize: 10 }}>{geoStatus === 'granted' ? '●' : '◌'}</span>
                {geoStatus === 'granted'
                  ? 'Usando sua localização atual — raio de 15 km'
                  : 'Obtendo localização...'}
              </div>
            )}
          </div>

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
                onClick={() => navigate(`/results?q=${encodeURIComponent(q)}${buildGeoParam()}`)}
                style={{
                  background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                  borderRadius: 99, padding: '8px 16px',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                  color: 'var(--text)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
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

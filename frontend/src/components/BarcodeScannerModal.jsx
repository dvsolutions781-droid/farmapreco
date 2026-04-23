import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, BarcodeIcon } from './Icons';

// Detecta código de barras de uma imagem usando BarcodeDetector ou @zxing
async function detectFromImage(imgEl) {
  if ('BarcodeDetector' in window) {
    const detector = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
    });
    const results = await detector.detect(imgEl);
    if (results.length > 0) return results[0].rawValue;
  }
  // Fallback: @zxing
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const reader = new BrowserMultiFormatReader();
  const result = await reader.decodeFromImageElement(imgEl);
  return result.getText();
}

export default function BarcodeScannerModal({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectedRef = useRef(false);
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState(null);   // null | 'live' | 'photo'
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Tenta câmera ao vivo (só funciona em HTTPS)
    if (navigator.mediaDevices?.getUserMedia) {
      setMode('live');
      startCamera();
    } else {
      // HTTP: usa captura de foto
      setMode('photo');
    }
    return () => stopCamera();
  }, []);

  /* ── Modo ao vivo ─────────────────────────────────────── */

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startLiveDetection();
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Libere o acesso nas configurações do navegador.');
      } else {
        setMode('photo'); // fallback para foto
      }
    }
  }

  function stopCamera() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function startLiveDetection() {
    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      });
      liveLoop(detector);
    } else {
      import('@zxing/browser').then(({ BrowserMultiFormatReader }) => {
        const reader = new BrowserMultiFormatReader();
        reader.decodeFromStream(streamRef.current, videoRef.current, (result) => {
          if (result && !detectedRef.current) {
            detectedRef.current = true;
            stopCamera();
            onDetected(result.getText());
          }
        });
      }).catch(() => setMode('photo'));
    }
  }

  async function liveLoop(detector) {
    if (detectedRef.current || !videoRef.current) return;
    if (videoRef.current.readyState >= 2) {
      try {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          detectedRef.current = true;
          stopCamera();
          onDetected(results[0].rawValue);
          return;
        }
      } catch {}
    }
    animFrameRef.current = requestAnimationFrame(() => liveLoop(detector));
  }

  /* ── Modo foto ────────────────────────────────────────── */

  async function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const code = await detectFromImage(img);
      URL.revokeObjectURL(url);
      onDetected(code);
    } catch {
      URL.revokeObjectURL(file);
      setError('Código não encontrado na foto. Tente aproximar mais a câmera do código de barras e tente novamente.');
      setProcessing(false);
      // Permite tentar novamente
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#000', display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: 'rgba(0,0,0,0.6)'
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
          width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white', flexShrink: 0
        }}>
          <ArrowLeftIcon size={20} />
        </button>
        <div style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>
          Escanear código de barras
        </div>
      </div>

      {/* ── Câmera ao vivo ── */}
      {mode === 'live' && (
        <>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
          {!error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
            }}>
              <div style={{
                position: 'relative', width: 260, height: 120,
                border: '2px solid rgba(255,255,255,0.8)', borderRadius: 12,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
              }}>
                {[
                  { top:-2, left:-2, borderTop:'3px solid #2563EB', borderLeft:'3px solid #2563EB', borderRadius:'10px 0 0 0' },
                  { top:-2, right:-2, borderTop:'3px solid #2563EB', borderRight:'3px solid #2563EB', borderRadius:'0 10px 0 0' },
                  { bottom:-2, left:-2, borderBottom:'3px solid #2563EB', borderLeft:'3px solid #2563EB', borderRadius:'0 0 0 10px' },
                  { bottom:-2, right:-2, borderBottom:'3px solid #2563EB', borderRight:'3px solid #2563EB', borderRadius:'0 0 10px 0' },
                ].map((s, i) => <div key={i} style={{ position:'absolute', width:24, height:24, ...s }} />)}
                <div style={{
                  position:'absolute', left:4, right:4, height:2,
                  background:'linear-gradient(90deg,transparent,#2563EB,transparent)',
                  animation:'scanline 1.8s ease-in-out infinite'
                }} />
              </div>
              <div style={{
                marginTop: 20, color: 'rgba(255,255,255,0.85)', fontSize: 13,
                fontWeight: 500, textAlign: 'center', padding: '0 40px',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)'
              }}>
                Aponte para o código de barras do produto
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modo foto (HTTP / fallback) ── */}
      {mode === 'photo' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '80px 32px 32px', textAlign: 'center'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, marginBottom: 20,
            background: 'rgba(37,99,235,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BarcodeIcon size={40} color="#93C5FD" />
          </div>

          <div style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Fotografar código de barras
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Tire uma foto focada no código de barras do produto. Mantenha o celular estável e o código centralizado.
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              color: '#FCA5A5', fontSize: 13, lineHeight: 1.5
            }}>
              {error}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoFile}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            style={{
              background: processing ? 'rgba(37,99,235,0.5)' : '#2563EB',
              color: 'white', border: 'none', borderRadius: 16,
              padding: '16px 40px', fontSize: 16, fontWeight: 700,
              cursor: processing ? 'default' : 'pointer', width: '100%', maxWidth: 280,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            {processing ? (
              <>
                <div style={{
                  width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Analisando...
              </>
            ) : (
              <>
                <BarcodeIcon size={20} />
                {error ? 'Tentar novamente' : 'Abrir câmera'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Erro câmera ao vivo */}
      {error && mode === 'live' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center'
        }}>
          <BarcodeIcon size={48} color="rgba(255,255,255,0.4)" />
          <div style={{ color: 'white', fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Câmera indisponível</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>{error}</div>
          <button onClick={onClose} style={{
            background: '#2563EB', color: 'white', border: 'none',
            borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer'
          }}>Fechar</button>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 6px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 8px); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

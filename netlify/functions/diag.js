const net = require('net');
const dns = require('dns').promises;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

function tcpProbe(host, port, ms = 4000) {
  return new Promise((resolve) => {
    const t = Date.now();
    const sock = new net.Socket();
    sock.setTimeout(ms);
    sock.connect(port, host, () => {
      sock.destroy();
      resolve({ ok: true, ms: Date.now() - t });
    });
    sock.on('timeout', () => { sock.destroy(); resolve({ ok: false, error: 'timeout', ms: Date.now() - t }); });
    sock.on('error', (e) => resolve({ ok: false, error: e.message, ms: Date.now() - t }));
  });
}

async function httpProbe(url, token) {
  const t = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'AppToken': token },
      body: JSON.stringify({
        produto: { descricao: 'DIPIRONA' },
        estabelecimento: { municipio: { codigoIBGE: 2704302 } },
        dias: 1,
        registrosPorPagina: 5,
        pagina: 1
      }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    let records = 0;
    let rawPreview = '';
    try {
      const data = await res.json();
      records = Array.isArray(data?.conteudo) ? data.conteudo.length : -1;
      rawPreview = JSON.stringify(data).slice(0, 300);
    } catch (_) {}
    return { ok: res.ok, status: res.status, records, rawPreview, ms: Date.now() - t };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e.message, name: e.name, ms: Date.now() - t };
  }
}

exports.handler = async () => {
  const report = { timestamp: new Date().toISOString() };

  // Outbound IP (tells us where Netlify is running)
  try {
    const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    report.outbound_ip = (await r.json()).ip;
  } catch (e) {
    report.outbound_ip = `error: ${e.message}`;
  }

  // DNS
  const t0 = Date.now();
  try {
    report.dns = { addresses: await dns.resolve4('api.sefaz.al.gov.br'), ms: Date.now() - t0 };
  } catch (e) {
    report.dns = { error: e.message, ms: Date.now() - t0 };
  }

  // TCP probes
  report.tcp_80 = await tcpProbe('api.sefaz.al.gov.br', 80);
  report.tcp_443 = await tcpProbe('api.sefaz.al.gov.br', 443);

  const token = process.env.SEFAZ_APP_TOKEN || '';
  report.token_configured = token.length > 0;

  // HTTP search
  report.http_search = await httpProbe(
    'http://api.sefaz.al.gov.br/sfz-economiza-alagoas-api/api/public/produto/pesquisa',
    token
  );

  // HTTPS search
  report.https_search = await httpProbe(
    'https://api.sefaz.al.gov.br/sfz-economiza-alagoas-api/api/public/produto/pesquisa',
    token
  );

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(report, null, 2)
  };
};

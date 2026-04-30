const net = require('net');
const https = require('https');
const dns = require('dns').promises;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

const SEFAZ_HOST = 'api.sefaz.al.gov.br';
const SEFAZ_PATH = '/sfz-economiza-alagoas-api/api/public/produto/pesquisa';

function tcpProbe(host, port, ms = 4000) {
  return new Promise((resolve) => {
    const t = Date.now();
    const sock = new net.Socket();
    sock.setTimeout(ms);
    sock.connect(port, host, () => { sock.destroy(); resolve({ ok: true, ms: Date.now() - t }); });
    sock.on('timeout', () => { sock.destroy(); resolve({ ok: false, error: 'timeout', ms: Date.now() - t }); });
    sock.on('error', (e) => resolve({ ok: false, error: e.message, ms: Date.now() - t }));
  });
}

function httpsPost(body, token, timeoutMs = 7000) {
  return new Promise((resolve) => {
    const t = Date.now();
    const bodyStr = JSON.stringify(body);
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req = https.request(
      {
        hostname: SEFAZ_HOST,
        path: SEFAZ_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          'AppToken': token
        },
        agent,
        timeout: timeoutMs
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          let records = -1;
          let rawPreview = raw.slice(0, 300);
          try { records = JSON.parse(raw)?.conteudo?.length ?? 0; } catch (_) {}
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, records, rawPreview, ms: Date.now() - t });
        });
      }
    );
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout', ms: Date.now() - t }); });
    req.on('error', (e) => resolve({ ok: false, error: e.message, code: e.code, ms: Date.now() - t }));
    req.write(bodyStr);
    req.end();
  });
}

async function httpFetchProbe(token) {
  const t = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(`http://${SEFAZ_HOST}${SEFAZ_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'AppToken': token },
      body: JSON.stringify({ produto: { descricao: 'DIPIRONA' }, estabelecimento: { municipio: { codigoIBGE: 2704302 } }, dias: 1, registrosPorPagina: 5, pagina: 1 }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    let records = -1;
    try { records = (await res.json())?.conteudo?.length ?? 0; } catch (_) {}
    return { ok: res.ok, status: res.status, records, ms: Date.now() - t };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e.message, name: e.name, ms: Date.now() - t };
  }
}

exports.handler = async () => {
  const token = process.env.SEFAZ_APP_TOKEN || '';
  const report = { timestamp: new Date().toISOString(), token_configured: token.length > 0 };

  // Outbound IP — confirma região do Netlify
  try {
    const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    report.outbound_ip = (await r.json()).ip;
  } catch (e) {
    report.outbound_ip = `error: ${e.message}`;
  }

  // DNS
  const t0 = Date.now();
  try {
    report.dns = { addresses: await dns.resolve4(SEFAZ_HOST), ms: Date.now() - t0 };
  } catch (e) {
    report.dns = { error: e.message, ms: Date.now() - t0 };
  }

  // TCP probes
  report.tcp_80  = await tcpProbe(SEFAZ_HOST, 80);
  report.tcp_443 = await tcpProbe(SEFAZ_HOST, 443);

  const sampleBody = {
    produto: { descricao: 'DIPIRONA' },
    estabelecimento: { municipio: { codigoIBGE: 2704302 } },
    dias: 1, registrosPorPagina: 5, pagina: 1
  };

  // HTTP via fetch nativo (7s timeout)
  report.http_fetch = await httpFetchProbe(token);

  // HTTPS via módulo https nativo com rejectUnauthorized:false (7s timeout)
  report.https_no_verify = await httpsPost(sampleBody, token);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(report, null, 2)
  };
};

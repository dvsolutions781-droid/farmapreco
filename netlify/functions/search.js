const https = require('https');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id'
};

const SEFAZ_HOST = 'api.sefaz.al.gov.br';
const SEFAZ_PATH = '/sfz-economiza-alagoas-api/api/public/produto/pesquisa';
const APP_TOKEN = process.env.SEFAZ_APP_TOKEN || '';

// Cert auto-assinado/expirado na SEFAZ — bypass necessário
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

function sefazPost(body, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request(
      {
        hostname: SEFAZ_HOST,
        path: SEFAZ_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          'AppToken': APP_TOKEN
        },
        agent,
        timeout: timeoutMs
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            reject(Object.assign(new Error(`JSON inválido: ${raw.slice(0, 120)}`), { code: 'JSON_PARSE' }));
          }
        });
        res.on('error', reject);
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(Object.assign(new Error('Timeout 9s'), { code: 'TIMEOUT_9S' }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const { q, gtin, dias = '7', lat, lng, ibge } = event.queryStringParameters || {};
  if (!q && !gtin) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Informe q ou gtin' }) };
  if (q && q.trim().length < 2) return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Busca deve ter pelo menos 2 caracteres' }) };

  const estabelecimento = lat && lng
    ? { geolocalizacao: { latitude: parseFloat(lat), longitude: parseFloat(lng), raio: 15 } }
    : { municipio: { codigoIBGE: parseInt(ibge) || parseInt(process.env.MUNICIPIO_IBGE) || 2704302 } };

  const bodyReq = {
    produto: gtin ? { gtin: gtin.trim() } : { descricao: q.trim().toUpperCase() },
    estabelecimento,
    dias: Math.min(parseInt(dias) || 7, 10),
    registrosPorPagina: 50,
    pagina: 1
  };

  try {
    const { status, data } = await sefazPost(bodyReq);
    if (status < 200 || status >= 300) {
      throw Object.assign(new Error(JSON.stringify(data).slice(0, 200)), { code: `HTTP_${status}` });
    }
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(normalizeResponse(data, q || gtin)) };
  } catch (err) {
    const errCode = err.code || err.name || 'UNKNOWN';
    const errMsg = (err.message || '').slice(0, 300);
    console.error('[search] SEFAZ erro:', errCode, errMsg);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        query: q || gtin,
        total: 0,
        totalRegistros: 0,
        produtos: [],
        filtros: { cidades: [], bairros: [] },
        apiIndisponivel: true,
        errCode,
        errMsg,
        timestamp: new Date().toISOString()
      })
    };
  }
};

function normalizeResponse(data, query) {
  const registros = Array.isArray(data?.conteudo) ? data.conteudo : [];
  const mapaGtin = new Map();

  for (const registro of registros) {
    const p = registro.produto;
    const e = registro.estabelecimento;
    if (!p || !e) continue;

    const chave = p.gtin || p.codigo || p.descricao || '';
    if (!mapaGtin.has(chave)) mapaGtin.set(chave, { produto: p, estabelecimentos: [] });

    const endObj = e.endereco || e['endereço'] || {};
    mapaGtin.get(chave).estabelecimentos.push({
      nome: e.nomeFantasia || e.razaoSocial || 'N/A',
      cnpj: e.cnpj || '',
      endereco: [endObj.nomeLogradouro, endObj.numeroImovel, endObj.bairro, endObj.municipio].filter(Boolean).join(', '),
      bairro: endObj.bairro || '',
      cidade: endObj.municipio || 'Maceió',
      preco: parseFloat(p.venda?.valorVenda ?? p.venda?.valorDeclarado ?? 0),
      data: p.venda?.dataVenda || new Date().toISOString()
    });
  }

  const produtos = [];
  for (const { produto: p, estabelecimentos } of mapaGtin.values()) {
    const estOrdenados = estabelecimentos.sort((a, b) => a.preco - b.preco);
    const precos = estOrdenados.map(e => e.preco).filter(v => v > 0);
    produtos.push({
      gtin: p.gtin || '',
      descricao: p.descricaoSefaz || p.descricao || '',
      ncm: p.ncm || '',
      unidadeMedida: p.unidadeMedida || 'UN',
      precoMinimo: precos.length ? Math.min(...precos) : 0,
      precoMaximo: precos.length ? Math.max(...precos) : 0,
      precoMedio: precos.length ? precos.reduce((a, b) => a + b, 0) / precos.length : 0,
      economia: precos.length > 1
        ? ((Math.max(...precos) - Math.min(...precos)) / Math.max(...precos) * 100).toFixed(1)
        : 0,
      estabelecimentos: estOrdenados
    });
  }

  const cidadesSet = new Set();
  const bairrosSet = new Set();
  for (const prod of produtos) {
    for (const est of prod.estabelecimentos) {
      if (est.cidade) cidadesSet.add(est.cidade);
      if (est.bairro) bairrosSet.add(est.bairro);
    }
  }

  return {
    query,
    total: produtos.length,
    totalRegistros: data?.totalRegistros || produtos.length,
    produtos,
    filtros: { cidades: [...cidadesSet].sort(), bairros: [...bairrosSet].sort() },
    timestamp: new Date().toISOString()
  };
}

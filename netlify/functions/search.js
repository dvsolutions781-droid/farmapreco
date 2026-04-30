const http = require('http');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id'
};

const APP_TOKEN = process.env.SEFAZ_APP_TOKEN || '';

function sefazPost(body, timeoutMs = 8500) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'api.sefaz.al.gov.br',
        path: '/sfz-economiza-alagoas-api/api/public/produto/pesquisa',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          'AppToken': APP_TOKEN
        },
        timeout: timeoutMs
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
          catch { reject(Object.assign(new Error('JSON inválido'), { code: 'JSON_PARSE' })); }
        });
        res.on('error', reject);
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(Object.assign(new Error('Timeout 9s — configure VITE_SEARCH_BASE_URL com servidor em São Paulo'), { code: 'TIMEOUT_9S' }));
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
    dias: Math.min(parseInt(dias) || 7, 10)
  };

  try {
    const { status, data } = await sefazPost(bodyReq);
    if (status < 200 || status >= 300) throw Object.assign(new Error(`SEFAZ ${status}`), { code: `HTTP_${status}` });
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(normalizeResponse(data, q || gtin)) };
  } catch (err) {
    const errCode = err.code || err.name || 'UNKNOWN';
    console.error('[search] SEFAZ erro:', errCode, err.message);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        query: q || gtin, total: 0, totalRegistros: 0, produtos: [],
        filtros: { cidades: [], bairros: [] },
        apiIndisponivel: true, errCode,
        errMsg: err.message?.slice(0, 200),
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
      gtin: p.gtin || '', descricao: p.descricaoSefaz || p.descricao || '',
      ncm: p.ncm || '', unidadeMedida: p.unidadeMedida || 'UN',
      precoMinimo: precos.length ? Math.min(...precos) : 0,
      precoMaximo: precos.length ? Math.max(...precos) : 0,
      precoMedio: precos.length ? precos.reduce((a, b) => a + b, 0) / precos.length : 0,
      economia: precos.length > 1 ? ((Math.max(...precos) - Math.min(...precos)) / Math.max(...precos) * 100).toFixed(1) : 0,
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
    query, total: produtos.length,
    totalRegistros: data?.totalRegistros || produtos.length,
    produtos,
    filtros: { cidades: [...cidadesSet].sort(), bairros: [...bairrosSet].sort() },
    timestamp: new Date().toISOString()
  };
}

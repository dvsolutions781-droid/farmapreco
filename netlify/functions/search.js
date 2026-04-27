const axios = require('axios');

const sefazClient = axios.create({
  baseURL: process.env.SEFAZ_API_URL || 'http://api.sefaz.al.gov.br/sfz-economiza-alagoas-api/api/public',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'AppToken': process.env.SEFAZ_APP_TOKEN || ''
  }
});

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const { q, gtin, dias = '7', lat, lng } = event.queryStringParameters || {};

  if (!q && !gtin) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Informe q (descrição) ou gtin' }) };
  }

  if (q && q.trim().length < 2) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Busca deve ter pelo menos 2 caracteres' }) };
  }

  const estabelecimento = lat && lng
    ? { geolocalizacao: { latitude: parseFloat(lat), longitude: parseFloat(lng), raio: 15 } }
    : { municipio: { codigoIBGE: parseInt(process.env.MUNICIPIO_IBGE) || 2704302 } };

  const body = {
    produto: {},
    estabelecimento,
    dias: Math.min(parseInt(dias) || 7, 10)
  };

  if (gtin) body.produto.gtin = gtin.trim();
  else body.produto.descricao = q.trim().toUpperCase();

  try {
    const response = await sefazClient.post('/produto/pesquisa', body);
    const normalized = normalizeResponse(response.data, q || gtin);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(normalized) };
  } catch (err) {
    console.error('[search] erro SEFAZ:', err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Erro ao consultar API SEFAZ', detail: err.message })
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
    if (!mapaGtin.has(chave)) {
      mapaGtin.set(chave, { produto: p, estabelecimentos: [] });
    }

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

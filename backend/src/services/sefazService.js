const axios = require('axios');
const NodeCache = require('node-cache');
const { getMockData } = require('../../data/mockData');

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 300 });

const sefazClient = axios.create({
  baseURL: process.env.SEFAZ_API_URL || 'http://api.sefaz.al.gov.br/sfz-economiza-alagoas-api/api/public',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'AppToken': process.env.SEFAZ_APP_TOKEN || ''
  }
});

async function searchProducts({ descricao, gtin, dias = 7, lat, lng, ibge }) {
  const cacheKey = `search:${descricao || ''}:${gtin || ''}:${dias}:${lat || ''}:${lng || ''}:${ibge || ''}`;
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const estabelecimento = lat && lng
    ? { geolocalizacao: { latitude: parseFloat(lat), longitude: parseFloat(lng), raio: 15 } }
    : { municipio: { codigoIBGE: parseInt(ibge) || parseInt(process.env.MUNICIPIO_IBGE) || 2704302 } };

  const bodyBase = {
    produto: {},
    estabelecimento,
    dias,
    registrosPorPagina: 50
  };

  if (gtin) bodyBase.produto.gtin = gtin;
  else if (descricao) bodyBase.produto.descricao = descricao.toUpperCase();
  else throw new Error('Informe descrição ou GTIN do produto');

  let usedMock = false;
  let rawData;

  try {
    if (!process.env.SEFAZ_APP_TOKEN || process.env.SEFAZ_APP_TOKEN === 'SEU_TOKEN_AQUI') {
      throw new Error('Token não configurado');
    }

    const primeira = await sefazClient.post('/produto/pesquisa', { ...bodyBase, pagina: 1 });
    rawData = primeira.data;
    console.log(`[SEFAZ] totalRegistros=${rawData.totalRegistros} registros=${rawData.conteudo?.length}`);
  } catch (err) {
    console.warn(`[SEFAZ API] Usando dados simulados. Motivo: ${err.message}`);
    rawData = getMockData(descricao || gtin);
    usedMock = true;
  }

  const normalized = normalizeResponse(rawData, descricao || gtin);
  normalized.usedMock = usedMock;

  if (!usedMock) cache.set(cacheKey, normalized);
  return normalized;
}

function normalizeResponse(data, query) {
  // Resposta real da API SEFAZ: { conteudo: [{ produto, estabelecimento }, ...] }
  // Fallback para formatos legados usados nos mocks
  let registros = [];

  if (data && Array.isArray(data.conteudo)) {
    registros = data.conteudo;
  } else if (data && data.produtos) {
    return normalizeLegacy(data, query);
  } else if (Array.isArray(data)) {
    return normalizeLegacy(data, query);
  } else if (data && data.content) {
    return normalizeLegacy(data, query);
  }

  // Agrupa registros pelo GTIN (ou descrição quando sem GTIN) para consolidar
  // os estabelecimentos que vendem o mesmo produto
  const mapaGtin = new Map();

  for (const registro of registros) {
    const p = registro.produto;
    const e = registro.estabelecimento;
    if (!p || !e) continue;

    const chave = p.gtin || p.codigo || p.descricao || '';
    if (!mapaGtin.has(chave)) {
      mapaGtin.set(chave, { produto: p, estabelecimentos: [] });
    }

    const endObj = e.endereco || e.endereço || {};
    const bairro = endObj.bairro || '';
    const cidade = endObj.municipio || 'Maceió';

    mapaGtin.get(chave).estabelecimentos.push({
      nome: e.nomeFantasia || e.razaoSocial || 'N/A',
      cnpj: e.cnpj || '',
      endereco: formatEndereco(endObj),
      bairro,
      cidade,
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
    totalRegistros: data.totalRegistros || produtos.length,
    produtos,
    filtros: {
      cidades: [...cidadesSet].sort(),
      bairros: [...bairrosSet].sort()
    },
    timestamp: new Date().toISOString()
  };
}

// Mantém compatibilidade com o formato usado pelos mocks e dados legados
function normalizeLegacy(data, query) {
  let rawList = [];
  if (data && data.produtos) rawList = data.produtos;
  else if (Array.isArray(data)) rawList = data;
  else if (data && data.content) rawList = data.content;

  const produtos = rawList.map(p => {
    const estabelecimentos = (p.estabelecimentos || p.precos || []).map(e => {
      const enderecoObj = e.estabelecimento?.endereco;
      const bairro = e.bairro || enderecoObj?.bairro || extrairBairro(e.endereco) || '';
      const cidade = e.cidade || enderecoObj?.municipio || extrairCidade(e.endereco) || 'Maceió';
      return {
        nome: e.nome || e.estabelecimento?.nomeFantasia || e.estabelecimento?.razaoSocial || 'N/A',
        cnpj: e.cnpj || e.estabelecimento?.cnpj || '',
        endereco: e.endereco || formatEndereco(enderecoObj),
        bairro,
        cidade,
        preco: parseFloat(e.preco || e.valorVenda || 0),
        data: e.data || e.dataVenda || new Date().toISOString()
      };
    }).sort((a, b) => a.preco - b.preco);

    const precos = estabelecimentos.map(e => e.preco).filter(v => v > 0);
    return {
      gtin: p.gtin || p.codigoBarras || '',
      descricao: p.descricao || p.nome || '',
      precoMinimo: precos.length ? Math.min(...precos) : 0,
      precoMaximo: precos.length ? Math.max(...precos) : 0,
      precoMedio: precos.length ? precos.reduce((a, b) => a + b, 0) / precos.length : 0,
      economia: precos.length > 1
        ? ((Math.max(...precos) - Math.min(...precos)) / Math.max(...precos) * 100).toFixed(1)
        : 0,
      estabelecimentos
    };
  });

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
    produtos,
    filtros: {
      cidades: [...cidadesSet].sort(),
      bairros: [...bairrosSet].sort()
    },
    timestamp: new Date().toISOString()
  };
}

function formatEndereco(e) {
  if (!e) return '';
  // Campos conforme manual da API: nomeLogradouro e numeroImovel
  return [e.nomeLogradouro || e.logradouro, e.numeroImovel || e.numero, e.bairro, e.municipio].filter(Boolean).join(', ');
}

// Tenta extrair bairro do padrão "Rua X, 123 - Bairro, Cidade"
function extrairBairro(endereco) {
  if (!endereco) return '';
  const match = endereco.match(/[-–]\s*([^,]+)/);
  return match ? match[1].trim() : '';
}

function extrairCidade(endereco) {
  if (!endereco) return '';
  const parts = endereco.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : '';
}

function clearCache() {
  cache.flushAll();
}

function getCacheStats() {
  return cache.getStats();
}

module.exports = { searchProducts, clearCache, getCacheStats };

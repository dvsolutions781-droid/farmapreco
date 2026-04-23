const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id'
};

function reply(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function getSessionId(event) {
  return (
    event.queryStringParameters?.session_id ||
    event.headers?.['x-session-id'] ||
    'default'
  );
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const path = event.path;
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const isCompare = lastSegment === 'compare';
  // Se o último segmento não é "basket" nem "compare", é um UUID de item
  const itemId = !isCompare && lastSegment !== 'basket' ? lastSegment : null;

  const sessionId = getSessionId(event);

  try {
    if (event.httpMethod === 'GET' && isCompare) return await handleCompare(sessionId);
    if (event.httpMethod === 'GET')               return await handleGet(sessionId);
    if (event.httpMethod === 'POST')              return await handlePost(sessionId, JSON.parse(event.body || '{}'));
    if (event.httpMethod === 'DELETE' && itemId)  return await handleDeleteOne(itemId, sessionId);
    if (event.httpMethod === 'DELETE')            return await handleDeleteAll(sessionId);

    return reply(405, { error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[basket]', err.message);
    return reply(500, { error: err.message });
  }
};

async function handleGet(sessionId) {
  const { data, error } = await supabase
    .from('basket_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const items = (data || []).map(row => ({
    id: row.id,
    gtin: row.gtin,
    descricao: row.descricao,
    precoMinimo: parseFloat(row.preco_minimo),
    precoMaximo: parseFloat(row.preco_maximo),
    precoMedio: parseFloat(row.preco_medio),
    estabelecimentos: row.estabelecimentos || [],
    addedAt: row.created_at
  }));

  return reply(200, { items, total: items.length });
}

async function handlePost(sessionId, body) {
  const { gtin, descricao, precoMinimo, precoMaximo, precoMedio, estabelecimentos } = body;

  if (!descricao) return reply(400, { error: 'Produto inválido' });

  const { data: existing } = await supabase
    .from('basket_items')
    .select('id')
    .eq('session_id', sessionId)
    .eq('descricao', descricao)
    .maybeSingle();

  if (existing) return reply(409, { error: 'Produto já está na cesta', item: existing });

  const { data, error } = await supabase
    .from('basket_items')
    .insert({
      session_id: sessionId,
      gtin: gtin || '',
      descricao,
      preco_minimo: precoMinimo || 0,
      preco_maximo: precoMaximo || 0,
      preco_medio: precoMedio || 0,
      estabelecimentos: estabelecimentos || []
    })
    .select()
    .single();

  if (error) throw error;

  return reply(201, { message: 'Produto adicionado', item: data });
}

async function handleDeleteOne(id, sessionId) {
  const { error } = await supabase
    .from('basket_items')
    .delete()
    .eq('id', id)
    .eq('session_id', sessionId);

  if (error) throw error;
  return reply(200, { message: 'Produto removido' });
}

async function handleDeleteAll(sessionId) {
  const { error } = await supabase
    .from('basket_items')
    .delete()
    .eq('session_id', sessionId);

  if (error) throw error;
  return reply(200, { message: 'Cesta limpa' });
}

async function handleCompare(sessionId) {
  const { data, error } = await supabase
    .from('basket_items')
    .select('descricao, estabelecimentos')
    .eq('session_id', sessionId);

  if (error) throw error;

  const basket = data || [];
  if (basket.length === 0) return reply(200, { ranking: [], totalItens: 0 });

  const estMap = new Map();

  for (const item of basket) {
    for (const est of (item.estabelecimentos || [])) {
      const chave = est.cnpj || est.nome;
      if (!estMap.has(chave)) {
        estMap.set(chave, { nome: est.nome, cnpj: est.cnpj, endereco: est.endereco, total: 0, itensEncontrados: 0, precos: [] });
      }
      const agg = estMap.get(chave);
      agg.total += est.preco;
      agg.itensEncontrados++;
      agg.precos.push({ descricao: item.descricao, preco: est.preco });
    }
  }

  let ranking = Array.from(estMap.values())
    .filter(e => e.itensEncontrados === basket.length)
    .sort((a, b) => a.total - b.total);

  if (ranking.length === 0) {
    ranking = Array.from(estMap.values()).sort((a, b) => a.total - b.total);
  }

  return reply(200, {
    totalItens: basket.length,
    itensNaCesta: basket.map(i => i.descricao),
    ranking: ranking.map((e, idx) => ({
      ...e,
      posicao: idx + 1,
      label: idx === 0 ? 'Mais barato' : idx === ranking.length - 1 ? 'Mais caro' : 'Intermediário',
      economia: ranking.length > 1
        ? ((ranking[ranking.length - 1].total - e.total) / ranking[ranking.length - 1].total * 100).toFixed(1)
        : 0
    }))
  });
}

const express = require('express');
const router = express.Router();

// In-memory basket store (keyed by session/ip for simplicity)
const baskets = new Map();

function getBasketKey(req) {
  return req.ip || 'default';
}

// GET /api/basket
router.get('/', (req, res) => {
  const key = getBasketKey(req);
  const basket = baskets.get(key) || [];
  res.json({ items: basket, total: basket.length });
});

// POST /api/basket - add product
router.post('/', (req, res) => {
  const key = getBasketKey(req);
  const { gtin, descricao, precoMinimo, precoMaximo, precoMedio, estabelecimentos } = req.body;

  if (!descricao) {
    return res.status(400).json({ error: 'Produto inválido' });
  }

  const basket = baskets.get(key) || [];
  const exists = basket.find(i => i.gtin === gtin && i.descricao === descricao);

  if (exists) {
    return res.status(409).json({ error: 'Produto já está na cesta', item: exists });
  }

  const item = {
    id: Date.now().toString(),
    gtin,
    descricao,
    precoMinimo,
    precoMaximo,
    precoMedio,
    estabelecimentos: estabelecimentos || [],
    addedAt: new Date().toISOString()
  };

  basket.push(item);
  baskets.set(key, basket);

  res.status(201).json({ message: 'Produto adicionado', item });
});

// DELETE /api/basket/:id
router.delete('/:id', (req, res) => {
  const key = getBasketKey(req);
  const basket = baskets.get(key) || [];
  const filtered = basket.filter(i => i.id !== req.params.id);
  baskets.set(key, filtered);
  res.json({ message: 'Produto removido', items: filtered });
});

// DELETE /api/basket - clear all
router.delete('/', (req, res) => {
  const key = getBasketKey(req);
  baskets.set(key, []);
  res.json({ message: 'Cesta limpa' });
});

// GET /api/basket/compare - ranking por estabelecimento
router.get('/compare', (req, res) => {
  const key = getBasketKey(req);
  const basket = baskets.get(key) || [];

  if (basket.length === 0) {
    return res.json({ ranking: [], totalItens: 0 });
  }

  // Aggregate prices per establishment
  const estabelecimentoMap = new Map();

  for (const item of basket) {
    for (const est of item.estabelecimentos) {
      const cnpj = est.cnpj || est.nome;
      if (!estabelecimentoMap.has(cnpj)) {
        estabelecimentoMap.set(cnpj, {
          nome: est.nome,
          cnpj: est.cnpj,
          endereco: est.endereco,
          total: 0,
          itensEncontrados: 0,
          precos: []
        });
      }
      const agg = estabelecimentoMap.get(cnpj);
      agg.total += est.preco;
      agg.itensEncontrados++;
      agg.precos.push({ descricao: item.descricao, preco: est.preco });
    }
  }

  const ranking = Array.from(estabelecimentoMap.values())
    .filter(e => e.itensEncontrados === basket.length) // only those with all items
    .sort((a, b) => a.total - b.total);

  // If no establishment has all items, include partial
  const partial = ranking.length === 0
    ? Array.from(estabelecimentoMap.values()).sort((a, b) => a.total - b.total)
    : ranking;

  res.json({
    totalItens: basket.length,
    itensNaCesta: basket.map(i => i.descricao),
    ranking: partial.map((e, idx) => ({
      ...e,
      posicao: idx + 1,
      label: idx === 0 ? 'Mais barato' : idx === partial.length - 1 ? 'Mais caro' : 'Intermediário',
      economia: partial.length > 1 ? ((partial[partial.length - 1].total - e.total) / partial[partial.length - 1].total * 100).toFixed(1) : 0
    }))
  });
});

module.exports = router;

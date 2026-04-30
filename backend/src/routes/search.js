const express = require('express');
const router = express.Router();
const { searchProducts } = require('../services/sefazService');

// GET /api/search?q=dipirona&dias=7
// GET /api/search?gtin=7896004724032
router.get('/', async (req, res) => {
  try {
    const { q, gtin, dias = 7, lat, lng, ibge } = req.query;

    if (!q && !gtin) {
      return res.status(400).json({ error: 'Informe q (descrição) ou gtin' });
    }

    if (q && q.trim().length < 2) {
      return res.status(400).json({ error: 'Busca deve ter pelo menos 2 caracteres' });
    }

    const result = await searchProducts({
      descricao: q ? q.trim() : undefined,
      gtin: gtin ? gtin.trim() : undefined,
      dias: parseInt(dias),
      lat, lng, ibge
    });

    res.json(result);
  } catch (err) {
    console.error('[Search Route Error]', err.message);
    res.status(500).json({ error: err.message || 'Erro interno ao buscar produtos' });
  }
});

module.exports = router;

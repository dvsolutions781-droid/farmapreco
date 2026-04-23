const express = require('express');
const router = express.Router();
const { getCacheStats } = require('../services/sefazService');

// In-memory search history
const searchHistory = [];
const MAX_HISTORY = 100;

function recordSearch(query, resultCount) {
  searchHistory.unshift({ query, resultCount, timestamp: new Date().toISOString() });
  if (searchHistory.length > MAX_HISTORY) searchHistory.pop();
}

// GET /api/stats
router.get('/', (req, res) => {
  const topSearches = getTopSearches();
  const cache = getCacheStats();

  res.json({
    totalBuscas: searchHistory.length,
    topBuscas: topSearches,
    cache: {
      hits: cache.hits,
      misses: cache.misses,
      keys: cache.keys
    },
    ultimasBuscas: searchHistory.slice(0, 10)
  });
});

function getTopSearches() {
  const counts = {};
  for (const s of searchHistory) {
    counts[s.query] = (counts[s.query] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([query, count]) => ({ query, count }));
}

module.exports = { router, recordSearch };

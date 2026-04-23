require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const searchRoute = require('./routes/search');
const basketRoute = require('./routes/basket');
const { router: statsRoute } = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Muitas requisições. Aguarde um momento.' }
});
app.use('/api', limiter);

// Routes
app.use('/api/search', searchRoute);
app.use('/api/basket', basketRoute);
app.use('/api/stats', statsRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tokenConfigured: !!(process.env.SEFAZ_APP_TOKEN && process.env.SEFAZ_APP_TOKEN !== 'SEU_TOKEN_AQUI'),
    version: '1.0.0'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 FarmaPreço Backend rodando em http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Busca: http://localhost:${PORT}/api/search?q=dipirona`);
  
  const tokenOk = process.env.SEFAZ_APP_TOKEN && process.env.SEFAZ_APP_TOKEN !== 'SEU_TOKEN_AQUI';
  if (!tokenOk) {
    console.log(`\n⚠️  ATENÇÃO: Token SEFAZ não configurado. Usando dados simulados.`);
    console.log(`   Configure SEFAZ_APP_TOKEN no arquivo .env\n`);
  } else {
    console.log(`\n✅ Token SEFAZ configurado. API real ativada.\n`);
  }
});

module.exports = app;

# 💊 FarmaPreço

Sistema mobile-first de cotação e comparação de preços farmacêuticos com dados da API SEFAZ Alagoas (Economiza Alagoas).

---

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 18+ instalado
- npm

### 1. Instalar dependências

```bash
# Backend
cd backend
npm install

# Frontend (outro terminal)
cd frontend
npm install
```

### 2. Configurar token SEFAZ (opcional)

Edite o arquivo `backend/.env`:

```
SEFAZ_APP_TOKEN=SEU_TOKEN_FORNECIDO_PELA_SEFAZ
```

> **Sem o token:** O sistema funciona normalmente com **dados simulados** realistas para demonstração e testes. Basta deixar `SEU_TOKEN_AQUI`.

### 3. Rodar o sistema

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev     # com hot-reload (nodemon)
# ou
npm start       # produção
```
Backend sobe em: http://localhost:3001

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```
Frontend sobe em: http://localhost:3000

---

## 📱 Telas do Sistema

| Tela | Rota | Descrição |
|------|------|-----------|
| **Home** | `/` | Busca principal + histórico |
| **Resultados** | `/results?q=dipirona` | Lista de produtos com preços |
| **Detalhe** | `/product` | Gráfico + todos os estabelecimentos |
| **Cesta** | `/basket` | Cotação comparativa por farmácia |
| **Dashboard** | `/dashboard` | Insights e métricas |

---

## 🔌 API Backend

### Buscar produtos
```
GET /api/search?q=dipirona
GET /api/search?q=amoxicilina&dias=14
GET /api/search?gtin=7896004724032
```

### Cesta de cotação
```
GET    /api/basket          - listar cesta
POST   /api/basket          - adicionar produto
DELETE /api/basket/:id      - remover produto
DELETE /api/basket          - limpar cesta
GET    /api/basket/compare  - ranking por farmácia
```

### Dados e estatísticas
```
GET /api/stats    - buscas e cache
GET /health       - status da API e token
```

---

## 🏗️ Estrutura do Projeto

```
farmapreco/
├── backend/
│   ├── src/
│   │   ├── server.js              # Entry point Express
│   │   ├── routes/
│   │   │   ├── search.js          # Busca de produtos
│   │   │   ├── basket.js          # Cesta de cotação
│   │   │   └── stats.js           # Estatísticas
│   │   └── services/
│   │       └── sefazService.js    # Integração API SEFAZ + cache
│   ├── data/
│   │   └── mockData.js            # Dados simulados realistas
│   └── .env                       # Configuração (token, porta)
│
└── frontend/
    └── src/
        ├── main.jsx               # Entry point React
        ├── App.jsx                # Router principal
        ├── index.css              # Design system completo
        ├── pages/
        │   ├── HomePage.jsx       # Busca + histórico
        │   ├── ResultsPage.jsx    # Lista de resultados
        │   ├── ProductDetailPage.jsx  # Detalhe + gráfico
        │   ├── BasketPage.jsx     # Cesta + comparação
        │   └── DashboardPage.jsx  # Dashboard
        ├── components/
        │   ├── BottomNav.jsx      # Navegação inferior
        │   ├── ProductCard.jsx    # Card de produto
        │   └── Icons.jsx          # Ícones SVG
        ├── hooks/
        │   └── useBasket.jsx      # Context da cesta
        └── utils/
            ├── api.js             # Cliente da API
            └── format.js          # Formatadores BRL, datas
```

---

## ⚙️ Configurações

### backend/.env

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3001` | Porta do backend |
| `SEFAZ_APP_TOKEN` | `SEU_TOKEN_AQUI` | Token da SEFAZ/AL |
| `SEFAZ_API_URL` | URL oficial | Endpoint base da API |
| `CACHE_TTL` | `300` | Segundos de cache (5 min) |
| `MUNICIPIO_IBGE` | `2704302` | Código IBGE de Maceió |

---

## 🎨 Design System

- **Fonte:** DM Sans (legível, moderna, mobile-friendly)
- **Fundo:** `#F0F4FF` – azul-acinzentado suave
- **Primária:** `#2563EB` – azul profissional
- **Economia:** `#16A34A` – verde destaque
- **Alerta:** `#DC2626` – vermelho
- **Cards:** branco com sombras sutis
- **Mobile-first:** max-width 480px, botões grandes (48px+), espaçamentos confortáveis

---

## 🛡️ Funcionalidades Técnicas

- **Cache em memória** – evita chamadas repetidas à SEFAZ (TTL configurável)
- **Rate limiting** – 60 req/min por IP
- **Debounce** na busca (300ms)
- **Fallback automático** para dados simulados se a API não responder
- **Proxy Vite** – frontend chama `/api/*` → backend `localhost:3001`
- **CORS configurado** para desenvolvimento local

---

## 📋 Notas de Produção

Para deploy em servidor:

1. Build do frontend:
   ```bash
   cd frontend && npm run build
   ```
   Os arquivos ficam em `frontend/dist/` – sirva com nginx ou similar.

2. Backend: use PM2 ou similar:
   ```bash
   npm install -g pm2
   cd backend && pm2 start src/server.js --name farmapreco
   ```

3. Configure variáveis de ambiente no servidor (não commite o `.env` com o token real).

---

## 🔐 Obtendo o Token SEFAZ

O token `AppToken` é fornecido pela SEFAZ Alagoas mediante solicitação. Entre em contato com a SEFAZ/AL para obter credenciais de acesso à API pública do **Economiza Alagoas**.

Enquanto não tiver o token, o sistema funciona 100% com dados simulados.

---

Desenvolvido para uso interno farmacêutico – Maceió/AL

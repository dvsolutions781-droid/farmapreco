// Estabelecimentos base com bairro e cidade separados
const ESTABS = {
  E01: { nome: "FARMÁCIA POPULAR CENTRO",    cnpj: "12.345.678/0001-01", bairro: "Centro",       cidade: "Maceió",   endereco: "Av. Fernandes Lima, 1250 - Centro, Maceió" },
  E02: { nome: "DROGARIA SÃO PAULO",         cnpj: "12.345.678/0001-02", bairro: "Farol",         cidade: "Maceió",   endereco: "R. do Comércio, 450 - Farol, Maceió" },
  E03: { nome: "ULTRAFARMA MACEIÓ",          cnpj: "12.345.678/0001-03", bairro: "Cruz das Almas",cidade: "Maceió",   endereco: "Av. Gustavo Paiva, 2800 - Cruz das Almas, Maceió" },
  E04: { nome: "FARMÁCIA NOSSA SAÚDE",       cnpj: "12.345.678/0001-04", bairro: "Jaraguá",       cidade: "Maceió",   endereco: "R. Sá e Albuquerque, 80 - Jaraguá, Maceió" },
  E05: { nome: "DROGÃO SUPER PONTA VERDE",   cnpj: "12.345.678/0001-05", bairro: "Ponta Verde",   cidade: "Maceió",   endereco: "Av. Sandoval Arroxelas, 600 - Ponta Verde, Maceió" },
  E06: { nome: "FARMÁCIA BONFIM",            cnpj: "12.345.678/0001-06", bairro: "Tabuleiro",     cidade: "Maceió",   endereco: "Av. Durval de Góes Monteiro, 3420 - Tabuleiro, Maceió" },
  E07: { nome: "DROGARIA JATIÚCA",           cnpj: "12.345.678/0001-07", bairro: "Jatiúca",       cidade: "Maceió",   endereco: "Av. Álvaro Otacílio, 3000 - Jatiúca, Maceió" },
  E08: { nome: "FARMÁCIA PAJUÇARA",          cnpj: "12.345.678/0001-08", bairro: "Pajuçara",      cidade: "Maceió",   endereco: "R. Jangadeiros Alagoanos, 120 - Pajuçara, Maceió" },
  E09: { nome: "DROGARIA BENEDITO BENTES",   cnpj: "12.345.678/0001-09", bairro: "Benedito Bentes",cidade: "Maceió",  endereco: "Av. Benedito Bentes, 1520 - Benedito Bentes, Maceió" },
  E10: { nome: "FARMÁCIA SANTA LÚCIA",       cnpj: "12.345.678/0001-10", bairro: "Feitosa",       cidade: "Maceió",   endereco: "Av. Menino Marcelo, 890 - Feitosa, Maceió" },
  E11: { nome: "DROGARIA ARAPIRACA CENTER",  cnpj: "12.345.678/0002-01", bairro: "Centro",        cidade: "Arapiraca", endereco: "R. Comendador Leão, 540 - Centro, Arapiraca" },
  E12: { nome: "FARMÁCIA ARAPIRACA SAÚDE",   cnpj: "12.345.678/0002-02", bairro: "Cacimbas",      cidade: "Arapiraca", endereco: "Av. Governador Divaldo Suruagy, 710 - Cacimbas, Arapiraca" },
  E13: { nome: "ULTRAFARMA ARAPIRACA",       cnpj: "12.345.678/0002-03", bairro: "Centro",        cidade: "Arapiraca", endereco: "R. Ernesto Gurgel, 200 - Centro, Arapiraca" },
};

function est(id, preco, data) {
  return { ...ESTABS[id], preco, data };
}

const mockProducts = {
  DIPIRONA: {
    query: "DIPIRONA",
    total: 8,
    produtos: [
      {
        gtin: "7896004724032",
        descricao: "DIPIRONA SÓDICA 500MG C/20 COMPRIMIDOS - GENÉRICO",
        estabelecimentos: [
          est('E01', 4.99,  "2024-01-15T10:30:00"),
          est('E02', 6.50,  "2024-01-15T09:15:00"),
          est('E03', 7.20,  "2024-01-15T11:00:00"),
          est('E04', 8.90,  "2024-01-14T16:45:00"),
          est('E05', 10.50, "2024-01-14T14:20:00"),
          est('E06', 12.90, "2024-01-13T10:00:00"),
          est('E11', 5.80,  "2024-01-15T08:00:00"),
          est('E12', 7.90,  "2024-01-14T12:00:00"),
        ]
      },
      {
        gtin: "7891058009321",
        descricao: "DIPIRONA MONOIDRATADA 500MG/ML SOLUÇÃO ORAL 10ML",
        estabelecimentos: [
          est('E01', 3.50, "2024-01-15T10:30:00"),
          est('E02', 5.20, "2024-01-15T09:15:00"),
          est('E03', 8.90, "2024-01-15T11:00:00"),
          est('E07', 4.80, "2024-01-15T08:30:00"),
          est('E09', 6.10, "2024-01-14T15:00:00"),
        ]
      }
    ]
  },
  AMOXICILINA: {
    query: "AMOXICILINA",
    total: 5,
    produtos: [
      {
        gtin: "7896004725039",
        descricao: "AMOXICILINA 500MG C/21 CÁPSULAS - GENÉRICO",
        estabelecimentos: [
          est('E01', 12.50, "2024-01-15T10:30:00"),
          est('E03', 15.90, "2024-01-15T11:00:00"),
          est('E05', 21.00, "2024-01-14T14:20:00"),
          est('E06', 28.90, "2024-01-13T10:00:00"),
          est('E08', 14.20, "2024-01-15T09:00:00"),
          est('E10', 17.50, "2024-01-14T13:00:00"),
          est('E11', 13.00, "2024-01-15T07:30:00"),
          est('E13', 16.80, "2024-01-14T11:00:00"),
        ]
      }
    ]
  },
  OMEPRAZOL: {
    query: "OMEPRAZOL",
    total: 6,
    produtos: [
      {
        gtin: "7896005410086",
        descricao: "OMEPRAZOL 20MG C/28 CÁPSULAS - GENÉRICO",
        estabelecimentos: [
          est('E01', 8.90,  "2024-01-15T10:30:00"),
          est('E02', 11.40, "2024-01-15T09:15:00"),
          est('E03', 14.90, "2024-01-15T11:00:00"),
          est('E04', 18.00, "2024-01-14T16:45:00"),
          est('E05', 22.50, "2024-01-14T14:20:00"),
          est('E07', 10.20, "2024-01-15T08:30:00"),
          est('E09', 13.40, "2024-01-14T10:00:00"),
          est('E12', 11.90, "2024-01-15T07:00:00"),
        ]
      }
    ]
  },
  LOSARTANA: {
    query: "LOSARTANA",
    total: 4,
    produtos: [
      {
        gtin: "7896714249878",
        descricao: "LOSARTANA POTÁSSICA 50MG C/30 COMPRIMIDOS",
        estabelecimentos: [
          est('E01', 15.20, "2024-01-15T10:30:00"),
          est('E03', 22.00, "2024-01-15T11:00:00"),
          est('E05', 28.90, "2024-01-14T14:20:00"),
          est('E06', 35.00, "2024-01-13T10:00:00"),
          est('E08', 18.50, "2024-01-15T09:00:00"),
          est('E11', 16.90, "2024-01-15T07:30:00"),
        ]
      }
    ]
  },
  IBUPROFENO: {
    query: "IBUPROFENO",
    total: 7,
    produtos: [
      {
        gtin: "7896004724018",
        descricao: "IBUPROFENO 600MG C/20 COMPRIMIDOS REVESTIDOS",
        estabelecimentos: [
          est('E01', 9.80,  "2024-01-15T10:30:00"),
          est('E02', 13.50, "2024-01-15T09:15:00"),
          est('E03', 16.20, "2024-01-15T11:00:00"),
          est('E04', 19.00, "2024-01-14T16:45:00"),
          est('E05', 24.90, "2024-01-14T14:20:00"),
          est('E07', 11.80, "2024-01-15T08:30:00"),
          est('E10', 14.60, "2024-01-14T13:00:00"),
          est('E13', 12.90, "2024-01-15T06:00:00"),
        ]
      }
    ]
  }
};

function getMockData(query) {
  if (!query) return null;
  const upperQuery = query.toUpperCase().trim();
  
  // Direct match
  for (const key of Object.keys(mockProducts)) {
    if (upperQuery.includes(key) || key.includes(upperQuery)) {
      return mockProducts[key];
    }
  }
  
  // Generic fallback
  return {
    query,
    total: 3,
    produtos: [
      {
        gtin: "0000000000000",
        descricao: `${query.toUpperCase()} - PRODUTO GENÉRICO 500MG`,
        precoMinimo: 12.00,
        precoMaximo: 35.00,
        precoMedio: 22.50,
        estabelecimentos: [
          { nome: "FARMÁCIA POPULAR CENTRO", cnpj: "12.345.678/0001-01", endereco: "Av. Fernandes Lima, 1250 - Centro", preco: 12.00, data: new Date().toISOString() },
          { nome: "ULTRAFARMA MACEIÓ", cnpj: "12.345.678/0001-03", endereco: "Av. Gustavo Paiva, 2800 - Cruz das Almas", preco: 22.50, data: new Date().toISOString() },
          { nome: "DROGÃO SUPER", cnpj: "12.345.678/0001-05", endereco: "Av. Sandoval Arroxelas, 600 - Ponta Verde", preco: 35.00, data: new Date().toISOString() }
        ]
      }
    ]
  };
}

module.exports = { getMockData };

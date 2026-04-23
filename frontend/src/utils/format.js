export function formatBRL(value) {
  if (value == null || isNaN(value)) return 'R$ -';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatDateShort(iso) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(iso));
}

export function calcEconomy(min, max) {
  if (!max || max === 0) return 0;
  return ((max - min) / max * 100).toFixed(0);
}

export function abbreviateName(name, maxLen = 28) {
  if (!name) return '';
  return name.length > maxLen ? name.substring(0, maxLen) + '…' : name;
}

export function truncateProd(desc, maxLen = 40) {
  if (!desc) return '';
  return desc.length > maxLen ? desc.substring(0, maxLen) + '…' : desc;
}

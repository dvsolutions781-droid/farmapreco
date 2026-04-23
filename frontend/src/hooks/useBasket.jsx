import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const BasketContext = createContext(null);

export function BasketProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getBasket();
      setItems(data.items || []);
    } catch {}
  }, []);

  useEffect(() => { refresh(); }, []);

  const add = async (product) => {
    setLoading(true);
    try {
      await api.addToBasket(product);
      await refresh();
      return true;
    } catch (err) {
      if (err.message.includes('já está')) return 'duplicate';
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    setLoading(true);
    try {
      await api.removeFromBasket(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    setLoading(true);
    try {
      await api.clearBasket();
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const isInBasket = (gtin, descricao) =>
    items.some(i => (gtin && i.gtin === gtin) || i.descricao === descricao);

  return (
    <BasketContext.Provider value={{ items, loading, add, remove, clear, isInBasket, count: items.length, refresh }}>
      {children}
    </BasketContext.Provider>
  );
}

export const useBasket = () => useContext(BasketContext);

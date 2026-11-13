import React, { createContext, useContext, useMemo, useReducer } from 'react';

const CartContext = createContext(null);

// state: { items: { [productId]: { product, quantity } }, delivery: null | { lat, lng, address, distanceMiles, feeCents } }
function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const current = state.items[product.id]?.quantity || 0;
      if (current >= product.stock) return state;
      return { ...state, items: { ...state.items, [product.id]: { product, quantity: current + 1 } } };
    }
    case 'decrement': {
      const line = state.items[action.id];
      if (!line) return state;
      const items = { ...state.items };
      if (line.quantity <= 1) delete items[action.id];
      else items[action.id] = { ...line, quantity: line.quantity - 1 };
      return { ...state, items };
    }
    case 'remove': {
      const items = { ...state.items };
      delete items[action.id];
      return { ...state, items };
    }
    case 'clear':
      return { ...state, items: {} };
    case 'setDelivery':
      return { ...state, delivery: action.delivery };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: {}, delivery: null });

  const value = useMemo(() => {
    const lines = Object.values(state.items);
    return {
      lines,
      delivery: state.delivery,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: lines.reduce((n, l) => n + l.quantity * l.product.priceCents, 0),
      quantityOf: (id) => state.items[id]?.quantity || 0,
      add: (product) => dispatch({ type: 'add', product }),
      decrement: (id) => dispatch({ type: 'decrement', id }),
      remove: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
      setDelivery: (delivery) => dispatch({ type: 'setDelivery', delivery }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

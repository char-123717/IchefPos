import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'ichef-cart';

function loadCart() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function cartReducer(state, action) {
  let newState;

  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.findIndex(
        item => item.menuItem._id === action.payload._id
      );

      if (existingIndex >= 0) {
        newState = state.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newState = [...state, { menuItem: action.payload, quantity: 1 }];
      }
      break;
    }

    case 'REMOVE_ITEM': {
      const existingIndex = state.findIndex(
        item => item.menuItem._id === action.payload
      );

      if (existingIndex >= 0) {
        if (state[existingIndex].quantity > 1) {
          newState = state.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          newState = state.filter((_, index) => index !== existingIndex);
        }
      } else {
        newState = state;
      }
      break;
    }

    case 'CLEAR':
      newState = [];
      break;

    default:
      return state;
  }

  saveCart(newState);
  return newState;
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], loadCart);

  const addItem = (menuItem) => dispatch({ type: 'ADD_ITEM', payload: menuItem });
  const removeItem = (menuItemId) => dispatch({ type: 'REMOVE_ITEM', payload: menuItemId });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      totalPrice,
      addItem,
      removeItem,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

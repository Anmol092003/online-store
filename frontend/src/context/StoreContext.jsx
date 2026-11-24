import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bazaar_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('bazaar_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bazaar_cart', JSON.stringify(cart));
  }, [cart]);

  const loginUser = (authData) => {
    localStorage.setItem('bazaar_token', authData.token);
    localStorage.setItem('bazaar_user', JSON.stringify(authData.user));
    setUser(authData.user);
  };

  const logoutUser = () => {
    localStorage.removeItem('bazaar_token');
    localStorage.removeItem('bazaar_user');
    setUser(null);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.id === item.id);
      if (existing) {
        return prev.map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, quantity: x.quantity + delta } : x))
        .filter((x) => x.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
        cart,
        addToCart,
        updateCartQty,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);

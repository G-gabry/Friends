import { useState, useEffect } from "react";

export default function Cart() {
  const cartItemsInLS = JSON.parse(localStorage.getItem("cartItemsInLS")) || [];
  
  // Patch old items missing cartItemId
  const patchedCartItems = cartItemsInLS.map(item => ({
    ...item,
    cartItemId: item.cartItemId || (item.id ? `${item.id}-${item.size || "default"}-${item.color || "default"}` : `pending-${Date.now()}`)
  }));

  const [cartItems, setCartItems] = useState(patchedCartItems);
  
  // Only count fully resolved items for total pricing metrics
  const countOfItems = cartItems.filter(i => !i.isPending).reduce((total, item) => total + item.count, 0);
  const subTotal = cartItems.filter(i => !i.isPending).reduce(
    (total, item) => total + item.price * item.count,
    0,
  );

  useEffect(() => {
    localStorage.setItem("cartItemsInLS", JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(product, forcedSize, forcedColor) {
    const size = forcedSize || product.size || "default";
    const color = forcedColor || product.color || "default";
    const cartItemId = `${product.id}-${size}-${color}`;
    
    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        if (existing.count < product.stock_quantity) {
          return prev.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, count: item.count + 1 }
              : item
          );
        }
        return prev;
      }
      return [...prev, { ...product, cartItemId, size: product.size, color: product.color, count: 1 }];
    });
  }

  // Tossing an unresolved product group directly into the cart
  function addPendingGroup(group) {
     const pendingId = `pending-${group.name}-${Date.now()}`;
     setCartItems((prev) => [
        ...prev, 
        { ...group, cartItemId: pendingId, isPending: true, count: 1 }
     ]);
  }

  // Elevate a pending group into a rigid final cart item
  function resolvePendingGroup(pendingCartItemId, resolvedVariant) {
      const size = resolvedVariant.size || "default";
      const color = resolvedVariant.color || "default";
      const finalCartItemId = `${resolvedVariant.id}-${size}-${color}`;

      setCartItems((prev) => {
         // Is this exact variant already in the cart somewhere else?
         const existingFinalIndex = prev.findIndex(item => item.cartItemId === finalCartItemId);
         
         const newCart = prev.filter(item => item.cartItemId !== pendingCartItemId); // Remove pending block
         
         if (existingFinalIndex >= 0) {
            // Fold it into the existing cart line
            newCart[existingFinalIndex] = {
               ...newCart[existingFinalIndex],
               count: Math.min(newCart[existingFinalIndex].count + 1, resolvedVariant.stock_quantity)
            };
            return newCart;
         } else {
            // Create the new rigid item where the pending item was
            return [...newCart, { ...resolvedVariant, cartItemId: finalCartItemId, size: resolvedVariant.size, color: resolvedVariant.color, count: 1, isPending: false }];
         }
      });
  }

  function increaseCount(cartItemId, stock_quantity) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId && item.count < stock_quantity
          ? { ...item, count: item.count + 1 }
          : item,
      ),
    );
  }

  function addNotes(cartItemId, notes) {
    setCartItems((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, notes } : item)),
    );
  }

  function decreaseCount(cartItemId) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId && item.count > 1
          ? { ...item, count: item.count - 1 }
          : item,
      ),
    );
  }

  function removeFromCart(cartItemId) {
    setCartItems((prev) =>
      prev.filter((item) => {
        return item.cartItemId !== cartItemId;
      }),
    );
  }

  return {
    cartItems,
    setCartItems,
    countOfItems,
    subTotal,
    addToCart,
    addPendingGroup,
    resolvePendingGroup,
    increaseCount,
    decreaseCount,
    removeFromCart,
    addNotes,
  };
}

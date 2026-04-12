import { useState, useEffect } from "react";

export default function Cart() {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cartItemsInLS"));
      if (Array.isArray(saved)) return saved;
    } catch { }
    return [];
  });

  // Calculate totals across all pieces inside all cart groups
  const countOfItems = cartItems.reduce((total, item) => total + (item.pieces?.length || 0), 0);
  const subTotal = cartItems.reduce(
    (total, item) => total + (item.price || 0) * (item.pieces?.length || 0),
    0
  );

  useEffect(() => {
    localStorage.setItem("cartItemsInLS", JSON.stringify(cartItems));
  }, [cartItems]);

  // Adds a product group to the cart (or adds a new piece row if already in cart)
  function addGroupToCart(group) {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.cartItemId === group.name);
      const newPiece = { id: Date.now().toString() + Math.random(), variant_id: null, color: "", size: "" };

      // Auto-resolve if there's only 1 variant available
      if (group.variants.length === 1 && group.variants[0].stock_quantity > 0) {
        newPiece.variant_id = group.variants[0].id;
        newPiece.color = group.variants[0].color || "";
        newPiece.size = group.variants[0].size || "";
      }

      if (existingIdx >= 0) {
        // Group exists, just append a new row
        const newCart = [...prev];
        const item = newCart[existingIdx];
        const totalStock = item.variants.reduce((acc, v) => acc + v.stock_quantity, 0);

        if (item.pieces.length < totalStock) {
          newCart[existingIdx] = { ...item, pieces: [...item.pieces, newPiece] };
        }
        return newCart;
      }

      return [...prev, {
        cartItemId: group.name,
        name: group.name,
        price: group.price,
        image_url: group.variants[0]?.image_url,
        variants: group.variants,
        pieces: [newPiece]
      }];
    });
  }

  // Bind a specific selected variant (color/size) to a specific row
  function updatePiece(cartItemId, pieceId, updates) {
    setCartItems((prev) =>
      prev.map(item => {
        if (item.cartItemId !== cartItemId) return item;
        return {
          ...item,
          pieces: item.pieces.map(p => p.id === pieceId ? { ...p, ...updates } : p)
        };
      })
    );
  }

  function increaseCount(cartItemId) {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIdx < 0) return prev;

      const newCart = [...prev];
      const item = newCart[existingIdx];
      const totalStock = item.variants.reduce((acc, v) => acc + v.stock_quantity, 0);

      if (item.pieces.length < totalStock) {
        const newPiece = { id: Date.now().toString() + Math.random(), variant_id: null, color: "", size: "" };
        if (item.variants.length === 1 && item.variants[0].stock_quantity > 0) {
          newPiece.variant_id = item.variants[0].id;
          newPiece.color = item.variants[0].color || "";
          newPiece.size = item.variants[0].size || "";
        }
        newCart[existingIdx] = { ...item, pieces: [...item.pieces, newPiece] };
      }
      return newCart;
    });
  }

  function decreaseCount(cartItemId) {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId && item.pieces.length > 1) {
          // Remove the last piece
          return { ...item, pieces: item.pieces.slice(0, -1) };
        }
        return item;
      })
    );
  }

  function removeFromCart(cartItemId) {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }

  function clearCart() {
    setCartItems([]);
  }

  return {
    cartItems,
    setCartItems,
    countOfItems,
    subTotal,
    addGroupToCart,
    updatePiece,
    increaseCount,
    decreaseCount,
    removeFromCart,
    clearCart
  };
}

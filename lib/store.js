import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      cart: { items: [] },
      wishlist: [], // added wishlist state
      isHydrated: false, // track hydration
      notification: null, // notification state

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false, cart: { items: [] }, wishlist: [] });
      },
      setCart: (cart) => set({ cart }),

      // Notification action
      showNotification: (msg) => {
        set({ notification: msg });
        setTimeout(() => set({ notification: null }), 3000);
      },

      // Wishlist actions
      toggleWishlist: (product) => {
        const wishlist = [...(get().wishlist || [])];
        const index = wishlist.findIndex((p) => p._id === product._id);
        if (index > -1) {
          wishlist.splice(index, 1); // remove if exists
        } else {
          wishlist.push(product); // add if not exists
        }
        set({ wishlist });
      },

      // Call this after persist hydrates
      setHydrated: (val) => set({ isHydrated: val }),

      // Handles populated object, id string, or null legacy cart item shapes.
      getCartItemProductId: (item) => {
        if (!item) return null;
        const raw = item.productId;
        if (!raw) return null;
        if (typeof raw === 'string') return raw;
        if (typeof raw === 'object') {
          return raw._id ? String(raw._id) : null;
        }
        return null;
      },

      addToCartMock: (product, quantity = 1) => {
        const items = [...(get().cart?.items || [])];
        const index = items.findIndex((i) => {
          const productId = get().getCartItemProductId(i);
          return productId && productId === String(product._id);
        });
        if (index > -1) items[index].quantity += quantity;
        else items.push({ productId: product, quantity });
        set({ cart: { ...get().cart, items } });
        get().showNotification(`Added ${product.name} to cart!`);
      },

      updateQuantityMock: (productId, delta) => {
        const items = [...(get().cart?.items || [])];
        const targetId = String(productId);
        const index = items.findIndex((i) => {
          const itemId = get().getCartItemProductId(i);
          return itemId && itemId === targetId;
        });
        if (index > -1) {
          const newQty = items[index].quantity + delta;
          if (newQty > 0) {
            items[index].quantity = newQty;
          } else {
            items.splice(index, 1); // Remove if 0
          }
        }
        set({ cart: { ...get().cart, items } });
      },

      removeFromCartMock: (productId) =>
        set((state) => {
          const targetId = String(productId);
          const items =
            state.cart?.items?.filter((i) => {
              const raw = i?.productId;
              if (!raw) return false;
              const itemId = typeof raw === 'object' ? String(raw._id || '') : String(raw);
              return itemId && itemId !== targetId;
            }) ||
            [];
          return { cart: { ...state.cart, items } };
        }),
    }),
    {
      name: 'luxeshop-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        wishlist: state.wishlist, // persist wishlist
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydration flag when Zustand finishes loading from localStorage
        state?.setHydrated(true);
      },
    }
  )
);

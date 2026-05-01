import { createContext, useContext, useState, ReactNode, useEffect } from "react";

const CART_STORAGE_KEY = "vaija-cart";

export interface CartOption {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
  establishmentId?: string;
  options?: CartOption[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  establishmentId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Erro ao carregar carrinho:", error);
  }
  return [];
};

const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Erro ao salvar carrinho:", error);
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());

  // Salva no localStorage sempre que os itens mudarem
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const itemKey = JSON.stringify(item.options?.sort((a, b) => a.id.localeCompare(b.id)) || []);
      const existing = prev.find((i) => 
        i.id === item.id && 
        JSON.stringify(i.options?.sort((a, b) => a.id.localeCompare(b.id)) || []) === itemKey
      );
      
      if (existing) {
        return prev.map((i) =>
          (i.id === item.id && 
           JSON.stringify(i.options?.sort((a, b) => a.id.localeCompare(b.id)) || []) === itemKey) 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number, optionsJson?: string) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => {
        if (i.id !== id) return true;
        if (!optionsJson) return false;
        return JSON.stringify(i.options?.sort((a, b) => a.id.localeCompare(b.id)) || []) !== optionsJson;
      }));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        const iOptionsJson = JSON.stringify(i.options?.sort((a, b) => a.id.localeCompare(b.id)) || []);
        if (i.id === id && (!optionsJson || iOptionsJson === optionsJson)) {
          return { ...i, quantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => {
    const optionsTotal = item.options?.reduce((optSum, opt) => optSum + opt.price, 0) || 0;
    return sum + (item.price + optionsTotal) * item.quantity;
  }, 0);

  // Get establishment ID from first item (all items should be from same establishment)
  const establishmentId = items.length > 0 ? items[0].establishmentId || null : null;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, establishmentId }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

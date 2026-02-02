import { 
  UtensilsCrossed, 
  ShoppingCart, 
  Pill, 
  Gift, 
  Coffee, 
  IceCream, 
  Pizza, 
  Sandwich,
  Wine,
  Croissant,
  Beef,
  Flower2,
  Dog,
  Zap,
  Shirt,
  FileText,
  Store,
  LucideIcon
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

// Categories for display on homepage and category pages
export const DISPLAY_CATEGORIES: Category[] = [
  { id: "restaurant", name: "Restaurantes", icon: UtensilsCrossed, color: "bg-primary/10 text-primary" },
  { id: "market", name: "Mercados", icon: ShoppingCart, color: "bg-success/10 text-success" },
  { id: "pharmacy", name: "Farmácias", icon: Pill, color: "bg-info/10 text-info" },
  { id: "fast-food", name: "Lanches", icon: Sandwich, color: "bg-yellow-100 text-yellow-600" },
  { id: "pizza", name: "Pizzarias", icon: Pizza, color: "bg-orange-100 text-orange-600" },
  { id: "drinks", name: "Bebidas", icon: Wine, color: "bg-purple-100 text-purple-600" },
  { id: "bakery", name: "Padarias", icon: Croissant, color: "bg-amber-100 text-amber-600" },
  { id: "coffee", name: "Cafeteria", icon: Coffee, color: "bg-brown-100 text-amber-700" },
  { id: "ice-cream", name: "Sorvetes", icon: IceCream, color: "bg-pink-100 text-pink-600" },
  { id: "butcher", name: "Açougue", icon: Beef, color: "bg-red-100 text-red-600" },
  { id: "florist", name: "Floricultura", icon: Flower2, color: "bg-rose-100 text-rose-600" },
  { id: "gifts", name: "Presentes", icon: Gift, color: "bg-warning/10 text-warning" },
  { id: "pet-shop", name: "Pet Shop", icon: Dog, color: "bg-cyan-100 text-cyan-600" },
  { id: "convenience", name: "Conveniência", icon: Store, color: "bg-slate-100 text-slate-600" },
  { id: "electronics", name: "Eletrônicos", icon: Zap, color: "bg-blue-100 text-blue-600" },
  { id: "laundry", name: "Lavanderia", icon: Shirt, color: "bg-sky-100 text-sky-600" },
  { id: "documents", name: "Documentos", icon: FileText, color: "bg-gray-100 text-gray-600" },
];

// Categories for establishment registration forms (includes subcategories)
export const ESTABLISHMENT_CATEGORIES = [
  // Main categories (matching display categories)
  { value: "restaurant", label: "Restaurante" },
  { value: "market", label: "Mercado" },
  { value: "pharmacy", label: "Farmácia" },
  { value: "fast-food", label: "Lanches/Fast Food" },
  { value: "pizza", label: "Pizzaria" },
  { value: "drinks", label: "Bebidas/Adega" },
  { value: "bakery", label: "Padaria" },
  { value: "coffee", label: "Cafeteria" },
  { value: "ice-cream", label: "Sorveteria" },
  { value: "butcher", label: "Açougue" },
  { value: "florist", label: "Floricultura" },
  { value: "gifts", label: "Presentes" },
  { value: "pet-shop", label: "Pet Shop" },
  { value: "convenience", label: "Conveniência" },
  { value: "electronics", label: "Eletrônicos" },
  { value: "laundry", label: "Lavanderia" },
  { value: "documents", label: "Documentos/Entregas" },
  // Subcategories for restaurants
  { value: "hamburgueria", label: "Hamburgueria" },
  { value: "japonesa", label: "Comida Japonesa" },
  { value: "brasileira", label: "Comida Brasileira" },
  { value: "italiana", label: "Comida Italiana" },
  { value: "chinesa", label: "Comida Chinesa" },
  { value: "mexicana", label: "Comida Mexicana" },
  { value: "arabe", label: "Comida Árabe" },
  { value: "acai", label: "Açaí" },
  { value: "doceria", label: "Doceria" },
  { value: "saudavel", label: "Saudável/Fit" },
  { value: "vegano", label: "Vegano/Vegetariano" },
  { value: "marmita", label: "Marmitex" },
  { value: "outros", label: "Outros" },
];

// Get category info by ID
export const getCategoryById = (id: string): Category | undefined => {
  return DISPLAY_CATEGORIES.find(cat => cat.id === id);
};

// Get establishment category label by value
export const getEstablishmentCategoryLabel = (value: string): string => {
  const category = ESTABLISHMENT_CATEGORIES.find(cat => cat.value === value);
  return category?.label || value;
};

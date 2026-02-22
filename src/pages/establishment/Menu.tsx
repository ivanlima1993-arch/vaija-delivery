import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  FolderOpen,
  X,
  Image,
  Menu,
  DollarSign,
  UserPlus,
} from "lucide-react";
import LinkDriverDialog from "@/components/establishment/LinkDriverDialog";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["product_categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

const EstablishmentMenu = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isEstablishment } = useAuth();
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    image_url: "",
    category_id: "",
    is_available: true,
    is_featured: false,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isEstablishment)) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, isEstablishment, navigate]);

  const fetchData = async () => {
    try {
      const { data: estab } = await supabase
        .from("establishments")
        .select("id")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (estab) {
        setEstablishmentId(estab.id);
        await Promise.all([
          fetchCategories(estab.id),
          fetchProducts(estab.id),
        ]);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (estabId: string) => {
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .eq("establishment_id", estabId)
      .order("sort_order");
    if (data) setCategories(data);
  };

  const fetchProducts = async (estabId: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("establishment_id", estabId)
      .order("sort_order");
    if (data) setProducts(data);
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    if (!establishmentId) return;

    try {
      if (editingCategory) {
        await supabase
          .from("product_categories")
          .update({
            name: categoryForm.name,
            description: categoryForm.description,
          })
          .eq("id", editingCategory.id);
        toast.success("Categoria atualizada!");
      } else {
        await supabase.from("product_categories").insert({
          establishment_id: establishmentId,
          name: categoryForm.name,
          description: categoryForm.description,
        });
        toast.success("Categoria criada!");
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
      fetchCategories(establishmentId);
    } catch (error) {
      toast.error("Erro ao salvar categoria");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    
    await supabase.from("product_categories").delete().eq("id", id);
    toast.success("Categoria excluída");
    if (establishmentId) fetchCategories(establishmentId);
  };

  // Product CRUD
  const handleSaveProduct = async () => {
    if (!establishmentId) return;

    try {
      const productData = {
        establishment_id: establishmentId,
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
        image_url: productForm.image_url || null,
        category_id: productForm.category_id || null,
        is_available: productForm.is_available,
        is_featured: productForm.is_featured,
      };

      if (editingProduct) {
        await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        toast.success("Produto atualizado!");
      } else {
        await supabase.from("products").insert(productData);
        toast.success("Produto criado!");
      }
      
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        original_price: "",
        image_url: "",
        category_id: "",
        is_available: true,
        is_featured: false,
      });
      fetchProducts(establishmentId);
    } catch (error) {
      toast.error("Erro ao salvar produto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produto excluído");
    if (establishmentId) fetchProducts(establishmentId);
  };

  const toggleProductAvailability = async (product: Product) => {
    await supabase
      .from("products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);
    
    if (establishmentId) fetchProducts(establishmentId);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || "" });
    setShowCategoryModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : "",
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      is_available: product.is_available,
      is_featured: product.is_featured,
    });
    setShowProductModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Cardápio</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setLinkDialogOpen(true)}
                className="hidden sm:flex gap-2"
                size="sm"
              >
                <UserPlus className="w-4 h-4" />
                Vincular Entregador
              </Button>
              <Button 
                onClick={() => setLinkDialogOpen(true)}
                className="sm:hidden"
                size="icon"
                variant="outline"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
        {/* Categories Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Categorias
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: "", description: "" });
                  setShowCategoryModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Categoria
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma categoria criada
              </p>
            ) : (
              <div className="grid gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos ({products.length})
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: "",
                    description: "",
                    price: "",
                    original_price: "",
                    image_url: "",
                    category_id: "",
                    is_available: true,
                    is_featured: false,
                  });
                  setShowProductModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo Produto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto criado
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const category = categories.find((c) => c.id === product.category_id);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`bg-muted/50 rounded-xl overflow-hidden ${
                        !product.is_available ? "opacity-60" : ""
                      }`}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted flex items-center justify-center">
                          <Image className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            {category && (
                              <Badge variant="outline" className="text-xs">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {product.is_featured && (
                              <Badge variant="default" className="text-xs">
                                Destaque
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-primary">
                            R$ {Number(product.price).toFixed(2)}
                          </span>
                          {product.original_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              R$ {Number(product.original_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.is_available}
                              onCheckedChange={() => toggleProductAvailability(product)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {product.is_available ? "Disponível" : "Indisponível"}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditProduct(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </main>

      <LinkDriverDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        establishmentId={establishmentId || ""}
        onSuccess={() => {
          toast.success("Entregador vinculado com sucesso!");
        }}
      />


      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </h2>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Nome da Categoria</Label>
                  <Input
                    id="categoryName"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    placeholder="Ex: Lanches, Bebidas..."
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDesc">Descrição (opcional)</Label>
                  <Textarea
                    id="categoryDesc"
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    placeholder="Descrição da categoria"
                  />
                </div>
                <Button onClick={handleSaveCategory} className="w-full">
                  Salvar Categoria
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowProductModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-lg my-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName">Nome do Produto *</Label>
                  <Input
                    id="productName"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    placeholder="Ex: X-Burger"
                  />
                </div>
                
                <div>
                  <Label htmlFor="productDesc">Descrição</Label>
                  <Textarea
                    id="productDesc"
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    placeholder="Descrição do produto"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productPrice">Preço *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="productPrice"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({ ...productForm, price: e.target.value })
                        }
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="productOriginalPrice">Preço Original</Label>
                    <Input
                      id="productOriginalPrice"
                      type="number"
                      step="0.01"
                      value={productForm.original_price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, original_price: e.target.value })
                      }
                      placeholder="Para promoções"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="productImage">URL da Imagem</Label>
                  <Input
                    id="productImage"
                    value={productForm.image_url}
                    onChange={(e) =>
                      setProductForm({ ...productForm, image_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="productCategory">Categoria</Label>
                  <select
                    id="productCategory"
                    value={productForm.category_id}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category_id: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-md border bg-background"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={productForm.is_available}
                      onCheckedChange={(checked) =>
                        setProductForm({ ...productForm, is_available: checked })
                      }
                    />
                    <Label>Disponível</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={productForm.is_featured}
                      onCheckedChange={(checked) =>
                        setProductForm({ ...productForm, is_featured: checked })
                      }
                    />
                    <Label>Destaque</Label>
                  </div>
                </div>
                
                <Button
                  onClick={handleSaveProduct}
                  className="w-full"
                  disabled={!productForm.name || !productForm.price}
                >
                  Salvar Produto
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EstablishmentMenu;

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
  Search,
  Clock,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";
import LinkDriverDialog from "@/components/establishment/LinkDriverDialog";
import ImageUpload from "@/components/admin/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", sort_order: 0 });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    image_url: "",
    category_id: "",
    is_available: true,
    is_featured: false,
    preparation_time: "",
    sort_order: 0,
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
            sort_order: categoryForm.sort_order,
          })
          .eq("id", editingCategory.id);
        toast.success("Categoria atualizada!");
      } else {
        await supabase.from("product_categories").insert({
          establishment_id: establishmentId,
          name: categoryForm.name,
          description: categoryForm.description,
          sort_order: categories.length,
        });
        toast.success("Categoria criada!");
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", sort_order: 0 });
      fetchCategories(establishmentId);
    } catch (error) {
      toast.error("Erro ao salvar categoria");
    }
  };

  const moveCategory = async (id: string, direction: "up" | "down") => {
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    // Optimistic update
    setCategories(newCategories);

    try {
      // Update all categories sort_order to be safe
      const updates = newCategories.map((cat, i) => ({
        id: cat.id,
        sort_order: i,
        establishment_id: cat.establishment_id,
        name: cat.name,
      }));

      await Promise.all(
        updates.map((update) =>
          supabase
            .from("product_categories")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id)
        )
      );
      toast.success("Ordem atualizada");
    } catch (error) {
      toast.error("Erro ao atualizar ordem");
      if (establishmentId) fetchCategories(establishmentId);
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
        preparation_time: productForm.preparation_time ? parseInt(productForm.preparation_time) : null,
        sort_order: productForm.sort_order,
      };

      if (editingProduct) {
        await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        toast.success("Produto atualizado!");
      } else {
        await supabase.from("products").insert({
          ...productData,
          sort_order: products.filter(p => p.category_id === productForm.category_id).length,
        });
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
        preparation_time: "",
        sort_order: 0,
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

  const toggleCategoryAvailability = async (categoryId: string, available: boolean) => {
    if (!establishmentId) return;
    
    try {
      await supabase
        .from("products")
        .update({ is_available: available })
        .eq("category_id", categoryId)
        .eq("establishment_id", establishmentId);
      
      toast.success(available ? "Categoria ativada!" : "Categoria pausada!");
      fetchProducts(establishmentId);
    } catch (error) {
      toast.error("Erro ao atualizar categoria");
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      sort_order: category.sort_order || 0
    });
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
      is_available: product.is_available ?? true,
      is_featured: product.is_featured ?? false,
      preparation_time: product.preparation_time ? String(product.preparation_time) : "",
      sort_order: product.sort_order || 0,
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg">Gerenciador de Cardápio</h1>
                <p className="text-xs text-muted-foreground">Total: {products.length} produtos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => setLinkDialogOpen(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Entregador
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-primary/70">Produtos Ativos</p>
                  <p className="text-2xl font-black">{products.filter(p => p.is_available).length}</p>
                </div>
                <Package className="w-8 h-8 text-primary/20" />
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Pausados</p>
                  <p className="text-2xl font-black">{products.filter(p => !p.is_available).length}</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground/20" />
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-600/70">Destaques</p>
                  <p className="text-2xl font-black">{products.filter(p => p.is_featured).length}</p>
                </div>
                <Plus className="w-8 h-8 text-amber-500/20" />
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-green-600/70">Categorias</p>
                  <p className="text-2xl font-black">{categories.length}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-green-500/20" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
                <TabsTrigger value="all">Todos</TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                ))}
                <TabsTrigger value="manage_categories" className="gap-2 text-primary font-medium">
                  <FolderOpen className="w-4 h-4" />
                  Gerenciar
                </TabsTrigger>
              </TabsList>
              
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
                    category_id: activeTab !== "all" && activeTab !== "manage_categories" ? activeTab : "",
                    is_available: true,
                    is_featured: false,
                    preparation_time: "",
                    sort_order: 0,
                  });
                  setShowProductModal(true);
                }}
                className="shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo Produto
              </Button>
            </div>

            <TabsContent value="manage_categories" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      Categorias de Produtos
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: "", description: "", sort_order: 0 });
                        setShowCategoryModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Nova Categoria
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => moveCategory(category.id, "up")}
                              disabled={categories.indexOf(category) === 0}
                              className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => moveCategory(category.id, "down")}
                              disabled={categories.indexOf(category) === categories.length - 1}
                              className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px]"
                            onClick={() => toggleCategoryAvailability(category.id, true)}
                          >
                            Ativar Tudo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px]"
                            onClick={() => toggleCategoryAvailability(category.id, false)}
                          >
                            Pausar Tudo
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditCategory(category)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                        <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhuma categoria criada ainda.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {(["all", ...categories.map(c => c.id)]).includes(activeTab) && (
              <TabsContent value={activeTab} className="mt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products
                    .filter(p => activeTab === "all" || p.category_id === activeTab)
                    .filter(p => 
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((product) => {
                      const category = categories.find((c) => c.id === product.category_id);
                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`group relative bg-card border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ${
                            !product.is_available ? "grayscale-[0.5] opacity-80" : ""
                          }`}
                        >
                          <div className="aspect-video relative overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                                <Package className="w-10 h-10 text-muted-foreground/20" />
                              </div>
                            )}
                            
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                              {product.is_featured && (
                                <Badge className="bg-primary/90 backdrop-blur-sm border-none shadow-lg">
                                  Destaque
                                </Badge>
                              )}
                              {product.original_price && product.original_price > product.price && (
                                <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-none shadow-lg">
                                  -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                                </Badge>
                              )}
                              {!product.is_available && (
                                <Badge variant="secondary" className="bg-destructive/90 text-white backdrop-blur-sm border-none">
                                  Indisponível
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="mb-2">
                              {category && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full mb-1 inline-block">
                                  {category.name}
                                </span>
                              )}
                              <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                {product.name}
                              </h3>
                            </div>
                            
                            {product.description && (
                              <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                                {product.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-xl text-foreground">
                                    R$ {Number(product.price).toFixed(2)}
                                  </span>
                                  {product.original_price && (
                                    <span className="text-sm text-muted-foreground line-through opacity-60">
                                      R$ {Number(product.original_price).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {product.preparation_time && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {product.preparation_time} min
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={product.is_available ?? true}
                                  onCheckedChange={() => toggleProductAvailability(product)}
                                  className="scale-90"
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {product.is_available ? "Ativo" : "Pausado"}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => openEditProduct(product)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  
                  {products.length > 0 && products.filter(p => activeTab === "all" || p.category_id === activeTab).length === 0 && (
                    <div className="col-span-full text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
                      <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
                      <p className="text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
                    </div>
                  )}
                  
                  {products.length === 0 && (
                    <div className="col-span-full border-2 border-dashed rounded-3xl p-12 text-center bg-muted/5">
                      <Package className="w-16 h-16 text-muted-foreground/10 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Seu cardápio está vazio</h2>
                      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                        Comece adicionando seus primeiros produtos para que os clientes possam fazer pedidos.
                      </p>
                      <Button onClick={() => setShowProductModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar meu primeiro produto
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowProductModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border rounded-3xl p-6 w-full max-w-2xl my-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Preencha os detalhes do seu produto abaixo.</p>
                </div>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <ImageUpload
                    value={productForm.image_url}
                    onChange={(url) => setProductForm({ ...productForm, image_url: url || "" })}
                    folder="products"
                    label="Imagem do Produto"
                    className="w-full"
                  />
                  
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Destaque</Label>
                      <p className="text-[10px] text-muted-foreground">Aparecerá no topo do cardápio</p>
                    </div>
                    <Switch
                      checked={productForm.is_featured}
                      onCheckedChange={(checked) => setProductForm({ ...productForm, is_featured: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Disponível</Label>
                      <p className="text-[10px] text-muted-foreground">Clientes podem pedir este item</p>
                    </div>
                    <Switch
                      checked={productForm.is_available}
                      onCheckedChange={(checked) => setProductForm({ ...productForm, is_available: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Nome do Produto *</Label>
                    <Input
                      id="productName"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Ex: Burger Gourmet Super"
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="productCategory">Categoria</Label>
                    <select
                      id="productCategory"
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productPrice">Preço (R$) *</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0.00"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productOriginalPrice">De: (R$)</Label>
                      <Input
                        id="productOriginalPrice"
                        type="number"
                        step="0.01"
                        value={productForm.original_price}
                        onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                        placeholder="0.00"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="prepTime">Tempo de Preparo (minutos)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="prepTime"
                        type="number"
                        value={productForm.preparation_time}
                        onChange={(e) => setProductForm({ ...productForm, preparation_time: e.target.value })}
                        placeholder="Ex: 20"
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productDesc">Descrição</Label>
                    <Textarea
                      id="productDesc"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Ex: Pão brioche, blend 180g, queijo cheddar..."
                      className="rounded-xl min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 rounded-xl h-12"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProduct}
                  className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20"
                  disabled={!productForm.name || !productForm.price}
                >
                  {editingProduct ? "Salvar Alterações" : "Criar Produto"}
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

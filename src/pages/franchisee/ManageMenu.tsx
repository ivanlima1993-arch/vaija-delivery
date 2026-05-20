import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  FolderOpen,
  X,
  Image,
  Search,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import ProductOptionsEditor from "@/components/establishment/ProductOptionsEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["product_categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

const ManageMenu = () => {
  const { establishmentId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [establishment, setEstablishment] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Form states
  const [categoryForm, setCategoryForm] = useState({ 
    name: "", 
    description: "", 
    sort_order: 0,
    icon: ""
  });
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
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user && establishmentId) {
      verifyAndFetch();
    }
  }, [user, authLoading, establishmentId]);

  const verifyAndFetch = async () => {
    try {
      // 1. Verify if user is franchisee and has access to this establishment's city
      const { data: franchiseeCities } = await supabase
        .from("franchisee_cities")
        .select("city_id")
        .eq("franchisee_id", user!.id);

      const managedCities = franchiseeCities?.map(c => c.city_id) || [];

      const { data: estab, error: estabError } = await supabase
        .from("establishments")
        .select("*, cities(name)")
        .eq("id", establishmentId)
        .single();

      if (estabError || !estab) {
        toast.error("Estabelecimento não encontrado");
        navigate("/franqueado");
        return;
      }

      if (!managedCities.includes(estab.city_id)) {
        toast.error("Você não tem permissão para gerenciar este estabelecimento");
        navigate("/franqueado");
        return;
      }

      setEstablishment(estab);
      await Promise.all([
        fetchCategories(establishmentId!),
        fetchProducts(establishmentId!),
      ]);
    } catch (error) {
      toast.error("Erro ao carregar dados");
      navigate("/franqueado");
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
            icon: categoryForm.icon,
          })
          .eq("id", editingCategory.id);
        toast.success("Categoria atualizada!");
      } else {
        await supabase.from("product_categories").insert({
          establishment_id: establishmentId,
          name: categoryForm.name,
          description: categoryForm.description,
          sort_order: categories.length,
          icon: categoryForm.icon,
        });
        toast.success("Categoria criada!");
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", sort_order: 0, icon: "" });
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

    setCategories(newCategories);

    try {
      await Promise.all(
        newCategories.map((cat, i) =>
          supabase
            .from("product_categories")
            .update({ sort_order: i })
            .eq("id", cat.id)
        )
      );
      toast.success("Ordem atualizada");
    } catch (error) {
      toast.error("Erro ao atualizar ordem");
      fetchCategories(establishmentId!);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria? Todos os produtos ficarão sem categoria.")) return;
    await supabase.from("product_categories").delete().eq("id", id);
    toast.success("Categoria excluída");
    fetchCategories(establishmentId!);
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
    fetchProducts(establishmentId!);
  };

  const toggleProductAvailability = async (product: Product) => {
    await supabase
      .from("products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);
    fetchProducts(establishmentId!);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      sort_order: category.sort_order || 0,
      icon: (category as any).icon || "",
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
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/franqueado")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{establishment?.name}</h1>
                <Badge variant="outline">{establishment?.cities?.name}</Badge>
              </div>
              <p className="text-muted-foreground">Gestão de Cardápio (Regional)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => {
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
              }}>
                <Plus className="w-4 h-4 mr-2" /> Novo Produto
              </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
            ))}
            <TabsTrigger value="manage_categories" className="gap-2 text-primary">
              <FolderOpen className="w-4 h-4" /> Gerenciar Categorias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage_categories" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categorias</CardTitle>
                <Button size="sm" onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: "", description: "", sort_order: 0, icon: "" });
                  setShowCategoryModal(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" /> Nova Categoria
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <button onClick={() => moveCategory(category.id, "up")} disabled={categories.indexOf(category) === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveCategory(category.id, "down")} disabled={categories.indexOf(category) === categories.length - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <p className="font-bold">{category.name}</p>
                        {category.description && <p className="text-xs text-muted-foreground">{category.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="ghost" size="icon" onClick={() => openEditCategory(category)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {(["all", ...categories.map(c => c.id)]).includes(activeTab) && (
             <TabsContent value={activeTab} className="mt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products
                    .filter(p => activeTab === "all" || p.category_id === activeTab)
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((product) => (
                      <Card key={product.id} className={!product.is_available ? "opacity-75 grayscale-[0.3]" : ""}>
                         <div className="aspect-video relative overflow-hidden rounded-t-xl">
                            {product.image_url ? (
                              <img src={product.image_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                              {product.is_featured && <Badge className="bg-primary shadow-lg">Destaque</Badge>}
                              {!product.is_available && <Badge variant="secondary">Indisponível</Badge>}
                            </div>
                         </div>
                         <CardContent className="p-4 space-y-3">
                            <div>
                               <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                               <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">{product.description}</p>
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="font-black text-lg">R$ {Number(product.price).toFixed(2)}</span>
                               {product.preparation_time && (
                                 <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                   <Clock className="w-3 h-3" /> {product.preparation_time} min
                                 </div>
                               )}
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t">
                               <div className="flex items-center gap-2">
                                  <Switch checked={product.is_available ?? true} onCheckedChange={() => toggleProductAvailability(product)} />
                                  <span className="text-xs font-medium">{product.is_available ? "Ativo" : "Pausado"}</span>
                               </div>
                               <div className="flex gap-1">
                                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => openEditProduct(product)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                </div>
             </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Modals are simplified versions for the example, identical in logic to EstablishmentMenu */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
           <DialogHeader><DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
           <div className="space-y-4 py-4">
              <div><Label>Nome</Label><Input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} /></div>
              <div><Label>Descrição</Label><Textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} /></div>
           </div>
           <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveCategory}>Salvar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader><DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
           <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-4">
                <div><Label>Nome</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                <div><Label>Descrição</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Preço (R$)</Label><Input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
                  <div><Label>Preço Original (De:)</Label><Input type="number" value={productForm.original_price} onChange={e => setProductForm({...productForm, original_price: e.target.value})} /></div>
                </div>
              </div>
              <div className="space-y-4">
                <div><Label>Imagem</Label><ImageUpload value={productForm.image_url} onChange={url => setProductForm({...productForm, image_url: url})} bucket="establishments" /></div>
                <div><Label>Categoria</Label>
                  <select className="w-full p-2 rounded-md border bg-background" value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})}>
                    <option value="">Sem categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center space-x-2"><Switch checked={productForm.is_featured} onCheckedChange={v => setProductForm({...productForm, is_featured: v})} /><Label>Destaque</Label></div>
              </div>
           </div>
           <DialogFooter>
              <Button variant="outline" onClick={() => setShowProductModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveProduct}>Salvar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Placeholder for components used if they are not standard shadcn
const Dialog = ({ children, open, onOpenChange }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => onOpenChange(false)}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {children}
      </motion.div>
    </div>
  );
};
const DialogContent = ({ children, className }: any) => <div className={className}>{children}</div>;
const DialogHeader = ({ children }: any) => <div className="p-6 border-b">{children}</div>;
const DialogTitle = ({ children }: any) => <h2 className="text-xl font-bold">{children}</h2>;
const DialogFooter = ({ children }: any) => <div className="p-6 border-t bg-muted/30 flex justify-end gap-2">{children}</div>;

export default ManageMenu;

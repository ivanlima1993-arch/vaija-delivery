import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, X, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ProductOptionsEditorProps {
  productId: string;
  onClose: () => void;
}

const ProductOptionsEditor = ({ productId, onClose }: ProductOptionsEditorProps) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: "",
    min_options: 0,
    max_options: 1,
    is_required: false
  });

  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState({
    name: "",
    price: "0",
    is_available: true
  });

  useEffect(() => {
    fetchGroups();
  }, [productId]);

  const fetchGroups = async () => {
    setLoading(true);
    const { data: groupsData } = await supabase
      .from("product_option_groups")
      .select(`
        *,
        product_options (*)
      `)
      .eq("product_id", productId)
      .order("sort_order");
    
    if (groupsData) setGroups(groupsData);
    setLoading(false);
  };

  const handleSaveGroup = async () => {
    try {
      const data = {
        product_id: productId,
        name: groupForm.name,
        min_options: groupForm.min_options,
        max_options: groupForm.max_options,
        is_required: groupForm.is_required
      };

      if (editingGroup) {
        await supabase.from("product_option_groups").update(data).eq("id", editingGroup.id);
        toast.success("Grupo atualizado!");
      } else {
        await supabase.from("product_option_groups").insert({ ...data, sort_order: groups.length });
        toast.success("Grupo criado!");
      }

      setShowGroupModal(false);
      setEditingGroup(null);
      fetchGroups();
    } catch (error) {
      toast.error("Erro ao salvar grupo");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Excluir este grupo e todas as suas opções?")) return;
    await supabase.from("product_option_groups").delete().eq("id", id);
    fetchGroups();
  };

  const handleSaveOption = async () => {
    if (!selectedGroupId) return;

    try {
      const data = {
        group_id: selectedGroupId,
        name: optionForm.name,
        price: parseFloat(optionForm.price),
        is_available: optionForm.is_available
      };

      if (editingOption) {
        await supabase.from("product_options").update(data).eq("id", editingOption.id);
        toast.success("Opção atualizada!");
      } else {
        const group = groups.find(g => g.id === selectedGroupId);
        await supabase.from("product_options").insert({ ...data, sort_order: group?.product_options?.length || 0 });
        toast.success("Opção criada!");
      }

      setShowOptionModal(false);
      setEditingOption(null);
      fetchGroups();
    } catch (error) {
      toast.error("Erro ao salvar opção");
    }
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm("Excluir esta opção?")) return;
    await supabase.from("product_options").delete().eq("id", id);
    fetchGroups();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Opcionais e Adicionais</h3>
          <p className="text-sm text-muted-foreground">Gerencie acompanhamentos e personalizações.</p>
        </div>
        <Button size="sm" onClick={() => {
          setEditingGroup(null);
          setGroupForm({ name: "", min_options: 0, max_options: 1, is_required: false });
          setShowGroupModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.id} className="overflow-hidden border-border/50">
            <div className="bg-muted/30 p-4 flex items-center justify-between border-b">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab" />
                <div>
                  <h4 className="font-bold flex items-center gap-2">
                    {group.name}
                    {group.is_required && <Badge variant="secondary" className="text-[10px]">Obrigatório</Badge>}
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Min: {group.min_options} | Max: {group.max_options}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  setEditingGroup(group);
                  setGroupForm({
                    name: group.name,
                    min_options: group.min_options,
                    max_options: group.max_options,
                    is_required: group.is_required
                  });
                  setShowGroupModal(true);
                }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {group.product_options?.map((option: any) => (
                <div key={option.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/40 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={!option.is_available ? "text-muted-foreground line-through" : ""}>
                      {option.name}
                    </span>
                    {option.price > 0 && (
                      <span className="text-primary font-bold">+ R$ {Number(option.price).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      setSelectedGroupId(group.id);
                      setEditingOption(option);
                      setOptionForm({
                        name: option.name,
                        price: String(option.price),
                        is_available: option.is_available
                      });
                      setShowOptionModal(true);
                    }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteOption(option.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed py-5 rounded-xl text-xs gap-2"
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setEditingOption(null);
                  setOptionForm({ name: "", price: "0", is_available: true });
                  setShowOptionModal(true);
                }}
              >
                <Plus className="w-3 h-3" />
                Adicionar Opção em "{group.name}"
              </Button>
            </div>
          </Card>
        ))}

        {groups.length === 0 && !loading && (
          <div className="text-center py-10 border-2 border-dashed rounded-2xl bg-muted/5">
            <p className="text-sm text-muted-foreground">Nenhum adicional configurado.</p>
          </div>
        )}
      </div>

      {/* Group Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">{editingGroup ? "Editar Grupo" : "Novo Grupo"}</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Grupo (Ex: Escolha o sabor)</Label>
                  <Input 
                    value={groupForm.name} 
                    onChange={e => setGroupForm({...groupForm, name: e.target.value})}
                    placeholder="Nome do grupo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qtd Mínima</Label>
                    <Input 
                      type="number" 
                      value={groupForm.min_options} 
                      onChange={e => setGroupForm({...groupForm, min_options: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qtd Máxima</Label>
                    <Input 
                      type="number" 
                      value={groupForm.max_options} 
                      onChange={e => setGroupForm({...groupForm, max_options: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <Label className="cursor-pointer">Obrigatório?</Label>
                  <Switch 
                    checked={groupForm.is_required} 
                    onCheckedChange={val => setGroupForm({...groupForm, is_required: val})}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowGroupModal(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={handleSaveGroup}>Salvar</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </AnimatePresence>

      {/* Option Modal */}
      <AnimatePresence>
        {showOptionModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">{editingOption ? "Editar Opção" : "Nova Opção"}</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Opção (Ex: Bacon, Queijo Extra)</Label>
                  <Input 
                    value={optionForm.name} 
                    onChange={e => setOptionForm({...optionForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Adicional (R$)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={optionForm.price} 
                    onChange={e => setOptionForm({...optionForm, price: e.target.value})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <Label className="cursor-pointer">Disponível?</Label>
                  <Switch 
                    checked={optionForm.is_available} 
                    onCheckedChange={val => setOptionForm({...optionForm, is_available: val})}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowOptionModal(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={handleSaveOption}>Salvar</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default ProductOptionsEditor;

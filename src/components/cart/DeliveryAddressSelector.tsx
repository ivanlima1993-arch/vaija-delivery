import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Check, Home, Briefcase, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";

export interface DeliveryAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  cityName: string;
  deliveryFee: number;
  type: "home" | "work" | "other";
}

interface Neighborhood {
  id: string;
  name: string;
  delivery_fee: number | null;
  city_id: string;
}

interface DeliveryAddressSelectorProps {
  selectedAddress: DeliveryAddress | null;
  onAddressChange: (address: DeliveryAddress | null) => void;
}

const DeliveryAddressSelector = ({ selectedAddress, onAddressChange }: DeliveryAddressSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>(() => {
    const saved = localStorage.getItem("deliveryAddresses");
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const { selectedCityId, selectedCityName, cities } = useAddress();

  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    number: "",
    complement: "",
    neighborhoodId: "",
    type: "home" as const,
  });

  // Fetch neighborhoods when city changes
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      if (!selectedCityId) return;
      
      setLoadingNeighborhoods(true);
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("id, name, delivery_fee, city_id")
        .eq("city_id", selectedCityId)
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setNeighborhoods(data);
      }
      setLoadingNeighborhoods(false);
    };

    fetchNeighborhoods();
  }, [selectedCityId]);

  // Save addresses to localStorage
  useEffect(() => {
    localStorage.setItem("deliveryAddresses", JSON.stringify(addresses));
  }, [addresses]);

  const getIcon = (type: DeliveryAddress["type"]) => {
    switch (type) {
      case "home":
        return Home;
      case "work":
        return Briefcase;
      default:
        return MapPin;
    }
  };

  const handleSelectAddress = (address: DeliveryAddress) => {
    onAddressChange(address);
    setOpen(false);
  };

  const handleAddAddress = () => {
    const neighborhood = neighborhoods.find(n => n.id === newAddress.neighborhoodId);
    
    if (newAddress.street && newAddress.number && neighborhood && selectedCityId) {
      const address: DeliveryAddress = {
        id: Date.now().toString(),
        label: newAddress.label || `${newAddress.street}, ${newAddress.number}`,
        street: newAddress.street,
        number: newAddress.number,
        complement: newAddress.complement || undefined,
        neighborhoodId: neighborhood.id,
        neighborhoodName: neighborhood.name,
        cityId: selectedCityId,
        cityName: selectedCityName || "",
        deliveryFee: neighborhood.delivery_fee || 0,
        type: newAddress.type,
      };
      
      setAddresses(prev => [...prev, address]);
      onAddressChange(address);
      setNewAddress({
        label: "",
        street: "",
        number: "",
        complement: "",
        neighborhoodId: "",
        type: "home",
      });
      setIsAddingNew(false);
      setOpen(false);
    }
  };

  const filteredAddresses = addresses.filter(a => a.cityId === selectedCityId);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-card rounded-xl shadow-soft"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entregar em</p>
              {selectedAddress ? (
                <p className="font-semibold text-sm">
                  {selectedAddress.street}, {selectedAddress.number}
                  {selectedAddress.complement && ` - ${selectedAddress.complement}`}
                </p>
              ) : (
                <p className="font-semibold text-destructive">Selecione um endereço</p>
              )}
              {selectedAddress && (
                <p className="text-xs text-muted-foreground">
                  {selectedAddress.neighborhoodName} • Taxa: R$ {selectedAddress.deliveryFee.toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => setOpen(true)}>
            {selectedAddress ? "Alterar" : "Selecionar"}
          </Button>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">
              {isAddingNew ? "Novo Endereço" : "Onde você quer receber?"}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isAddingNew ? (
              <motion.div
                key="new-address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <div className="p-3 rounded-lg bg-muted text-sm">
                    {selectedCityName || "Nenhuma cidade selecionada"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Select
                    value={newAddress.neighborhoodId}
                    onValueChange={(value) => setNewAddress({ ...newAddress, neighborhoodId: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={loadingNeighborhoods ? "Carregando..." : "Selecione o bairro"} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {neighborhoods.map((neighborhood) => (
                        <SelectItem key={neighborhood.id} value={neighborhood.id}>
                          {neighborhood.name} - Taxa: R$ {(neighborhood.delivery_fee || 0).toFixed(2).replace(".", ",")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      placeholder="Nome da rua"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Nº *</Label>
                    <Input
                      id="number"
                      placeholder="123"
                      value={newAddress.number}
                      onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Apto, Bloco, Casa..."
                    value={newAddress.complement}
                    onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Apelido</Label>
                  <Input
                    id="label"
                    placeholder="Ex: Casa, Trabalho..."
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "home", label: "Casa", icon: Home },
                      { value: "work", label: "Trabalho", icon: Briefcase },
                      { value: "other", label: "Outro", icon: MapPin },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, type: type.value as any })}
                        className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                          newAddress.type === type.value
                            ? "border-primary bg-primary/10"
                            : "border-transparent bg-muted"
                        }`}
                      >
                        <type.icon className={`w-4 h-4 mx-auto mb-1 ${
                          newAddress.type === type.value ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <p className="text-xs">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsAddingNew(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleAddAddress}
                    disabled={!newAddress.street || !newAddress.number || !newAddress.neighborhoodId}
                  >
                    Salvar Endereço
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="address-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {filteredAddresses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Endereços salvos em {selectedCityName}
                    </p>
                    {filteredAddresses.map((address) => {
                      const Icon = getIcon(address.type);
                      const isSelected = selectedAddress?.id === address.id;
                      return (
                        <button
                          key={address.id}
                          onClick={() => handleSelectAddress(address)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${
                            isSelected
                              ? "bg-primary/10 ring-2 ring-primary"
                              : "bg-muted hover:bg-accent"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-card"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{address.label}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {address.street}, {address.number}
                              {address.complement ? ` - ${address.complement}` : ""} • {address.neighborhoodName}
                            </p>
                            <p className="text-xs text-success">
                              Taxa de entrega: R$ {address.deliveryFee.toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredAddresses.length === 0 && (
                  <div className="text-center py-6">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Nenhum endereço salvo em {selectedCityName}
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsAddingNew(true)}
                  disabled={!selectedCityId}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar novo endereço
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeliveryAddressSelector;
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Check, Home, Briefcase, Map, Navigation, Loader2, Route } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAddress } from "@/contexts/AddressContext";
import MapPicker from "@/components/map/MapPicker";
import { GeocodedAddress, Coordinates } from "@/hooks/useMapbox";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export interface DeliveryAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhoodId?: string;
  neighborhoodName: string;
  cityId: string;
  cityName: string;
  deliveryFee: number;
  type: "home" | "work" | "other";
  coordinates?: Coordinates;
  distanceKm?: number;
  durationMinutes?: number;
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
  const { selectedCityId, selectedCityName } = useAddress();
  const [addressMode, setAddressMode] = useState<"manual" | "map">("manual");
  const [mapAddress, setMapAddress] = useState<GeocodedAddress | null>(null);
  const { calculateFee, isLoading: calculatingFee } = useDeliveryFee();
  const { establishmentId } = useCart();

  const [newAddress, setNewAddress] = useState<{
    label: string;
    street: string;
    number: string;
    complement: string;
    neighborhoodId: string;
    type: "home" | "work" | "other";
  }>({
    label: "",
    street: "",
    number: "",
    complement: "",
    neighborhoodId: "",
    type: "home",
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

  const handleSelectAddress = useCallback(async (address: DeliveryAddress) => {
    // If address has coordinates and we have an establishment, try to calculate distance-based fee
    if (address.coordinates && establishmentId) {
      const result = await calculateFee(establishmentId, address.coordinates);
      if (result) {
        const updatedAddress: DeliveryAddress = {
          ...address,
          deliveryFee: result.fee,
          distanceKm: result.distanceKm,
          durationMinutes: result.durationMinutes,
        };
        onAddressChange(updatedAddress);
        setOpen(false);
        return;
      }
    }
    
    onAddressChange(address);
    setOpen(false);
  }, [establishmentId, calculateFee, onAddressChange]);

  const handleMapLocationSelect = (geocoded: GeocodedAddress) => {
    setMapAddress(geocoded);
    // Auto-fill the form fields
    setNewAddress(prev => ({
      ...prev,
      street: geocoded.street || geocoded.address.split(",")[0] || "",
    }));
    
    // Auto-select neighborhood if detected and matches
    if (geocoded.neighborhood) {
      const matchingNeighborhood = neighborhoods.find(
        n => n.name.toLowerCase().includes(geocoded.neighborhood?.toLowerCase() || "") ||
             geocoded.neighborhood?.toLowerCase().includes(n.name.toLowerCase())
      );
      if (matchingNeighborhood) {
        setNewAddress(prev => ({
          ...prev,
          street: geocoded.street || geocoded.address.split(",")[0] || "",
          neighborhoodId: matchingNeighborhood.id,
        }));
      }
    }
  };

  const handleAddAddressManual = () => {
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
      
      saveAddress(address);
    }
  };

  const handleAddAddressFromMap = async () => {
    if (!mapAddress || !selectedCityId) {
      toast.error("Selecione um local no mapa");
      return;
    }

    if (!newAddress.number) {
      toast.error("Informe o número do endereço");
      return;
    }

    if (!newAddress.neighborhoodId) {
      toast.error("Selecione um bairro");
      return;
    }

    // Get selected neighborhood
    const neighborhood = neighborhoods.find(n => n.id === newAddress.neighborhoodId);

    let deliveryFee = neighborhood?.delivery_fee || 5;
    let distanceKm: number | undefined;
    let durationMinutes: number | undefined;

    // Calculate distance-based fee if we have establishment
    if (establishmentId && mapAddress.coordinates) {
      const result = await calculateFee(establishmentId, mapAddress.coordinates);
      if (result) {
        deliveryFee = result.fee;
        distanceKm = result.distanceKm;
        durationMinutes = result.durationMinutes;
      }
    }

    const address: DeliveryAddress = {
      id: Date.now().toString(),
      label: newAddress.label || `${mapAddress.street}, ${newAddress.number}`,
      street: mapAddress.street || mapAddress.address.split(",")[0],
      number: newAddress.number,
      complement: newAddress.complement || undefined,
      neighborhoodId: neighborhood?.id,
      neighborhoodName: neighborhood?.name || mapAddress.neighborhood || "Centro",
      cityId: selectedCityId,
      cityName: mapAddress.city || selectedCityName || "",
      deliveryFee,
      type: newAddress.type,
      coordinates: mapAddress.coordinates,
      distanceKm,
      durationMinutes,
    };

    saveAddress(address);
  };

  const saveAddress = (address: DeliveryAddress) => {
    setAddresses(prev => [...prev, address]);
    onAddressChange(address);
    resetForm();
    setOpen(false);
    toast.success("Endereço salvo com sucesso!");
  };

  const resetForm = () => {
    setNewAddress({
      label: "",
      street: "",
      number: "",
      complement: "",
      neighborhoodId: "",
      type: "home",
    });
    setMapAddress(null);
    setIsAddingNew(false);
    setAddressMode("manual");
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedAddress.neighborhoodName}</span>
                  {selectedAddress.distanceKm && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Route className="w-3 h-3" />
                        {selectedAddress.distanceKm.toFixed(1)} km
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-success font-medium">
                    R$ {selectedAddress.deliveryFee.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => setOpen(true)}>
            {selectedAddress ? "Alterar" : "Selecionar"}
          </Button>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto">
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
                <Tabs value={addressMode} onValueChange={(v) => setAddressMode(v as "manual" | "map")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual" className="gap-2">
                      <MapPin className="w-4 h-4" />
                      Manual
                    </TabsTrigger>
                    <TabsTrigger value="map" className="gap-2">
                      <Map className="w-4 h-4" />
                      No mapa
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="map" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Arraste o pino ou clique no mapa
                      </Label>
                      <MapPicker
                        onLocationSelect={handleMapLocationSelect}
                        height="250px"
                      />
                    </div>

                    {mapAddress && (
                      <div className="p-3 bg-accent/50 rounded-lg text-sm">
                        <p className="font-medium">{mapAddress.address}</p>
                        {mapAddress.neighborhood && (
                          <p className="text-muted-foreground">Detectado: {mapAddress.neighborhood}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood-map">Bairro *</Label>
                      <Select
                        value={newAddress.neighborhoodId}
                        onValueChange={(value) => setNewAddress({ ...newAddress, neighborhoodId: value })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={loadingNeighborhoods ? "Carregando..." : "Selecione o bairro"} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border z-50 max-h-[200px]">
                          {/* Show suggested neighborhood first if detected from map */}
                          {mapAddress?.neighborhood && (() => {
                            const suggestedNeighborhood = neighborhoods.find(
                              n => n.name.toLowerCase().includes(mapAddress.neighborhood?.toLowerCase() || "") ||
                                   mapAddress.neighborhood?.toLowerCase().includes(n.name.toLowerCase())
                            );
                            if (suggestedNeighborhood) {
                              return (
                                <SelectItem 
                                  key={`suggested-${suggestedNeighborhood.id}`} 
                                  value={suggestedNeighborhood.id}
                                  className="bg-primary/10 font-medium"
                                >
                                  ⭐ {suggestedNeighborhood.name} (Sugerido)
                                </SelectItem>
                              );
                            }
                            return null;
                          })()}
                          {neighborhoods
                            .filter(n => {
                              // Don't show duplicate if already suggested
                              if (mapAddress?.neighborhood) {
                                const isSuggested = n.name.toLowerCase().includes(mapAddress.neighborhood?.toLowerCase() || "") ||
                                                   mapAddress.neighborhood?.toLowerCase().includes(n.name.toLowerCase());
                                return !isSuggested;
                              }
                              return true;
                            })
                            .map((neighborhood) => (
                              <SelectItem key={neighborhood.id} value={neighborhood.id}>
                                {neighborhood.name} - R$ {(neighborhood.delivery_fee || 0).toFixed(2).replace(".", ",")}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {mapAddress?.neighborhood && !neighborhoods.some(
                        n => n.name.toLowerCase().includes(mapAddress.neighborhood?.toLowerCase() || "") ||
                             mapAddress.neighborhood?.toLowerCase().includes(n.name.toLowerCase())
                      ) && (
                        <p className="text-xs text-warning">
                          Bairro "{mapAddress.neighborhood}" não encontrado. Selecione o mais próximo.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="number-map">Número *</Label>
                        <Input
                          id="number-map"
                          placeholder="123"
                          value={newAddress.number}
                          onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complement-map">Complemento</Label>
                        <Input
                          id="complement-map"
                          placeholder="Apto, Bloco..."
                          value={newAddress.complement}
                          onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4 mt-4">
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
                  </TabsContent>
                </Tabs>

                {/* Common fields for both modes */}
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
                    {([
                      { value: "home" as const, label: "Casa", icon: Home },
                      { value: "work" as const, label: "Trabalho", icon: Briefcase },
                      { value: "other" as const, label: "Outro", icon: MapPin },
                    ]).map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, type: type.value })}
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
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={addressMode === "map" ? handleAddAddressFromMap : handleAddAddressManual}
                    disabled={
                      addressMode === "map" 
                        ? !mapAddress || !newAddress.number
                        : !newAddress.street || !newAddress.number || !newAddress.neighborhoodId
                    }
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
                            <div className="flex items-center gap-2 text-xs">
                              {address.distanceKm && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Route className="w-3 h-3" />
                                  {address.distanceKm.toFixed(1)} km
                                </span>
                              )}
                              <span className="text-success font-medium">
                                R$ {address.deliveryFee.toFixed(2).replace(".", ",")}
                              </span>
                            </div>
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

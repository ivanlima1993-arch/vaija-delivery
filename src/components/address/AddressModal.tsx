import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Check, X, Home, Briefcase, Navigation } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  type: "home" | "work" | "other";
}

const defaultAddresses: Address[] = [
  {
    id: "1",
    label: "Casa",
    street: "Rua das Flores",
    number: "123",
    complement: "Apto 101",
    neighborhood: "Centro",
    city: "São Paulo",
    type: "home",
  },
  {
    id: "2",
    label: "Trabalho",
    street: "Av. Paulista",
    number: "1000",
    complement: "Sala 501",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    type: "work",
  },
];

const AddressModal = () => {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(defaultAddresses[0]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    type: "other" as const,
  });

  const getIcon = (type: Address["type"]) => {
    switch (type) {
      case "home":
        return Home;
      case "work":
        return Briefcase;
      default:
        return MapPin;
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    setOpen(false);
  };

  const handleAddAddress = () => {
    if (newAddress.street && newAddress.number && newAddress.neighborhood && newAddress.city) {
      const address: Address = {
        id: Date.now().toString(),
        ...newAddress,
        label: newAddress.label || `${newAddress.street}, ${newAddress.number}`,
      };
      setAddresses([...addresses, address]);
      setSelectedAddress(address);
      setNewAddress({
        label: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        type: "other",
      });
      setIsAddingNew(false);
      setOpen(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Simulating address from geolocation
          const currentAddress: Address = {
            id: "current",
            label: "Localização Atual",
            street: "Rua Detectada",
            number: "S/N",
            neighborhood: "Sua Região",
            city: "Sua Cidade",
            type: "other",
          };
          setSelectedAddress(currentAddress);
          setOpen(false);
        },
        () => {
          alert("Não foi possível obter sua localização");
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-accent transition-colors max-w-[200px]">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">
            {selectedAddress ? selectedAddress.label : "Selecionar endereço"}
          </span>
        </button>
      </DialogTrigger>
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
                <Label htmlFor="label">Apelido (opcional)</Label>
                <Input
                  id="label"
                  placeholder="Ex: Casa, Trabalho..."
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    placeholder="Nome da rua"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Nº</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    value={newAddress.number}
                    onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento (opcional)</Label>
                <Input
                  id="complement"
                  placeholder="Apto, Bloco, Casa..."
                  value={newAddress.complement}
                  onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Bairro"
                    value={newAddress.neighborhood}
                    onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
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
                <Button className="flex-1" onClick={handleAddAddress}>
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
              {/* Use current location */}
              <button
                onClick={handleUseCurrentLocation}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Usar localização atual</p>
                  <p className="text-xs text-muted-foreground">Detectar automaticamente</p>
                </div>
              </button>

              {/* Saved addresses */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Endereços salvos
                </p>
                {addresses.map((address) => {
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-card"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{address.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {address.street}, {address.number}
                          {address.complement ? ` - ${address.complement}` : ""} •{" "}
                          {address.neighborhood}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Add new address */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar novo endereço
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AddressModal;

import { MapPin, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddress } from "@/contexts/AddressContext";

const CitySelector = () => {
  const { cities, selectedCityId, setSelectedCityId, isLoading } = useAddress();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground">Nenhuma cidade disponível</span>
      </div>
    );
  }

  return (
    <Select value={selectedCityId || undefined} onValueChange={setSelectedCityId}>
      <SelectTrigger className="w-auto min-w-[160px] max-w-[220px] gap-2 rounded-full bg-muted border-0 hover:bg-accent transition-colors">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <SelectValue placeholder="Selecione a cidade" />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city.id} value={city.id}>
            {city.name} - {city.state}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CitySelector;

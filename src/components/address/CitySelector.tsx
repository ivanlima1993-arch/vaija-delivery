import { useState } from "react";
import { MapPin, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAddress } from "@/contexts/AddressContext";

const CitySelector = () => {
  const [open, setOpen] = useState(false);
  const { cities, selectedCityId, setSelectedCityId, isLoading } = useAddress();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted animate-pulse">
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

  const selectedCity = cities.find((c) => c.id === selectedCityId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-auto min-w-[170px] max-w-[240px] justify-between gap-2 rounded-full bg-muted border-0 hover:bg-accent hover:text-accent-foreground transition-all text-sm font-semibold pl-4 pr-3 h-10 shadow-sm text-left"
        >
          <div className="flex items-center gap-2 truncate text-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">
              {selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : "Selecione a cidade"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 rounded-2xl shadow-elevated border border-border/40 bg-card overflow-hidden z-50">
        <Command className="rounded-2xl">
          <CommandInput 
            placeholder="Digite a cidade..." 
            className="h-11 border-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60 text-sm font-semibold pl-1"
          />
          <CommandList className="max-h-[220px] overflow-y-auto p-1">
            <CommandEmpty className="p-3 text-sm text-muted-foreground text-center">Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={`${city.name} ${city.state}`}
                  onSelect={() => {
                    setSelectedCityId(city.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted cursor-pointer transition-colors"
                >
                  <span className="truncate">{city.name} - {city.state}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 text-primary",
                      selectedCityId === city.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CitySelector;

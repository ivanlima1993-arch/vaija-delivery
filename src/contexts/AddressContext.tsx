import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface City {
  id: string;
  name: string;
  state: string;
}

interface AddressContextType {
  selectedCityId: string | null;
  selectedCityName: string | null;
  cities: City[];
  setSelectedCityId: (cityId: string | null) => void;
  isLoading: boolean;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(() => {
    return localStorage.getItem("selectedCityId");
  });
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, state")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setCities(data);
        // If no city is selected and there are cities, select the first one
        if (!selectedCityId && data.length > 0) {
          setSelectedCityId(data[0].id);
        }
      }
      setIsLoading(false);
    };

    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      localStorage.setItem("selectedCityId", selectedCityId);
    } else {
      localStorage.removeItem("selectedCityId");
    }
  }, [selectedCityId]);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const selectedCityName = selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : null;

  return (
    <AddressContext.Provider
      value={{
        selectedCityId,
        selectedCityName,
        cities,
        setSelectedCityId,
        isLoading,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
};

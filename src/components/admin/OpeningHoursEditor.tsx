import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const DAYS = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

export const defaultOpeningHours: OpeningHours = {
  monday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
  tuesday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
  wednesday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
  thursday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
  friday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
  saturday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
  sunday: { isOpen: false, openTime: "08:00", closeTime: "22:00" },
};

interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
}

const OpeningHoursEditor = ({ value, onChange }: OpeningHoursEditorProps) => {
  // Merge with defaults to ensure all days exist
  const safeValue: OpeningHours = {
    monday: value?.monday ?? defaultOpeningHours.monday,
    tuesday: value?.tuesday ?? defaultOpeningHours.tuesday,
    wednesday: value?.wednesday ?? defaultOpeningHours.wednesday,
    thursday: value?.thursday ?? defaultOpeningHours.thursday,
    friday: value?.friday ?? defaultOpeningHours.friday,
    saturday: value?.saturday ?? defaultOpeningHours.saturday,
    sunday: value?.sunday ?? defaultOpeningHours.sunday,
  };

  const handleDayChange = (
    day: keyof OpeningHours,
    field: keyof DaySchedule,
    fieldValue: boolean | string
  ) => {
    onChange({
      ...safeValue,
      [day]: {
        ...safeValue[day],
        [field]: fieldValue,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <Label className="text-base font-medium">Horário de Funcionamento</Label>
      </div>

      <div className="space-y-3">
        {DAYS.map(({ key, label }) => (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center justify-between sm:w-40">
              <span className="font-medium text-sm">{label}</span>
              <Switch
                checked={safeValue[key].isOpen}
                onCheckedChange={(checked) => handleDayChange(key, "isOpen", checked)}
              />
            </div>

            {safeValue[key].isOpen ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${key}-open`} className="text-sm text-muted-foreground whitespace-nowrap">
                    Abre:
                  </Label>
                  <Input
                    id={`${key}-open`}
                    type="time"
                    value={safeValue[key].openTime}
                    onChange={(e) => handleDayChange(key, "openTime", e.target.value)}
                    className="w-28"
                  />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${key}-close`} className="text-sm text-muted-foreground whitespace-nowrap">
                    Fecha:
                  </Label>
                  <Input
                    id={`${key}-close`}
                    type="time"
                    value={safeValue[key].closeTime}
                    onChange={(e) => handleDayChange(key, "closeTime", e.target.value)}
                    className="w-28"
                  />
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">Fechado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpeningHoursEditor;

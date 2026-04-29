import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrencyName, useCurrencyCodes } from "@/hooks/useCurrencyCodes";
import { cn } from "@/lib/utils";

type CurrencyDisplayFormat = "code" | "code+name";

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
  displayFormat?: CurrencyDisplayFormat;
  disabled?: boolean;
}

export function CurrencySelect({
  value,
  onChange,
  placeholder = "Select currency",
  isSearchable = true,
  displayFormat = "code+name",
  disabled = false,
}: Readonly<CurrencySelectProps>) {
  const [open, setOpen] = useState(false);
  const currencyCodes = useCurrencyCodes();
  const options = useMemo(
    () => Array.from(new Set(value ? [value, ...currencyCodes] : currencyCodes)),
    [currencyCodes, value],
  );
  const isLoading = options.length === 0;

  const formatCurrencyOption = (code: string) =>
    displayFormat === "code" ? code : `${code} — ${getCurrencyName(code)}`;

  if (!isSearchable) {
    return (
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading currencies..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((code) => (
            <SelectItem key={code} value={code}>
              {formatCurrencyOption(code)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {value ? formatCurrencyOption(value) : isLoading ? "Loading currencies..." : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            {options.map((code) => (
              <CommandItem
                key={code}
                value={`${code} ${getCurrencyName(code)}`}
                onSelect={() => {
                  onChange(code);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === code ? "opacity-100" : "opacity-0",
                  )}
                />
                <span>{formatCurrencyOption(code)}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
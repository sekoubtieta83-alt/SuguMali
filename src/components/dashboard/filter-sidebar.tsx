'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X, MapPin, Banknote, CheckCircle2, Filter } from 'lucide-react';

export type Filters = {
  searchQuery: string;
  category: string | null;
  minPrice: string;
  maxPrice: string;
  conditions: string[];
  location: string;
};

interface FilterSidebarProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onApply?: () => void;
  className?: string;
}

export function FilterSidebar({ filters, setFilters, onApply, className }: FilterSidebarProps) {
  // État local pour ne pas appliquer les filtres instantanément (attendre le clic sur Appliquer)
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({ ...prev, location: e.target.value }));
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setLocalFilters(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleConditionChange = (condition: string) => {
    setLocalFilters(prev => {
      const newConditions = prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition];
      return { ...prev, conditions: newConditions };
    });
  };

  const applyFilters = () => {
    setFilters(localFilters);
    onApply?.();
  };

  const clearFilters = () => {
    const defaultFilters: Filters = {
      searchQuery: '',
      category: null,
      minPrice: '',
      maxPrice: '',
      conditions: [],
      location: '',
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
  };
  
  const conditions = ['Neuf', 'Comme neuf', 'Occasion'];

  return (
    <div className={cn("h-full bg-background flex flex-col", className)}>
      <div className="p-6 border-b">
        <h2 className="text-xl font-black tracking-tight">Filtrer</h2>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Trouvez exactement ce que vous cherchez</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Search Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Search className="h-4 w-4 text-accent" />
            Article
          </div>
          <Input 
            placeholder="ex: iPhone, montre..."
            className="bg-muted/30 border-none rounded-xl h-12 pl-4 focus-visible:ring-accent/20"
            value={localFilters.searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <MapPin className="h-4 w-4 text-accent" />
            Ville ou Quartier
          </div>
          <Input 
            placeholder="ex: Bamako, ACI 2000..."
            className="bg-muted/30 border-none rounded-xl h-12 pl-4 focus-visible:ring-accent/20"
            value={localFilters.location}
            onChange={handleLocationChange}
          />
        </div>

        {/* Price Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Banknote className="h-4 w-4 text-accent" />
            Prix (FCFA)
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="text" 
              placeholder="Min" 
              className="h-12 rounded-xl bg-muted/30 border-none text-center text-sm font-bold"
              value={localFilters.minPrice}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            />
            <div className="h-0.5 w-4 bg-border rounded-full" />
            <Input 
              type="text" 
              placeholder="Max"
              className="h-12 rounded-xl bg-muted/30 border-none text-center text-sm font-bold"
              value={localFilters.maxPrice}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            />
          </div>
        </div>

        {/* Condition Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            État
          </div>
          <div className="grid grid-cols-1 gap-2">
            {conditions.map((condition) => (
              <label
                key={condition}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]",
                  localFilters.conditions.includes(condition)
                    ? "border-accent bg-accent/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/50"
                )}
              >
                <span className={cn("text-sm font-bold", localFilters.conditions.includes(condition) ? "text-accent" : "text-foreground")}>
                  {condition}
                </span>
                <Checkbox
                  checked={localFilters.conditions.includes(condition)}
                  onCheckedChange={() => handleConditionChange(condition)}
                  className="rounded-full data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t bg-background space-y-3">
        <Button 
          onClick={applyFilters} 
          className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.95]"
        >
          <Filter className="mr-2 h-5 w-5" />
          Appliquer
        </Button>
        <Button 
          onClick={clearFilters} 
          variant="ghost" 
          className="w-full h-10 rounded-xl font-bold text-muted-foreground text-xs hover:text-destructive"
        >
          Effacer tout
        </Button>
      </div>
    </div>
  );
}

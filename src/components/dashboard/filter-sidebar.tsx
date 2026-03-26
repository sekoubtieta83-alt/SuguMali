
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { categories } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { Search, X, MapPin, Banknote, Layers, CheckCircle2 } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

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
  setFilters: Dispatch<SetStateAction<Filters>>;
  className?: string;
}

export function FilterSidebar({ filters, setFilters, className }: FilterSidebarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, location: e.target.value }));
  };

  const handleCategorySelect = (category: string) => {
    setFilters(prev => ({ ...prev, category: prev.category === category ? null : category }));
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setFilters(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleConditionChange = (condition: string) => {
    setFilters(prev => {
      const newConditions = prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition];
      return { ...prev, conditions: newConditions };
    });
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      category: null,
      minPrice: '',
      maxPrice: '',
      conditions: [],
      location: '',
    });
  };
  
  const conditions = ['Neuf', 'Comme neuf', 'Occasion'];

  return (
    <div className={cn("h-full bg-background/50 backdrop-blur-sm border-r flex flex-col", className)}>
      <div className="p-6 border-b bg-background/80">
        <h2 className="text-xl font-black tracking-tight">Filtres</h2>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Affinez votre recherche</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Search Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Search className="h-4 w-4 text-accent" />
            Que cherchez-vous ?
          </div>
          <div className="relative">
            <Input 
              id="search"
              placeholder="ex: iPhone, ordinateur..."
              className="bg-card border-border/50 rounded-xl h-11 pl-4 focus-visible:ring-accent/20 focus-visible:border-accent/50 transition-all"
              value={filters.searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <MapPin className="h-4 w-4 text-accent" />
            Où ?
          </div>
          <div className="relative">
            <Input 
              id="location"
              placeholder="ex: Bamako, Kalaban..."
              className="bg-card border-border/50 rounded-xl h-11 pl-4 focus-visible:ring-accent/20 focus-visible:border-accent/50 transition-all"
              value={filters.location}
              onChange={handleLocationChange}
            />
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Layers className="h-4 w-4 text-accent" />
            Catégories
          </div>
          <Accordion type="single" collapsible className="w-full space-y-1">
            {categories.map((category) => (
              <AccordionItem value={category.name} key={category.name} className="border-none">
                <AccordionTrigger className="text-sm py-2 px-3 rounded-lg hover:bg-muted/50 hover:no-underline font-semibold data-[state=open]:bg-muted/30">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2">
                  <div className="flex flex-col items-start gap-1 pl-4 pr-2">
                     {category.subcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => handleCategorySelect(subcategory)}
                        className={cn(
                          'w-full text-left py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-between group',
                          filters.category === subcategory 
                            ? 'bg-accent text-white font-bold shadow-md shadow-accent/20' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {subcategory}
                        {filters.category === subcategory && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
           {filters.category && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCategorySelect(filters.category!)} 
              className="w-full justify-center text-accent hover:text-accent hover:bg-accent/5 mt-2 h-9 text-xs font-bold rounded-xl border border-accent/20"
            >
                <X className="mr-2 h-3 w-3"/>
                Effacer la catégorie
            </Button>
          )}
        </div>

        {/* Price Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Banknote className="h-4 w-4 text-accent" />
            Budget (FCFA)
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="text" 
              placeholder="Min" 
              className="h-11 rounded-xl bg-card border-border/50 text-center text-sm font-medium"
              value={filters.minPrice}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            />
            <div className="h-0.5 w-4 bg-border rounded-full" />
            <Input 
              type="text" 
              placeholder="Max"
              className="h-11 rounded-xl bg-card border-border/50 text-center text-sm font-medium"
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            />
          </div>
        </div>

        {/* Condition Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            État de l'article
          </div>
          <div className="grid grid-cols-1 gap-2">
            {conditions.map((condition) => (
              <label
                key={condition}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]",
                  filters.conditions.includes(condition)
                    ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                    : "border-border/50 bg-card hover:border-border"
                )}
              >
                <span className={cn("text-xs font-bold", filters.conditions.includes(condition) ? "text-accent" : "text-muted-foreground")}>
                  {condition}
                </span>
                <Checkbox
                  id={`condition-${condition}`}
                  checked={filters.conditions.includes(condition)}
                  onCheckedChange={() => handleConditionChange(condition)}
                  className="rounded-full border-2 border-muted-foreground/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t bg-background/80">
        <Button 
          onClick={clearFilters} 
          variant="outline" 
          className="w-full h-12 rounded-2xl font-black text-sm transition-all active:scale-[0.98] border-2"
        >
          Réinitialiser tout
        </Button>
      </div>
    </div>
  );
}

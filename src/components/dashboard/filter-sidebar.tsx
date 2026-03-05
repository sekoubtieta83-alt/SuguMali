'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { categories } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { Search, X, Sparkles, Loader2 } from 'lucide-react';
import { Dispatch, SetStateAction, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type SearchParserOutput, parseSearchQuery } from '@/ai/flows/search-parser-flow';

export type Filters = {
  searchQuery: string;
  category: string | null;
  minPrice: string;
  maxPrice: string;
  conditions: string[];
};

interface FilterSidebarProps {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  className?: string;
}

export function FilterSidebar({ filters, setFilters, className }: FilterSidebarProps) {
  const [isAiSearching, setIsAiSearching] = useState(false);
  const { toast } = useToast();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleAiSearch = async () => {
    if (!filters.searchQuery) return;
    setIsAiSearching(true);
    try {
      const parsedFilters = await parseSearchQuery(filters.searchQuery);

      setFilters(prev => ({
        ...prev,
        // Update only the fields returned by the AI
        searchQuery: parsedFilters.searchQuery ?? prev.searchQuery,
        category: parsedFilters.category ?? prev.category,
        minPrice: parsedFilters.minPrice ?? prev.minPrice,
        maxPrice: parsedFilters.maxPrice ?? prev.maxPrice,
        conditions: parsedFilters.conditions ?? prev.conditions,
      }));

      toast({
        title: "Filtres IA appliqués",
        description: "Votre recherche a été affinée par l'IA.",
      });

    } catch (error) {
      console.error("AI Search failed", error);
      toast({
        variant: 'destructive',
        title: 'La recherche IA a échoué',
        description: "Impossible d'interpréter la recherche. Essayez une requête plus simple."
      });
    } finally {
      setIsAiSearching(false);
    }
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
    });
  };
  
  const conditions = ['Neuf', 'Comme neuf', 'Occasion'];

  return (
    <div className={cn("h-full bg-card border-r flex flex-col", className)}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Filtres</h2>
        <p className="text-sm text-muted-foreground">Affinez votre recherche</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">Recherche Intelligente</Label>
          <div className="relative flex items-center gap-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input 
              id="search"
              placeholder="ex: téléphone pas cher à Bamako"
              className="pl-10"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission if any
                    handleAiSearch();
                  }
              }}
            />
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleAiSearch} 
                disabled={isAiSearching || !filters.searchQuery}
                className="shrink-0"
                aria-label="Lancer la recherche intelligente"
                title="Lancer la recherche intelligente"
            >
                {isAiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
             </Button>
          </div>
           <p className="text-xs text-muted-foreground">Utilisez le langage naturel et l'IA affinera les filtres.</p>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <Label>Catégories</Label>
          <Accordion type="single" collapsible className="w-full">
            {categories.map((category) => (
              <AccordionItem value={category.name} key={category.name}>
                <AccordionTrigger>{category.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col items-start gap-1 pl-2">
                     {category.subcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => handleCategorySelect(subcategory)}
                        className={cn(
                          'w-full text-left p-2 rounded-md text-sm text-muted-foreground hover:bg-muted',
                          { 'bg-accent/20 text-accent font-semibold': filters.category === subcategory }
                        )}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
           {filters.category && (
            <Button variant="ghost" size="sm" onClick={() => handleCategorySelect(filters.category!)} className="w-full justify-start text-accent">
                <X className="mr-2 h-4 w-4"/>
                Effacer la catégorie
            </Button>
          )}
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label>Gamme de prix (FCFA)</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="text" 
              placeholder="Min" 
              value={filters.minPrice}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            />
            <span>-</span>
            <Input 
              type="text" 
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            />
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label>État</Label>
          <div className="space-y-2">
            {conditions.map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={`condition-${condition}`}
                  checked={filters.conditions.includes(condition)}
                  onCheckedChange={() => handleConditionChange(condition)}
                />
                <label
                  htmlFor={`condition-${condition}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {condition}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t">
        <Button onClick={clearFilters} variant="outline" className="w-full">
          Effacer tous les filtres
        </Button>
      </div>
    </div>
  );
}

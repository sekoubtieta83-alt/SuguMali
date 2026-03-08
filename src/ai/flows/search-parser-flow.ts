
'use server';
/**
 * @fileOverview An AI flow to parse natural language search queries into structured filters.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { allSubcategories } from '@/lib/categories';

const SearchParserInputSchema = z.string().describe('A natural language search query from a user.');
export type SearchParserInput = z.infer<typeof SearchParserInputSchema>;

const SearchParserOutputSchema = z.object({
  searchQuery: z.string().optional().describe('A refined search query for text matching.'),
  category: z.string().optional().describe(`The category of the product.`),
  minPrice: z.string().optional().describe('The minimum price.'),
  maxPrice: z.string().optional().describe('The maximum price.'),
  conditions: z.array(z.string()).optional().describe("Condition of the item.")
});
export type SearchParserOutput = z.infer<typeof SearchParserOutputSchema>;

export async function parseSearchQuery(input: SearchParserInput): Promise<SearchParserOutput> {
  return searchParserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchParserPrompt',
  input: { schema: SearchParserInputSchema },
  output: { schema: SearchParserOutputSchema },
  prompt: `You are Mami, expert search query parser for SuguMali.
Analyze the query: {{{prompt}}}
Extract structured filters for categories: ${allSubcategories.join(', ')}.`,
});

const searchParserFlow = ai.defineFlow(
  {
    name: 'searchParserFlow',
    inputSchema: SearchParserInputSchema,
    outputSchema: SearchParserOutputSchema,
  },
  async (query) => {
    const { output } = await prompt(query);
    return output!;
  }
);

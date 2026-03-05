'use server';
/**
 * @fileOverview An AI flow to parse natural language search queries into structured filters.
 *
 * - parseSearchQuery - A function that handles the search parsing.
 * - SearchParserInput - The input type for the parseSearchQuery function.
 * - SearchParserOutput - The return type for the parseSearchQuery function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { allSubcategories } from '@/lib/categories';

const SearchParserInputSchema = z.string().describe('A natural language search query from a user.');
export type SearchParserInput = z.infer<typeof SearchParserInputSchema>;

// This schema should align with the Filters type in the frontend.
const SearchParserOutputSchema = z.object({
  searchQuery: z.string().optional().describe('A refined search query for text matching, combining the core product and location. For example, for "voiture rouge à Bamako", this should be "voiture rouge Bamako".'),
  category: z.string().optional().describe(`The category of the product. It MUST be one of the following valid categories: ${allSubcategories.join(', ')}`),
  minPrice: z.string().optional().describe('The minimum price, as a string of numbers ONLY. Example: "50000".'),
  maxPrice: z.string().optional().describe('The maximum price, as a string of numbers ONLY. Example: "150000".'),
  conditions: z.array(z.string()).optional().describe("An array containing the condition of the item if specified. The value MUST be one of: 'Neuf', 'Comme neuf', 'Occasion'.")
});
export type SearchParserOutput = z.infer<typeof SearchParserOutputSchema>;

export async function parseSearchQuery(input: SearchParserInput): Promise<SearchParserOutput> {
  return searchParserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchParserPrompt',
  input: { schema: SearchParserInputSchema },
  output: { schema: SearchParserOutputSchema },
  prompt: `You are an expert search query parser for an e-commerce marketplace in Mali called SuguMali. You are known as Mami.
Your task is to analyze the user's natural language query and convert it into a refined search query and a set of structured filter fields.

Here are the rules:
- The user query is: {{{prompt}}}.
- Create a 'searchQuery' by combining the core product name and any location specified. For example, for "iPhone 13 à ACI 2000", the searchQuery should be "iPhone 13 ACI 2000". This will be used for text matching.
- Identify a relevant product category. The category MUST be one of these valid options: ${allSubcategories.join(', ')}.
- Interpret pricing terms. For example, "pas cher" or "bon marché" might imply a 'maxPrice' of 50000 FCFA. "moins de 100000" means 'maxPrice: "100000"'. "plus de 200000" means 'minPrice: "200000"'. Prices are in FCFA.
- Identify the item's condition. The condition MUST be one of these valid options: 'Neuf', 'Comme neuf', 'Occasion'. Place it inside the 'conditions' array.
- If a field is not present in the query, do not include it in the output.
- The output MUST be a valid JSON object matching the requested schema.
- Respond ONLY with the JSON object. Do not add any conversational text or markdown.`,
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
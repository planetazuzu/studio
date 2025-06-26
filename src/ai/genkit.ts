
import { genkit } from 'genkit';

/**
 * A global Genkit instance.
 *
 * Plugins are configured dynamically within each flow based on the user's
 * request context (e.g., API key from cookies).
 */
export const ai = genkit();

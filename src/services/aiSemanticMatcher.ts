import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to use browser cache
env.allowLocalModels = false;
env.useBrowserCache = true;

// Pipeline singleton
let extractorPipeline: any = null;
let initPromise: Promise<any> | null = null;

// Cache of embeddings for invoice descriptions to avoid re-embedding
const embeddingCache = new Map<string, number[]>();

/**
 * Initializes the Feature Extraction Pipeline (Multilingual Embedding Model)
 */
export async function getExtractor() {
  if (extractorPipeline) return extractorPipeline;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Xenova/all-MiniLM-L6-v2 or Xenova/multilingual-e5-small are fast & lightweight ONNX models
      extractorPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      return extractorPipeline;
    } catch (err) {
      console.error('Error loading AI embedding model:', err);
      extractorPipeline = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Generates vector embedding for a given text string
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim().toLowerCase();
  if (embeddingCache.has(normalizedText)) {
    return embeddingCache.get(normalizedText)!;
  }

  const extractor = await getExtractor();
  const output = await extractor(normalizedText, { pooling: 'mean', normalize: true });
  const vector = Array.from(output.data) as number[];
  
  embeddingCache.set(normalizedText, vector);
  return vector;
}

/**
 * Calculates Cosine Similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SemanticMatchResult {
  matchedDescription: string;
  score: number;
}

/**
 * Finds the best conceptual semantic match for an ingredient among candidates
 */
export async function findBestSemanticMatch(
  ingredientName: string,
  candidateDescriptions: string[],
  minScoreThreshold = 0.55
): Promise<SemanticMatchResult | null> {
  if (!ingredientName || candidateDescriptions.length === 0) return null;

  try {
    const ingVector = await getEmbedding(ingredientName);

    let bestScore = -1;
    let bestMatch = '';

    for (const desc of candidateDescriptions) {
      const descVector = await getEmbedding(desc);
      const sim = cosineSimilarity(ingVector, descVector);

      if (sim > bestScore) {
        bestScore = sim;
        bestMatch = desc;
      }
    }

    if (bestScore >= minScoreThreshold) {
      return {
        matchedDescription: bestMatch,
        score: bestScore,
      };
    }
  } catch (err) {
    console.error('Error during AI semantic matching:', err);
  }

  return null;
}

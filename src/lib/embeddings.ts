import { env, pipeline } from '@xenova/transformers';

// Configuration to not use local models and fallback to cache
env.allowLocalModels = false;
env.useBrowserCache = false;

class PipelineSingleton {
  static task: any = 'feature-extraction';
  static model = 'Supabase/gte-small';
  static instance: any = null;

  static async getInstance(progress_callback: any = null) {
      if (this.instance === null) {
          this.instance = await pipeline(this.task, this.model, { progress_callback });
      }
      return this.instance;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await PipelineSingleton.getInstance();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

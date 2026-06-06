import type { GetJitiArgs } from '../utils/jiti.js';
import type { Seed, SeedProvider } from './seeder.js';
export declare class FileSeedProvider implements SeedProvider {
    #private;
    constructor(props: FileSeedProviderProps);
    getSeeds(seedNames?: string | string[]): Promise<Record<string, Seed>>;
}
export interface FileSeedProviderProps extends GetJitiArgs {
    seedFolder: string;
}

import type { Kysely } from 'kysely';
export declare class Seeder {
    #private;
    constructor(props: SeederProps);
    getSeeds(seedNames?: string | string[]): Promise<SeedInfo[]>;
    run(seedNames?: string | string[]): Promise<SeedResultSet>;
}
export interface Seed {
    seed(db: Kysely<any>): Promise<void>;
}
export interface SeedProvider {
    getSeeds(seedNames?: string | string[]): Promise<Record<string, Seed>>;
}
export interface SeederProps {
    db: Kysely<any>;
    provider: SeedProvider;
}
export interface SeedInfo {
    name: string;
    seed: Seed;
}
export interface SeedResultSet {
    readonly error?: unknown;
    readonly results: SeedResult[];
}
export interface SeedResult {
    readonly seedName: string;
    readonly status: 'Success' | 'Error' | 'NotExecuted';
}

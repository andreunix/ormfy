import type { Factory, OrFactory } from '../config/ormfy-config.js';
export declare function hydrate<F extends OrFactory<any, any[]> | undefined, P extends F extends OrFactory<any, infer A> | undefined ? A : never>(factory: F, parameters: P, defaultValue?: () => F extends OrFactory<infer T> ? T : never): Promise<Awaited<ReturnType<Extract<F, Factory<any>>>>>;

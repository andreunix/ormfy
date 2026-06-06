import type { OrmfyConfig } from './ormfy-config.js';
type PartialDeep<T> = T extends (...args: never[]) => unknown ? T : T extends object ? {
    [K in keyof T]?: PartialDeep<T[K]>;
} : T;
type PartialOrmfyConfig = PartialDeep<OrmfyConfig>;
export type DefineConfigInput = ((PartialOrmfyConfig & {
    extends: string | string[];
}) | (OrmfyConfig & {
    extends?: never;
}));
export declare const defineConfig: (input: DefineConfigInput) => DefineConfigInput;
export {};

import { type GetConfigArgs } from '../config/get-config.js';
import type { Seeder } from './seeder.js';
export declare function usingSeeder<T>(args: GetConfigArgs, callback: (seeder: Seeder) => Promise<T>): Promise<T>;

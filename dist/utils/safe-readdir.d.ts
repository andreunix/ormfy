import type { PathLike } from 'node:fs';
export declare function safeReaddir(path: PathLike): Promise<string[]>;

import type { Jiti } from 'jiti';
export interface GetJitiArgs {
    debug?: boolean;
    filesystemCaching?: boolean;
}
export declare function getJiti(args: GetJitiArgs): Promise<Jiti>;

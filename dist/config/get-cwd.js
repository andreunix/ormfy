import { resolve } from 'node:path';
const ACTUAL_CWD = process.cwd?.() || '';
let cwd;
export function getCWD(args) {
    return (cwd ||= args?.cwd ? resolve(ACTUAL_CWD, args.cwd) : ACTUAL_CWD);
}
//# sourceMappingURL=get-cwd.js.map
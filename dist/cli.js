import { createMain } from 'citty';
import { RootCommand } from './commands/root.js';
export function buildCLI() {
    const runCLI = createMain(RootCommand);
    return {
        parse: async (argv) => {
            await runCLI({ rawArgs: argv });
        },
    };
}
//# sourceMappingURL=cli.js.map
import { createInterface } from 'node:readline/promises';
import { consola } from '../utils/logger.js';
import { CommonArgs } from '../arguments/common.js';
import { getConfigOrFail } from '../config/get-config.js';
import { executeQuery } from '../kysely/execute-query.js';
import { inferDialectName } from '../kysely/infer-dialect-name.js';
import { usingKysely } from '../kysely/using-kysely.js';
import { createSubcommand } from '../utils/create-subcommand.js';
import { defineArgs } from '../utils/define-args.js';
import { defineCommand } from '../utils/define-command.js';
import { printCSV } from '../utils/print-csv.js';
const args = defineArgs({
    ...CommonArgs,
    format: {
        alias: 'f',
        default: 'csv',
        description: 'The format to output the result in.',
        options: ['csv', 'json'],
        required: false,
        type: 'enum',
    },
    query: {
        description: 'The SQL query to execute. When not provided, and not in CI, will open an interactive SQL shell.',
        required: Boolean(process.env.CI),
        type: 'positional',
    },
});
const Command = defineCommand(args, {
    meta: {
        name: 'sql',
        description: 'Execute SQL queries',
    },
    async run(context) {
        const { args } = context;
        assertQuery(args);
        const config = await getConfigOrFail(args);
        await usingKysely(config, async (kysely) => {
            const hydratedConfig = { ...config, kysely };
            if (args.query) {
                return await executeQueryAndPrint(args, hydratedConfig);
            }
            await startInteractiveExecution(args, hydratedConfig);
        });
    },
});
export const SqlCommand = createSubcommand('sql', Command);
function assertQuery(thing) {
    const { query } = thing;
    if ((!process.env.CI && typeof query !== 'string') ||
        (typeof query === 'string' && query.length > 0)) {
        return;
    }
    throw new Error('Query must be a non-empty string!');
}
async function executeQueryAndPrint(argz, config) {
    const result = await executeQuery({ sql: argz.query }, config);
    if (argz.format === 'json') {
        return consola.log(JSON.stringify(result, null, 2));
    }
    const { insertId, numAffectedRows, numChangedRows, rows } = result;
    const [row0] = rows;
    // write without result set or DDL.
    if (!row0 &&
        (insertId != null || numAffectedRows != null || numChangedRows != null)) {
        const summary = {
            'Affected Rows': numAffectedRows,
            'Changed Rows': numChangedRows,
            'Insert ID': insertId,
            rowCount: rows.length,
        };
        return printCSV([summary]);
    }
    return printCSV(rows);
}
async function startInteractiveExecution(argz, config) {
    while (true) {
        let query = await consola.prompt(getPrompt(argz, config), {
            cancel: 'null',
            placeholder: 'select 1;',
            required: true,
            type: 'text',
        });
        if (query == null) {
            return;
        }
        query = query.trim();
        if (isSafeword(query)) {
            return;
        }
        if (!query.endsWith(';')) {
            const readline = createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            do {
                const moreQuery = await readline.question('');
                query += ` ${moreQuery.trim()}`;
            } while (!query.endsWith(';'));
            readline.close();
        }
        try {
            await executeQueryAndPrint({ ...argz, query }, config);
        }
        catch (error) {
            consola.error(error instanceof Error ? error.message : error);
        }
    }
}
const SAFEWORDS = ['exit', 'quit', 'bye', ':q'];
function isSafeword(thing) {
    return SAFEWORDS.includes(thing);
}
function getPrompt(argz, config) {
    const { environment } = argz;
    const { dialect } = config;
    return [
        typeof dialect === 'string' ? dialect : inferDialectName(config.kysely),
        environment ? `(${environment})` : null,
        '>',
    ]
        .filter(Boolean)
        .join(' ');
}
//# sourceMappingURL=sql.js.map
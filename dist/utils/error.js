import { consola } from './logger.js';
export function exitWithError(error) {
    if (error instanceof AggregateError) {
        for (const subError of error.errors) {
            consola.error(subError);
        }
    }
    else {
        consola.error(error);
    }
    process.exit(1);
    throw error;
}
//# sourceMappingURL=error.js.map
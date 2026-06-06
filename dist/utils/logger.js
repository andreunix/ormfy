import { createInterface } from 'node:readline/promises';
export const LogLevels = {
    debug: 4,
};
export const consola = {
    level: 0,
    options: {
        formatOptions: {
            date: false,
        },
    },
    log(...args) {
        console.log(...args);
    },
    info(...args) {
        console.log(...args);
    },
    warn(...args) {
        console.warn(...args);
    },
    error(...args) {
        console.error(...args);
    },
    debug(...args) {
        if (this.level >= LogLevels.debug) {
            console.debug(...args);
        }
    },
    success(message) {
        console.log(`OK ${message}`);
    },
    fail(message) {
        console.error(`FAIL ${message}`);
    },
    start(message) {
        console.log(message);
    },
    box(message) {
        console.log(message);
    },
    async prompt(message, options = {}) {
        const readline = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        try {
            while (true) {
                const answer = await readline.question(`${message} `);
                if (answer === options.cancel) {
                    return null;
                }
                if (!options.required || answer.trim()) {
                    return answer;
                }
            }
        }
        finally {
            readline.close();
        }
    },
};
//# sourceMappingURL=logger.js.map
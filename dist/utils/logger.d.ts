export declare const LogLevels: {
    readonly debug: 4;
};
export declare const consola: {
    level: number;
    options: {
        formatOptions: {
            date: boolean;
        };
    };
    log(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    success(message: string): void;
    fail(message: string): void;
    start(message: string): void;
    box(message: string): void;
    prompt(message: string, options?: {
        cancel?: string | null;
        placeholder?: string;
        required?: boolean;
        type?: "text";
    }): Promise<string | null>;
};

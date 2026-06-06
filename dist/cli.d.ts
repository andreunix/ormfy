export interface CLI {
    parse(argv: string[]): Promise<void>;
}
export declare function buildCLI(): CLI;

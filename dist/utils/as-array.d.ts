export declare function asArray<T>(thing: T): T extends readonly (infer I)[] ? I[] : T[];

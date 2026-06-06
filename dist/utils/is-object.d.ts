export declare function isObject<T>(thing: T): thing is unknown extends T ? Record<string, unknown> : Exclude<Extract<T, object>, readonly unknown[]>;

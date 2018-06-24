export declare class IStatementRun {
    parallel: number;
    statement: string;
    tag: string;
    terminate_nr?: number;
    terminate_delta_t?: number;
}
export declare class ParseInput {
    fnin: string;
    src: string;
    constructor(fnin: string);
    parseIntArg(prefix: string, input: string, defaultValue: number): number;
    RegExpTagLine: RegExp;
    RegExpComment: RegExp;
    isComment(line: string): boolean;
    parseTagLine(line: string): {
        tag: string;
        tail: string;
    };
    /**
     * --[TAG] NP=x NP
     * @param input
     */
    parseString(input: string): IStatementRun[];
}

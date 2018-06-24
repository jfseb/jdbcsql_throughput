import { IStatementRun } from './constants';
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

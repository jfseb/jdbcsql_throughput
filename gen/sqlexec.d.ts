import { ISQLExecutor } from './constants';
export declare class SQLExec {
    Pool: any;
    constructor(options: any);
    makeAsciiTable(obj: any): any;
    makeRunner: (testpool: any) => ISQLExecutor;
    getExecutors(pool: any, nr: number): ISQLExecutor[];
    /**
     *
     * @param statement
     * @param testpool
     */
    runStatementFromPool(statement: string, testpool: any): Promise<any>;
}

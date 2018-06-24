import { Pool } from 'jdbc';
/**
 * Responses of a dispatcher
 */
export declare const enum ResponseCode {
    NOMATCH = 0,
    EXEC = 1,
    QUERY = 2,
}
import { IParallelOp, IParallelExecutor, ITimingMap, ITimingRec, IStatementRun } from './constants';
export declare function startOpMonitor(parexec: IParallelExecutor): void;
/**
 *  execute a statement repeatedly until one calls close on the handle.
 *
 *
 */
export declare function dumpProgress(op: IParallelOp): void;
export interface IResult {
    TAG: string;
    QPM: number;
    BAD: number;
    PAR: number;
    DUR: number;
    DDP: number;
    MAXM: number;
    CPU: number;
    MEM: number;
    MEU: number;
    PAR_N: number;
    QPM_N: number;
    DUR_N: number;
}
export declare function dumpDone(op: IParallelOp): IResult;
export declare function makeTimingRecord(res: any): ITimingMap;
export declare function registerTiming(time: number, rec: ITimingMap): void;
export declare function getBestTime(start: number, end: number): number;
export declare function getAvgLength(start: number, end: number): number;
export declare class IAvgRecord {
    MAX_MEM_USAGE_30s: number;
    MEM_USAGE: number;
    AGGR_PLAN_EXEC_DURATION: number;
    QUERY_PER_MIN: number;
    CPU_UTILIZATION: number;
    MEM_UTILIZATION: number;
    MAX_MEM_EVER: number;
    NR_PARALLEL_PLAN: number;
    PLAN_EXEC_DURATION: number;
    constructor();
}
export declare class IAvgSet {
    time: number;
    avg: number;
    values: IAvgRecord;
}
export declare const Keys: string[];
export declare function getBestAvg(start: number, recs: ITimingRec[]): IAvgSet;
export declare function dumpNice(v: any, len: number): string;
export declare function dumpAllResults(allresult: IResult[]): void;
export declare function dumpAllResultsToCSV(allresult: IResult[]): string;
export declare function startRun(fullconfig: any, input: IStatementRun[], testpool: Pool, options: any): void;
export declare function startSequence(fullconfig: any, input: IStatementRun[], testpool: Pool, options: any, current_index?: number): void;

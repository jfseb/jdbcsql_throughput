export declare const enum Status {
    RUNNING = 0,
    DONE = 2,
    STOPPED = 1,
    INITIAL = 3,
}
export declare const enum Mode {
    SEQUENTIAL = 0,
    PARALLEL = 1,
}
export interface ISQLExecutor {
    execStatement: (statement: string) => Promise<any>;
}
/** Struture read from file
*/
export declare class IStatementRun {
    tag: string;
    parallel: number;
    statement: string;
    terminate_nr?: number;
    terminate_delta_t?: number;
}
export interface IRun {
    index: number;
    statement: string;
    status: Status;
    duration: number;
    executor: ISQLExecutor;
}
export interface IMetrics {
    parallel: number;
    count_total: number;
    count_started: number;
    count_ok: number;
    sum_duration_all: number;
    count_bad: number;
}
export declare class Metrics implements IMetrics {
    parallel: number;
    count_started: number;
    count_total: number;
    sum_duration_all: number;
    count_ok: number;
    count_bad: number;
}
export interface IParallelExecutor {
    stopOp: (string) => void;
    triggerLoop: () => void;
    getHandles: () => string[];
    getOp: (hndl: string) => IParallelOp;
    startOpSequential: (tag: string, statement: string, cb: ICallbacks) => string;
    startSequentialSimple(statement: string): Promise<any>;
    changeParallelOp: (handle: string, parallel: number) => void;
    startOpRepeat: (tag: string, statement: string, parallel: number, options?: IOptions, cb?: ICallbacks) => string;
}
/**
 * Record of a result received
 */
export interface IResultRec {
    ts: string;
    /**
     * Time, absolute (Date.now())
     */
    t: number;
    delta_t: number;
    rc: boolean;
    res: any;
}
/**
 * allows to
 */
export interface ICallbacks {
    done?: (op: IParallelOp) => void;
    /**
     * Always invoked on any response
     */
    progress?: (op: IParallelOp, rc?: boolean) => void;
    /**
     * Only invoked on successful results
     */
    result?: (err: object, result: any) => void;
}
export declare type ITimingMap = Map<string, Map<number, number>>;
export interface ITimingRec {
    time: number;
    rec: ITimingMap;
}
export interface IOptions {
    continuous: boolean;
    forcename?: string;
    terminate_nr?: number;
    terminate_delta_t?: number;
    every_t?: number;
    t_last?: number;
}
export interface IParallelOp {
    tag: string;
    name: string;
    statement: string;
    status: Status;
    parallel: number;
    cps: any[];
    cp_running: number;
    options: IOptions;
    mode: Mode;
    t_started: number;
    logit?: (a: string) => void;
    slots: IRun[];
    allresults: IResultRec[];
    timings: ITimingRec[];
    metrics: IMetrics;
    callbacks?: ICallbacks;
    lastResult?: any;
    lastRC?: boolean;
}

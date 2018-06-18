/**
 * Responses of a dispatcher
 */
import { IParallelOp, IRun, ICallbacks, ITimingMap, IOptions, IParallelExecutor } from './constants';
export declare function isTerminated(op: IParallelOp): boolean;
export declare function recordStart(op: IParallelOp, slot: IRun): void;
export declare function recordEnd(op: IParallelOp, slot: IRun, rc: boolean, res: any): void;
export declare function recordOk(op: IParallelOp, run: IRun, res: any): void;
export declare function recordBad(op: IParallelOp, run: IRun, res: any): void;
export declare class ParallelExec implements IParallelExecutor {
    executorUsage: number[];
    executors: any[];
    constructor(executors: any[]);
    /**
     * execute a statement repeatedly until one calls close on the handle.
     *
     * @param {string} tag : identifying tag used in some output
     * part of IParallelOp.tag
     * @param options
     * @param cb : callback
     */
    startOpRepeat(tag: string, statement: string, parallel: number, options?: IOptions, cb?: ICallbacks): string;
    changeParallelOp(handle: string, parallel: number): void;
    startSequentialSimple(statement: string): Promise<any>;
    /**
     * Run a stingle statement sequential
     * @param statement
     */
    startOpSequential(tag: string, statement: string, cb: ICallbacks): string;
    triggerLoop(): void;
    /**
     * mark the operation with handle as STOPPED,
     * queries will continue to run and finish and fire events,
     * only then is the handle removed.
     * @param handle
     */
    stopOp(handle: string): void;
    /**
     * return the parallel op with the handle,
     * @param handle
     */
    getOp(handle: any): IParallelOp;
    getHandles(): string[];
    registerTiming(time: number, rec: ITimingMap): void;
    private assignMinUsedExecutor();
    private freeExecutorUsage(slots);
    private: any;
    scheduleOps(op: IParallelOp): void;
    private loopIt();
}

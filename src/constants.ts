
"use strict";
export const enum Status {
  RUNNING = 0,
  DONE = 2,
  STOPPED = 1,
  INITIAL = 3
}

export const enum Mode {
  SEQUENTIAL = 0,
  PARALLEL = 1
}

export interface ISQLExecutor {
  execStatement : (statement: string) => Promise<any>
}



export interface IRun {
  index: number,
  statement : string,
  status: Status,
  duration : number,
  executor : ISQLExecutor
};

export interface IMetrics {
  parallel : number,
  count_total : number,
  count_started : number,
  count_ok : number,
  sum_duration_all : number,
  count_bad : number,
}

export class Metrics implements IMetrics {
  parallel : number = 0;
  count_started : number = 0;
  count_total : number = 0;
  sum_duration_all : number = 0;
  count_ok: number = 0;
  count_bad: number = 0;
}

export interface IParallelExecutor {
  stopOp : (string) => void,
  triggerLoop : () => void,
  startOpSequential: (tag : string, statement: string, cb : ICallbacks) => string,
  startSequentialSimple(statement : string) : Promise<any>,
  changeParallelOp: (handle: string, parallel: number) => void,
  startOpRepeat: (
    tag: string,
    statement: string,
    parallel: number,
    options?: IOptions,
    cb? : ICallbacks) => string
};


/**
 * Record of a result received
 */
export interface IResultRec {
  ts : string,
  /**
   * Time, absolute (Date.now())
   */
  t : number,
  delta_t : number,
  rc : boolean,
  res : any
};

/**
 * allows to
 */
export interface ICallbacks {
  done? : ( op : IParallelOp ) => void,
  /**
   * Always invoked on any response
   */
  progress? : ( op : IParallelOp, rc? : boolean ) => void,
  /**
   * Only invoked on successful results
   */
  result? : (err : object, result : any) => void
}

export type ITimingMap = Map<string, Map<number, number> >;

export interface ITimingRec {
  time : number,
  rec : ITimingMap
};


export interface IOptions {
  continuous : boolean,
  forcename? : string,
  terminate_nr? : number,
  terminate_delta_t? : number,
  every_t? : number,
  t_last? : number
};

export interface IParallelOp {
  tag : string,
  name: string,
  statement: string,
  status: Status,
  parallel: number,
  cps : any[],
  cp_running: number,
  options : IOptions,
  mode : Mode,
  t_started : number,  /* number in ms when this was started*/
  logit?: (a: string) => void,
  slots: IRun[],
  allresults : IResultRec[],
  timings : ITimingRec[],
  metrics : IMetrics,
  callbacks? : ICallbacks,
  lastResult? : any,
  lastRC? : boolean
};


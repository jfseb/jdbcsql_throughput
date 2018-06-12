import { RateSampledAverage, EventSampledAverage } from '../aged_averages';

import * as debug from 'debug';
const debuglog = debug('average');
'use strict';

/**
 * Responses of a dispatcher
 */
export const enum ResponseCode {
  NOMATCH = 0,
  EXEC,
  QUERY
}

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

interface IRun {
  index: number,
  statement : string,
  status: Status,
  duration : number,
};

interface IMetrics {
  parallel: number,
  query_ok : RateSampledAverage,
  count_ok : number,
  count_bad : number,
  query_bad : RateSampledAverage,
  query_all : RateSampledAverage,
  query_duration : EventSampledAverage,
}

class Metrics implements IMetrics {
  parallel: number = 0;
  query_ok: RateSampledAverage = new RateSampledAverage();
  count_ok: number = 0;
  count_bad: number = 0;
  query_bad: RateSampledAverage = new RateSampledAverage();
  query_all: RateSampledAverage = new RateSampledAverage();
  query_duration: EventSampledAverage = new EventSampledAverage();
}

interface IResultRec {
  ts : string,
  t : number,
  delta_t : number,
  rc : boolean,
  res : any
};

interface IParallelOp {
  name: string,
  statement: string,
  status: Status,
  parallel: number,
  mode : Mode,
  continous: boolean,
  t_started : number,  /* number in ms when this was started*/
  logit?: (a: string) => void,
  slots: IRun[],
  allresults : IResultRec[],
  metrics : IMetrics
};

var handles = new Map<string, IParallelOp>();

export function isTerminated(op : IParallelOp) : boolean
{
  if (op.continous && (op.status != Status.STOPPED) && (op.status != Status.DONE))
    return false;
  return op.slots.every( run => run.status == Status.DONE );
}

export function recordStart(op : IParallelOp, slot: IRun)
{
  op.metrics.parallel++;
  if( op.t_started == 0) {
    op.t_started = new Date().getTime();
  }
  slot.status = Status.RUNNING;
  console.log( (Date.now()- op.t_started) + "S:"  + op.parallel + " " + op.metrics.count_ok + "/" + op.metrics.count_bad);
  slot.duration = Date.now();
}

export function recordEnd(op : IParallelOp, slot: IRun, rc : boolean, res : any)
{
  slot.status = Status.DONE;
  op.metrics.parallel--;
  slot.duration = Date.now() - slot.duration;
  console.log( (Date.now()- op.t_started) + "E:"  + op.parallel + " " + op.metrics.count_ok + "/" + op.metrics.count_bad + ' ' +  slot.duration + ' ' + slot.index + ' ' + JSON.stringify(res));
  if( rc )
  {
    op.metrics.count_ok++;
    op.metrics.query_ok.AddSample();
  }
  else {
    op.metrics.count_bad++;
    op.metrics.query_bad.AddSample();
  }
  op.metrics.query_all.AddSample();
  op.metrics.query_duration.AddSample(slot.duration);
  var d = new Date();
  op.allresults.push({ ts :  d.toUTCString(), t : d.getTime(), delta_t : d.getTime() - op.t_started, rc : rc, res : res});
}

export function recordOk(op: IParallelOp, run: IRun, res : any) {
 /* res.conn.close(function(err, ok) {
    if(err)
     console.log('error closing' + err);
  });*/
  recordEnd(op,run, true, res.result);
}

export function recordBad(op: IParallelOp, run: IRun, res : any) {
  console.log('BADD!!!!' + res);
  recordEnd(op,run, false, res);
}

var tcnt = 0;

export function scheduleOps(op : IParallelOp, sqlexec : any) {
  while(op.slots.length < op.parallel) {
    op.slots.push( { index : ++tcnt, statement : op.statement, status : Status.INITIAL,
    duration : 0 } );
  }
  debuglog('augmenting parallel ' + op.slots.length);
  if (op.status == Status.STOPPED) {
    return;
  }
  op.slots.every(entry => {
    if((op.continous && entry.status != Status.RUNNING ) || entry.status == Status.INITIAL)
    {
      entry.status = Status.RUNNING;
      recordStart(op,entry);
      debuglog(op.statement);
      sqlexec.execStatement(entry.statement).then( res =>
        {
          recordOk(op,entry,res);
          loopIt(sqlexec);
        }
      ).catch( err => {
        recordBad(op, entry, err);
        loopIt(sqlexec);
      });
      return (op.mode != Mode.SEQUENTIAL); // when sequential, stop after first scheduling
    }
    return true;
  });
}

export function loopIt( sqlexec: any) : void
{
  var removeKey : string[] = [];
  handles.forEach(function(op , key)
  {
    debuglog('looking at' + key + ' value ' + op.name);
    if (isTerminated(op)) {
      console.log('is terminated:' + op.name);
      removeKey.push(key);
    }
    scheduleOps(op, sqlexec);
  });
  removeKey.forEach( key => handles.delete(key));
}

var cnt = 0;
/**
 *  execute a statement repeatedly until one calls close on the handle.
 *
 *
 */
export function startOpRepeat(statement: string, parallel: number): string {
  var d = new Date();
  var op: IParallelOp = {
    name: d.toUTCString() + cnt++,
    statement: statement,
    t_started : 0,
    mode : Mode.PARALLEL,
    status: Status.RUNNING,
    parallel: parallel,
    continous: true,
    slots: [],
    allresults : [],
    metrics : new Metrics()
  };
  handles.set(op.name, op);
  return op.name;
}

export function startOpSequential(statement: string): string {
  var d = new Date();
  var op: IParallelOp = {
    name: 'sequential',
    statement: statement,
    t_started : 0,
    status: Status.RUNNING,
    parallel: 1,
    continous: false,
    mode : Mode.SEQUENTIAL,
    slots: [],
    allresults : [],
    metrics : new Metrics()
  };
  if(handles.has(op.name)) {
    op = handles.get('sequential');
  } else {
    handles.set(op.name, op);
  }
  op.status = Status.RUNNING;
  op.slots.push( {
    index : op.slots.length,
    statement : statement,
    duration : 0,
    status: Status.INITIAL
  });
  handles.set(op.name, op);
  return op.name;
}

export function stopOp(handle: string) {
  if (handles.has(handle)) {
    console.log('STOPPING NOW!!!!!!!!!!!!!!!!!!!!');
    handles.get(handle).status = Status.STOPPED;
  }
};
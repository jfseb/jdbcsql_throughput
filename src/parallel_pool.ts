
import * as debug from 'debug';
const debuglog = debug('average');
'use strict';

import {Forks} from './sqlexec_remote';
var SQLExec = require('./sqlexec.js').SQLExec;

import { ISQLExecutor, IParallelOp, Status,
  Mode,
  IRun,
  Metrics,
  ICallbacks,
  IMetrics,
  IOptions,
  IParallelExecutor,
  ITimingMap,
  IResultRec,
  ITimingRec } from './constants';


export class ParallelPool {
  executors : ISQLExecutor[];
  forks: Forks;
  pool : any;
  constructor(nrexec : number, pool: any, fullconfig : any) {
      var nrForks = Math.floor( (nrexec-1) / 4);
      this.pool = pool;
      console.log('settign up ' + nrForks + ' forks');
      this.forks = new Forks(nrForks , fullconfig);
      ;
  };
  getExecutors() {
    if(!this.executors) {
        this.executors = (new SQLExec()).getExecutors(this.pool,4);
        this.executors = this.executors.concat(this.forks.getExecutors(4));
    }
    return this.executors;
  }
  stop() {
    this.forks && this.forks.stop();
  }
}

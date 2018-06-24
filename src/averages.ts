

import {Pool} from 'jdbc';
import {ParallelExec} from './parallel_exec';
import * as csv_stringify from 'csv-stringify/lib/sync';
import * as debug from 'debug';
import { INSPECT_MAX_BYTES } from 'buffer';
const debuglog = debug('average');
'use strict';
import * as _ from 'lodash';
/**
 * Responses of a dispatcher
 */
export const enum ResponseCode {
  NOMATCH = 0,
  EXEC,
  QUERY
}


import { ISQLExecutor, IParallelOp, Status,
  Mode,
  IRun,
  Metrics,
  IMetrics,
  ICallbacks,
  IOptions,
  IParallelExecutor,
  ITimingMap,
  IResultRec,
  ITimingRec } from './constants';

var handles = new Map<string, IParallelOp>();


var index = 0;
var allresults = [];

var forks : Forks = undefined;

var SQLExec2 = require('./sqlexec.js');
var SQLExec = SQLExec2.SQLExec;

//import {SQLExec} from './sqlexec.js';
import {Forks} from './sqlexec_remote';

var parexec : IParallelExecutor = undefined;

/*
export function isTerminated(op : IParallelOp) : boolean
{
  if (op.cp_running > 0) {
    return false;
  }
  debuglog(' t/s/f  ' + op.tag + ' ' + op.options.terminate_nr  + '/' + op.metrics.count_started + '/' + op.metrics.count_total);
  if (op.options && (op.options.terminate_nr > 0) && op.metrics.count_total >= op.options.terminate_nr )
  {
    op.status = Status.STOPPED;
    return true;
  }
  if (op.options.continuous && (op.status != Status.STOPPED) && (op.status != Status.DONE))
    return false;
  if (op.options.continuous && op.options.every_t && op.status == Status.STOPPED) {
    return true;
  }
  return op.slots.every( run => run.status == Status.DONE );
}*/


var t_total : number = 0;

/*
export function recordStart(op : IParallelOp, slot: IRun)
{
  op.metrics.parallel++;
  if( op.t_started == 0) {
    op.t_started = Date.now();
  }
  slot.status = Status.RUNNING;
  console.log('S' + (Date.now()- t_total) + ' ' +  (Date.now()- op.t_started) + "S:"  + op.parallel + " " + op.metrics.count_started + "/" + op.metrics.count_total + "/" + op.metrics.count_bad + " " + op.name);
  slot.duration = Date.now();
}

export function recordEnd(op : IParallelOp, slot: IRun, rc : boolean, res : any)
{
  slot.status = Status.DONE;
  op.metrics.parallel--;
  op.metrics.count_total++;
  slot.duration = Date.now() - slot.duration;
  op.metrics.sum_duration_all += slot.duration;
  console.log( 'E' + (Date.now()- t_total) + ' ' + (Date.now()- op.t_started) + "E:"  + op.parallel + " " + op.metrics.count_started + "/" + op.metrics.count_total + "/" + op.metrics.count_ok + "/" + op.metrics.count_bad + ' ' +  slot.duration + ' ' + slot.index + ' len=' + (_.isArray(res) ?  res.length : res)  + ' ' + op.name); //
  debuglog(JSON.stringify(res));
  if( rc )
  {
    op.metrics.count_ok++;
  }
  else {
    op.metrics.count_bad++;
  }
  var d = new Date();
  if (rc && op.callbacks && op.callbacks.result ) {
    // console.log('having result ' + JSON.stringify(res));
    try {
      op.callbacks.result(undefined, res);
    } catch( ex) {
      console.log(ex.toString());
      console.log(ex.stack);
    }
  }
  op.allresults.push({ ts :  d.toUTCString(), t : d.getTime(), delta_t : d.getTime() - op.t_started, rc : rc, res : res});
  if (rc && op.callbacks && op.callbacks.progress)
  {
    if (rc && op.callbacks && op.callbacks.progress) {
      try {
        op.callbacks.progress(op);
      } catch( ex) {
          console.log(ex.toString());
          console.log(ex.stack);
      }
    }
  }
}

export function recordOk(op: IParallelOp, run: IRun, res : any) {
 /-* res.conn.close(function(err, ok) {
    if(err)
     console.log('error closing' + err);
  });*-/
  recordEnd(op, run, true, res.result);
}

export function recordBad(op: IParallelOp, run: IRun, res : any) {
  console.log('BADD!!!!' + res);
  recordEnd(op,run, false, res);
}
*/


var tcnt = 0;

export function startOpMonitor(parexec : IParallelExecutor) {

  parexec.startOpRepeat(
    "monitor",
    'SELECT * FROM SYS.INTERNAL_REL_NODE_RT_AVG;',
    4,
    {
      forcename : "monitor",
      continuous : true,
      t_last : 0,
      every_t : 2000, // every second!
    },
    /*callbacks :*/
    {
      result : function(err, res) {
        if(!err) {
          var timing = makeTimingRecord(res);
          registerTiming(Date.now(), timing);
        }
      }
    }
  )
  /*
  var d = new Date();
  var op: IParallelOp = {
    tag : "monitor",
    name: "monitor",
    statement: 'SELECT * FROM SYS.INTERNAL_REL_NODE_RT_AVG;',
    t_started : 0,
    mode : Mode.PARALLEL,
    status: Status.RUNNING,
    parallel : 4,
    options : {
      continuous : true,
      t_last : 0,
      every_t : 2000, // every second!
    },
    cps : [],
    cp_running : 0,
    slots: [],
    timings: [],
    allresults : [],
    metrics : new Metrics(),
    callbacks : {
      result : function(err, res) {
        if(!err) {
          var timing = makeTimingRecord(res);
          registerTiming(Date.now(), timing);
        }
      }
    }
  };
  *
  handles.set(op.name, op);
  return op.name;
}
*/
}

var cnt = 0;
import * as child_process from 'child_process';
import * as fs from 'fs';
import { removeListener, fork } from 'cluster';
import { LOADIPHLPAPI } from 'dns';
/**
 *  execute a statement repeatedly until one calls close on the handle.
 *
 *
 */
export function startOpRepeat(tag: string, statement: string, parallel: number, options: IOptions = undefined, cb : ICallbacks = undefined): string {
  var d = new Date();
  var op: IParallelOp = {
    tag : tag,
    name: tag + '_' + cnt++,
    statement: statement,
    t_started : 0,
    mode : Mode.PARALLEL,
    status: Status.RUNNING,
    parallel: parallel,
    options : {
      continuous : true,
      terminate_nr : options && options.terminate_nr,
      terminate_delta_t : options && options.terminate_delta_t,
    },
    cps :[],
    cp_running: 0,
    slots: [],
    timings: [],
    allresults : [],
    callbacks : cb,
    metrics : new Metrics()
  };

  // the jdbc driver is limiting to ~4 parallel requests
  var terminate_nr = options.terminate_nr;
  handles.set(op.name, op);
  return op.name;
}

export function dumpProgress(op : IParallelOp) {
  var avg = getBestAvg(op.t_started, op.timings);
  console.log(' dump progress ' + op.metrics.count_total);
  if( op.metrics.count_total > 1) {
    console.log( op.metrics.count_total * 1000 * 60 / (Date.now() - op.t_started) + ' qps; ' + (op.metrics.count_bad * 100 / op.metrics.count_total) +  ' BEST_AVG:' + JSON.stringify(avg));
  }
}
export interface IResult {
TAG: string,
QPM : number,
BAD : number,
PAR : number,
DUR : number,
DDP : number,
MAXM : number,
CPU : number,
MEM : number,
MEU : number,
PAR_N : number,
QPM_N : number,
DUR_N : number
};

export function dumpDone(op : IParallelOp): IResult {
  console.log("******* DONE ");
  var avg = getBestAvg(op.t_started, op.timings);
  console.log( op.metrics.count_total * 1000 * 60 / (Date.now() - op.t_started) + ' qps' + (op.metrics.count_bad * 100 / op.metrics.count_total) +  ' BEST_AVG:' + JSON.stringify(avg));
  var avgx : any = avg.values;
  console.log( 'QPM\t|BAD%\t|PAR'
          + '\t|DUR'
          + '\t|DDP'
          + '\t|MAX_MEM'
          + '\t|CPU%'
          + '\t|MEM%'
          + '\t|MEU'
          + '\t|QPM_N'
          + '\t|PAR_P'
          + '\t|AGGR_PLAN_EXEC_DURATION'
          )
  var result : IResult = {
    TAG : op.tag,
    QPM : Math.floor(op.metrics.count_total * 1000 * 60 / (Date.now() - op.t_started)) ,
    BAD : (op.metrics.count_bad * 100 / op.metrics.count_total),
    PAR :  (op.parallel ),
    DUR : Math.floor(op.metrics.sum_duration_all / (100*op.metrics.count_total ))/10,
    DDP : Math.floor(op.metrics.sum_duration_all / (100*op.parallel*op.metrics.count_total ))/10,
    MAXM : avgx.MAX_MEM_EVER ,
    CPU :  avgx.CPU_UTILIZATION,
    MEM : avgx.MEM_UTILIZATION,
    MEU : avgx.MEM_USAGE,
    QPM_N : avgx.QUERY_PER_MIN,
    PAR_N :  avgx.NR_PARALLEL_PLAN,
    DUR_N : avgx.AGGR_PLAN_EXEC_DURATION
  };
  dumpAllResults([result]);
  console.log( result.TAG +
       + '\t|' + result.QPM
       + '\t|' + result.BAD
       + '\t|' + (op.parallel )
       + '\t|' + result.DUR,
       + '\t|' + result.DDP,
       + '\t|' + avgx.MAX_MEM_EVER
       + '   \t|' + avgx.CPU_UTILIZATION
       + '\t|' + result.MEM,
       + '\t|' + result.MEU,
       + '\t|' + avgx.NR_PARALLEL_PLAN
       + '\t|' + avgx.QUERY_PER_MIN
       + '\t|' + avgx.AGGR_PLAN_EXEC_DURATION
  );
  return result;
}

export function makeTimingRecord(res : any) : ITimingMap {
  var result : ITimingMap = new Map<string, Map<number, number> >();
  Keys.forEach(key => {
    res.forEach( rec => {
      if (rec.NAME == key) {
        debuglog( ' found record ' + rec.VALUE + " " + JSON.stringify(rec));
        if(!result.has(key)) {
          result.set(key, new Map<number,number>());
        }
        var mp = result.get(key);
        mp.set(parseInt(rec.NR), parseInt(rec.VALUE));
      }
    });
  });
  return result;
}

export function registerTiming( time : number, rec : ITimingMap)
{
  handles.forEach(function(op) {
    if(op.status != Status.STOPPED)
    {
      op.timings.push({ time : time, rec : rec});
      //console.log( 'timing length now' + op.timings.length);
    }
  });
}

export function getBestTime(start : number, end : number )
{
  return start + (end - start)*0.8;
}

export function getAvgLength( start : number, end : number )
{
  return (end-start) * 0.2;
}

export class IAvgRecord {
  MAX_MEM_USAGE_30s : number = 0;
  MEM_USAGE : number = 0;
  AGGR_PLAN_EXEC_DURATION : number = 0;
  QUERY_PER_MIN : number = 0;
  CPU_UTILIZATION : number = 0;
  MEM_UTILIZATION : number = 0;
  MAX_MEM_EVER : number = 0;
  NR_PARALLEL_PLAN : number = 0;
  PLAN_EXEC_DURATION : number = 0;
  constructor() {}
};

export class IAvgSet {
  time : number = 0;
  avg : number = 0;
  values : IAvgRecord = new IAvgRecord();
};

export const Keys = Array.from(Object.keys(new IAvgRecord()));
export function getBestAvg(start : number,  recs :  ITimingRec[]) : IAvgSet
{
  // find the maximum of ITimingRec[]
  //recs.forEach(entry => console.log(' time is ' + entry.time ))
  const end_time = recs.reduce( (prev,current) => (current.time > prev)? current.time: prev , 0);
  const best_time = getBestTime(start, end_time);
  debuglog( 'start' + (start - t_total) + ' end' + (end_time - t_total) + ' best' + ( best_time - t_total) );
  if( recs.length < 3)
  {
    console.log("warning, timing length low" + recs.length);
  }
  recs.forEach(rec =>
    debuglog('at ' + (rec.time - t_total)));
  const bestTimingRec = recs.reduce( (prev, current) =>  (!prev || (current.time < best_time)) ? current : prev , undefined);
  var result : IAvgSet =
  {
    time : 0,
    avg : 0,
    values : new IAvgRecord
  };
  const best_avg = getAvgLength(start, end_time);
  debuglog('best avg length ' + best_avg);
  var actual_best_avg = 0;
  if ( bestTimingRec )
  {
    debuglog('got a best record!!');
    Keys.forEach(key => {
    var rec = bestTimingRec.rec.get(key);
    var sortedIntArr = Array.from(rec.keys()).map(k => parseInt(' ' + k)).sort();
    debuglog('sortedIntArr' + sortedIntArr);
    result.values[key] = sortedIntArr.reduce((prev, time) =>
       {
         if((time < best_avg))
         {
           actual_best_avg = time;
           return rec.get(time);
         } else {
           return prev;
          }
        }
       , 0);
      });
    }
  debuglog('best avg' + actual_best_avg);
  result.avg = actual_best_avg;
  result.time = bestTimingRec && bestTimingRec.time;
  return result;
}

export function dumpNice(v : any, len : number) {
  var s = '' + v;
  while(s.length < len) {
    s = ' ' + s;
  }
  return s;
}


  //var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);

  //QPM     |BAD%   |PAR    |NR_PARALLEL_PLAN       |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
  //10      |0      |4      |4      |165    |94     |173    |169    |2624
  //QPM     |BAD%   |PAR    |PAR_P  |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
  //10      |0      |8      |4      |174    |98     |171    |1      |2761


export function dumpAllResults(allresult : IResult[]) {
  if(allresult.length == 0) {
    return;
  }
  var s1 = Object.keys(allresult[0]).map( key => dumpNice(key,10)).join(",");
  console.log(s1);
  allresult.forEach(entry =>
  {
    var sn =  Object.keys(entry).map( key => dumpNice(entry[key],10)).join(',');
    console.log(sn);
  });
}

export function dumpAllResultsToCSV(allresult : IResult[]) {
  if(allresult.length == 0) {
    return "";
  }
  var headers = {};
  var s1 = Object.keys(allresult[0]).map( key =>{ headers[key] = key});

  var headersarr = Array.from(Object.keys(allresult[0]));
  console.log(csv_stringify([[1,2],[3,4]]));

  console.log(csv_stringify([{a : 1, b: 2}], {
     header: true, columns : ['a','b']
    }
  ));

  return csv_stringify(allresult, { header : true, columns: headersarr} )
 /* var columns = {
    year: 'birthYear',
    phone: 'phone'
   };
   var stringifier = stringify({ header: true, columns: columns });


  console.log(s1);
  allresult.forEach(entry =>
  {
    var sn =  Object.keys(entry).map( key => dumpNice(entry[key],10)).join(',');
    console.log(sn);
  });
  */
}


export function startSequence(configFileName : string, testpool: Pool, current_index = 0) {

  //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
  //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';

  //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 100 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';

  var tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
  var parq_1m_zip = 'select max(VCHAR50RNDVL), vchar4dic6, avg(UINT64_RND) from GEN_1M_PAR_ZIP group by VCHAR4DIC6;';

  //ALTERD
  //tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 1000 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';


  var arr = [
    { PAR : 1,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR : 2,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
  // { PAR : 3,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR : 4,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
  // { PAR : 6,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR : 8,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
  //  { PAR :10,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :12,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :16,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :20,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :32,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'}
  ];
  arr.forEach( entry => entry['TAG'] = 'TCP_P_' + entry.PAR );
  arr.forEach( entry => entry['TAG'] = 'P1Z_P_' + entry.PAR );
  arr.forEach( entry => entry['statement'] = tcp_001_4 );
  arr.forEach( entry => entry['statement'] = parq_1m_zip );
  arr.forEach( entry => entry['MAX_NR'] = 40 );


  if (current_index == 0) {
    // create the forks!
    var max_parallel = arr.reduce(  (prev, entry) => Math.max(prev, entry.PAR), 0 );
    var nrForks = Math.ceil(max_parallel / 4);
    forks = new Forks(nrForks , configFileName);
    ;
  }
  var hndl = startOpMonitor(parexec);

  var executors : ISQLExecutor[];
  executors = SQLExec.getExecutors(testpool,4);
  executors = executors.concat(forks.getExecutors(4));
  parexec = new ParallelExec(executors);
  //var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);

  //QPM     |BAD%   |PAR    |NR_PARALLEL_PLAN       |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
  //10      |0      |4      |4      |165    |94     |173    |169    |2624
  //QPM     |BAD%   |PAR    |PAR_P  |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
  //10      |0      |8      |4      |174    |98     |171    |1      |2761


  var showOp = dumpProgress;
  var makeNext = function (op)  {
    var res = dumpDone(op);
    allresults.push(res);
    dumpAllResults(allresults);
    parexec.stopOp('monitor');
    parexec.stopOp(handle);
    parexec.triggerLoop();
    //loopIt(executor);
    ++index;
    if(index < arr.length) {
      console.log("*** INDEX");
      startSequence(configFileName, testpool, index);
    } else {
      forks.stop();
    }
  };

  handle = parexec.startOpRepeat( arr[current_index].TAG, arr[current_index].statement, arr[current_index].PAR, {continuous : true,  terminate_nr : arr[current_index].MAX_NR },
    {
      progress : showOp,
      done : makeNext
    });

  parexec.triggerLoop();
  var handle;
  setTimeout( function() {
  }, 500);

  // beware, this only stops when all queries are completed;
  /*
  setTimeout( function() {
    console.log('stopping now');
    stopOp(handle);
    loopIt(executor);
  }, 200000);
  */

}; /* startsequence*/

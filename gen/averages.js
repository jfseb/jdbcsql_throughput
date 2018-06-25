"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parallel_exec_1 = require("./parallel_exec");
const parallel_pool_1 = require("./parallel_pool");
const csv_stringify = require("csv-stringify/lib/sync");
const debug = require("debug");
const debuglog = debug('averages');
'use strict';
/**
 * Responses of a dispatcher
 */
var ResponseCode;
(function (ResponseCode) {
    ResponseCode[ResponseCode["NOMATCH"] = 0] = "NOMATCH";
    ResponseCode[ResponseCode["EXEC"] = 1] = "EXEC";
    ResponseCode[ResponseCode["QUERY"] = 2] = "QUERY";
})(ResponseCode = exports.ResponseCode || (exports.ResponseCode = {}));
//import { ParallelPool, SQLExec, ParallelExecutor, Constants } from './parallel_exec';
//import { IResultRec } from './constants';
var index = 0;
var allresults = [];
var SQLExec2 = require('./sqlexec.js');
var SQLExec = SQLExec2.SQLExec;
var parpool = undefined;
var parexec = undefined;
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
var t_total = 0;
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
function startOpMonitor(parexec) {
    parexec.startOpRepeat("monitor", 'SELECT * FROM SYS.INTERNAL_REL_NODE_RT_AVG;', 4, {
        forcename: "monitor",
        continuous: true,
        t_last: 0,
        every_t: 2000,
    }, 
    /*callbacks :*/
    {
        result: function (err, res) {
            if (!err) {
                var timing = makeTimingRecord(res);
                registerTiming(Date.now(), timing);
            }
        }
    });
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
exports.startOpMonitor = startOpMonitor;
var cnt = 0;
const fs = require("fs");
/**
 *  execute a statement repeatedly until one calls close on the handle.
 *
 *
 */
/*
export function XstartOpRepeat(tag: string, statement: string, parallel: number, options: IOptions = undefined, cb : ICallbacks = undefined): string {
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
  xhandles.set(op.name, op);
  return op.name;
}*/
function dumpProgress(op) {
    var avg = getBestAvg(op.t_started, op.timings);
    console.log(' dump progress ' + op.metrics.count_total + ' timings: ' + (op.timings && op.timings.length));
    if (op.metrics.count_total > 1) {
        console.log(op.metrics.count_total * 1000 * 60 / (Date.now() - op.t_started) + ' qps; ' + (op.metrics.count_bad * 100 / op.metrics.count_total) + ' BEST_AVG:' + JSON.stringify(avg));
    }
}
exports.dumpProgress = dumpProgress;
;
function dumpDone(op) {
    console.log("******* DONE ");
    var avg = getBestAvg(op.t_started, op.timings);
    console.log(op.metrics.count_total * 1000 * 60 / (Date.now() - op.t_started) + ' qps' + (op.metrics.count_bad * 100 / op.metrics.count_total) + ' BEST_AVG:' + JSON.stringify(avg));
    var avgx = avg.values;
    console.log('QPM\t|BAD%\t|PAR'
        + '\t|DUR'
        + '\t|DDP'
        + '\t|MAX_MEM'
        + '\t|CPU%'
        + '\t|MEM%'
        + '\t|MEU'
        + '\t|QPM_N'
        + '\t|PAR_P'
        + '\t|AGGR_PLAN_EXEC_DURATION');
    var result = {
        TAG: op.tag,
        QPM: Math.floor(op.metrics.count_total * 1000 * 60 / (Date.now() - op.t_started)),
        BAD: (op.metrics.count_bad * 100 / op.metrics.count_total),
        PAR: (op.parallel),
        DUR: Math.floor(op.metrics.sum_duration_all / (100 * op.metrics.count_total)) / 10,
        DDP: Math.floor(op.metrics.sum_duration_all / (100 * op.parallel * op.metrics.count_total)) / 10,
        MAXM: avgx.MAX_MEM_EVER,
        CPU: avgx.CPU_UTILIZATION,
        MEM: avgx.MEM_UTILIZATION,
        MEU: avgx.MEM_USAGE,
        QPM_N: avgx.QUERY_PER_MIN,
        PAR_N: avgx.NR_PARALLEL_PLAN,
        DUR_N: avgx.AGGR_PLAN_EXEC_DURATION
    };
    dumpAllResults([result]);
    console.log(result.TAG +
        +'\t|' + result.QPM
        + '\t|' + result.BAD
        + '\t|' + (op.parallel)
        + '\t|' + result.DUR, +'\t|' + result.DDP, +'\t|' + avgx.MAX_MEM_EVER
        + '   \t|' + avgx.CPU_UTILIZATION
        + '\t|' + result.MEM, +'\t|' + result.MEU, +'\t|' + avgx.NR_PARALLEL_PLAN
        + '\t|' + avgx.QUERY_PER_MIN
        + '\t|' + avgx.AGGR_PLAN_EXEC_DURATION);
    return result;
}
exports.dumpDone = dumpDone;
function makeTimingRecord(res) {
    var result = new Map();
    exports.Keys.forEach(key => {
        res.forEach(rec => {
            if (rec.NAME == key) {
                debuglog(' found record ' + rec.VALUE + " " + JSON.stringify(rec));
                if (!result.has(key)) {
                    result.set(key, new Map());
                }
                var mp = result.get(key);
                mp.set(parseInt(rec.NR), parseInt(rec.VALUE));
            }
        });
    });
    return result;
}
exports.makeTimingRecord = makeTimingRecord;
function registerTiming(time, rec) {
    var handles = parexec.getHandles();
    handles.forEach(function (hndl) {
        var op = parexec.getOp(hndl);
        if (op.status != 1 /* STOPPED */) {
            op.timings.push({ time: time, rec: rec });
            debuglog('adding timing length now' + op.timings.length);
        }
    });
}
exports.registerTiming = registerTiming;
function getBestTime(start, end) {
    return start + (end - start) * 0.8;
}
exports.getBestTime = getBestTime;
function getAvgLength(start, end) {
    return (end - start) * 0.2;
}
exports.getAvgLength = getAvgLength;
class IAvgRecord {
    constructor() {
        this.MAX_MEM_USAGE_30s = 0;
        this.MEM_USAGE = 0;
        this.AGGR_PLAN_EXEC_DURATION = 0;
        this.QUERY_PER_MIN = 0;
        this.CPU_UTILIZATION = 0;
        this.MEM_UTILIZATION = 0;
        this.MAX_MEM_EVER = 0;
        this.NR_PARALLEL_PLAN = 0;
        this.PLAN_EXEC_DURATION = 0;
    }
}
exports.IAvgRecord = IAvgRecord;
;
class IAvgSet {
    constructor() {
        this.time = 0;
        this.avg = 0;
        this.values = new IAvgRecord();
    }
}
exports.IAvgSet = IAvgSet;
;
exports.Keys = Array.from(Object.keys(new IAvgRecord()));
function getBestAvg(start, recs) {
    // find the maximum of ITimingRec[]
    //recs.forEach(entry => console.log(' time is ' + entry.time ))
    const end_time = recs.reduce((prev, current) => (current.time > prev) ? current.time : prev, 0);
    const best_time = getBestTime(start, end_time);
    debuglog('start' + (start - t_total) + ' end' + (end_time - t_total) + ' best' + (best_time - t_total));
    if (recs.length < 3) {
        console.log("warning, timing length low" + recs.length);
    }
    recs.forEach(rec => debuglog('at ' + (rec.time - t_total)));
    const bestTimingRec = recs.reduce((prev, current) => (!prev || (current.time < best_time)) ? current : prev, undefined);
    var result = {
        time: 0,
        avg: 0,
        values: new IAvgRecord
    };
    const best_avg = getAvgLength(start, end_time);
    debuglog('best avg length ' + best_avg);
    var actual_best_avg = 0;
    if (bestTimingRec) {
        debuglog('got a best record!!');
        exports.Keys.forEach(key => {
            var rec = bestTimingRec.rec.get(key);
            var sortedIntArr = Array.from(rec.keys()).map(k => parseInt(' ' + k)).sort((a, b) => a - b);
            debuglog('sortedIntArr' + sortedIntArr);
            result.values[key] = sortedIntArr.reduce((prev, time) => {
                if ((time < best_avg)) {
                    actual_best_avg = time;
                    return rec.get(time);
                }
                else {
                    return prev;
                }
            }, 0);
        });
    }
    debuglog('best avg' + actual_best_avg);
    result.avg = actual_best_avg;
    result.time = bestTimingRec && bestTimingRec.time;
    return result;
}
exports.getBestAvg = getBestAvg;
function dumpNice(v, len) {
    var s = '' + v;
    while (s.length < len) {
        s = ' ' + s;
    }
    return s;
}
exports.dumpNice = dumpNice;
//var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);
//QPM     |BAD%   |PAR    |NR_PARALLEL_PLAN       |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
//10      |0      |4      |4      |165    |94     |173    |169    |2624
//QPM     |BAD%   |PAR    |PAR_P  |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
//10      |0      |8      |4      |174    |98     |171    |1      |2761
function dumpAllResults(allresult) {
    if (allresult.length == 0) {
        return;
    }
    var s1 = Object.keys(allresult[0]).map(key => dumpNice(key, 10)).join(",");
    console.log(s1);
    allresult.forEach(entry => {
        var sn = Object.keys(entry).map(key => dumpNice(entry[key], 10)).join(',');
        console.log(sn);
    });
}
exports.dumpAllResults = dumpAllResults;
function dumpAllResultsToCSV(allresult) {
    if (allresult.length == 0) {
        return "";
    }
    var headersarr = Array.from(Object.keys(allresult[0]));
    return csv_stringify(allresult, { header: true, columns: headersarr });
}
exports.dumpAllResultsToCSV = dumpAllResultsToCSV;
function startRun(fullconfig, input, testpool, options, callback) {
    options.fnout = options.fnout || 'out.csv';
    var max_parallel = input.reduce((prev, entry) => Math.max(prev, entry.parallel), 0);
    parpool = new parallel_pool_1.ParallelPool(max_parallel, testpool, fullconfig);
    parexec = new parallel_exec_1.ParallelExec(parpool.getExecutors());
    //var hndl = startOpMonitor(parexec);
    startSequence(fullconfig, input, testpool, options, 0, callback);
}
exports.startRun = startRun;
function startSequence(fullconfig, input, testpool, options, current_index, callback) {
    //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 100 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    var tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    var parq_1m_zip = 'select max(VCHAR50RNDVL), vchar4dic6, avg(UINT64_RND) from GEN_1M_PAR_ZIP group by VCHAR4DIC6;';
    //ALTERD
    //tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 1000 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    var interim = [
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_OPEN_TXN_SIZE') = 18 WITH RECONFIGURE;`,
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_WAITING_TXN_SIZE') = 10  WITH RECONFIGURE;`,
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_OPEN_TXN_SIZE') = 19 WITH RECONFIGURE;`,
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_WAITING_TXN_SIZE') = 9  WITH RECONFIGURE;`,
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_OPEN_TXN_SIZE') = 18 WITH RECONFIGURE;`,
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_WAITING_TXN_SIZE') = 10  WITH RECONFIGURE;`,
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_OPEN_TXN_SIZE') = -1 WITH RECONFIGURE;`,
        `ALTER SYSTEM ALTER CONFIGURATION ('VORA', 'SYSTEM') SET ('RELATIONAL', 'QUOTA_WAITING_TXN_SIZE') = -1  WITH RECONFIGURE;`,
    ];
    var arrx = [
        { PAR: 1, MAX_NR: 40, statement: '', TAG: 'TCP_P1' },
        { PAR: 2, MAX_NR: 40, statement: '', TAG: 'TCP_P1' },
        // { PAR : 3,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
        { PAR: 4, MAX_NR: 40, statement: '', TAG: 'TCP_P1' },
        // { PAR : 6,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
        { PAR: 8, MAX_NR: 40, statement: '', TAG: 'TCP_P1' },
        //  { PAR :10,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
        { PAR: 12, MAX_NR: 40, statement: '', TAG: 'TCP_P1' },
        { PAR: 16, MAX_NR: 40, statement: '', TAG: 'TCP_P1' },
        { PAR: 20, MAX_NR: 40, statement: '', TAG: 'TCP_P1' },
        { PAR: 32, MAX_NR: 40, statement: '', TAG: 'TCP_P1' }
    ];
    arrx.forEach(entry => entry['TAG'] = 'TCP_P_' + entry.PAR);
    arrx.forEach(entry => entry['TAG'] = 'P1Z_P_' + entry.PAR);
    arrx.forEach(entry => entry['statement'] = tcp_001_4);
    arrx.forEach(entry => entry['statement'] = parq_1m_zip);
    arrx.forEach(entry => entry['MAX_NR'] = 40);
    var hndl = startOpMonitor(parexec);
    //var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);
    //QPM     |BAD%   |PAR    |NR_PARALLEL_PLAN       |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
    //10      |0      |4      |4      |165    |94     |173    |169    |2624
    //QPM     |BAD%   |PAR    |PAR_P  |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
    //10      |0      |8      |4      |174    |98     |171    |1      |2761
    var runOneInterim = function (index, done, reject) {
        var r = parexec.startSequentialSimple(interim[index + 0]).then(() => parexec.startSequentialSimple(interim[index + 1])).then(() => {
            if (index + 2 == interim.length) {
                done();
            }
            else {
                setTimeout(function () {
                    runOneInterim(index + 2, done, reject);
                }, 2000);
            }
        }).catch(reject);
    };
    function runInterims(parexec) {
        return new Promise(function (resolve, reject) {
            runOneInterim(0, resolve, reject);
        });
    }
    var makeNext = function (op) {
        var res = dumpDone(op);
        allresults.push(res);
        dumpAllResults(allresults);
        var csvcontent = dumpAllResultsToCSV(allresults);
        fs.writeFileSync(options.fnout, csvcontent);
        console.log('>>csv\n' + csvcontent + '\n');
        parexec.stopOp('monitor');
        parexec.stopOp(handle);
        parexec.triggerLoop();
        // run the cleanup scripts
        // we want to temper with the config to clear maxmem
        // but due to the synchronization delay, we wait 3 seconds.
        //loopIt(executor);
        ++index;
        if (index < input.length) {
            runInterims(parexec).then(() => {
                console.log("*** INDEX");
                startSequence(fullconfig, input, testpool, options, index, callback);
            });
        }
        else {
            console.log('stop forks ');
            parpool.stop();
            if (!callback) {
                process.exit(0);
            }
            else {
                callback();
            }
        }
    };
    handle = parexec.startOpRepeat(input[current_index].tag, input[current_index].statement, input[current_index].parallel, { continuous: true, terminate_nr: input[current_index].terminate_nr }, {
        progress: dumpProgress,
        done: makeNext
    });
    parexec.triggerLoop();
    var handle;
    /*setTimeout( function() {
    }, 500);*/
    // beware, this only stops when all queries are completed;
    /*
    setTimeout( function() {
      console.log('stopping now');
      stopOp(handle);
      loopIt(executor);
    }, 200000);
    */
}
exports.startSequence = startSequence;
; /* startsequence*/

//# sourceMappingURL=averages.js.map

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aged_averages_1 = require("../aged_averages");
const debug = require("debug");
const debuglog = debug('average');
'use strict';
const _ = require("lodash");
/**
 * Responses of a dispatcher
 */
var ResponseCode;
(function (ResponseCode) {
    ResponseCode[ResponseCode["NOMATCH"] = 0] = "NOMATCH";
    ResponseCode[ResponseCode["EXEC"] = 1] = "EXEC";
    ResponseCode[ResponseCode["QUERY"] = 2] = "QUERY";
})(ResponseCode = exports.ResponseCode || (exports.ResponseCode = {}));
var Status;
(function (Status) {
    Status[Status["RUNNING"] = 0] = "RUNNING";
    Status[Status["DONE"] = 2] = "DONE";
    Status[Status["STOPPED"] = 1] = "STOPPED";
    Status[Status["INITIAL"] = 3] = "INITIAL";
})(Status = exports.Status || (exports.Status = {}));
var Mode;
(function (Mode) {
    Mode[Mode["SEQUENTIAL"] = 0] = "SEQUENTIAL";
    Mode[Mode["PARALLEL"] = 1] = "PARALLEL";
})(Mode = exports.Mode || (exports.Mode = {}));
;
class Metrics {
    constructor() {
        this.parallel = 0;
        this.query_ok = new aged_averages_1.RateSampledAverage();
        this.count_started = 0;
        this.count_total = 0;
        this.sum_duration_all = 0;
        this.count_ok = 0;
        this.count_bad = 0;
        this.query_bad = new aged_averages_1.RateSampledAverage();
        this.query_all = new aged_averages_1.RateSampledAverage();
        this.query_duration = new aged_averages_1.EventSampledAverage();
    }
}
;
;
;
;
var handles = new Map();
function isTerminated(op) {
    if (op.cp_running > 0) {
        return false;
    }
    debuglog(' t/s/f  ' + op.tag + ' ' + op.options.terminate_nr + '/' + op.metrics.count_started + '/' + op.metrics.count_total);
    if (op.options && (op.options.terminate_nr > 0) && op.metrics.count_total >= op.options.terminate_nr) {
        op.status = 1 /* STOPPED */;
        return true;
    }
    if (op.options.continuous && (op.status != 1 /* STOPPED */) && (op.status != 2 /* DONE */))
        return false;
    if (op.options.continuous && op.options.every_t && op.status == 1 /* STOPPED */) {
        return true;
    }
    return op.slots.every(run => run.status == 2 /* DONE */);
}
exports.isTerminated = isTerminated;
var t_total = 0;
function recordStart(op, slot) {
    op.metrics.parallel++;
    if (op.t_started == 0) {
        op.t_started = Date.now();
    }
    slot.status = 0 /* RUNNING */;
    console.log('S' + (Date.now() - t_total) + ' ' + (Date.now() - op.t_started) + "S:" + op.parallel + " " + op.metrics.count_started + "/" + op.metrics.count_total + "/" + op.metrics.count_bad + " " + op.name);
    slot.duration = Date.now();
}
exports.recordStart = recordStart;
function recordEnd(op, slot, rc, res) {
    slot.status = 2 /* DONE */;
    op.metrics.parallel--;
    op.metrics.count_total++;
    slot.duration = Date.now() - slot.duration;
    op.metrics.sum_duration_all += slot.duration;
    console.log('E' + (Date.now() - t_total) + ' ' + (Date.now() - op.t_started) + "E:" + op.parallel + " " + op.metrics.count_started + "/" + op.metrics.count_total + "/" + op.metrics.count_ok + "/" + op.metrics.count_bad + ' ' + slot.duration + ' ' + slot.index + ' len=' + (_.isArray(res) ? res.length : res) + ' ' + op.name); //
    debuglog(JSON.stringify(res));
    if (rc) {
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
    if (rc && op.callbacks && op.callbacks.result) {
        // console.log('having result ' + JSON.stringify(res)); 
        try {
            op.callbacks.result(undefined, res);
        }
        catch (ex) {
            console.log(ex.toString());
            console.log(ex.stack);
        }
    }
    op.allresults.push({ ts: d.toUTCString(), t: d.getTime(), delta_t: d.getTime() - op.t_started, rc: rc, res: res });
    if (rc && op.callbacks && op.callbacks.progress) {
        if (rc && op.callbacks && op.callbacks.progress) {
            try {
                op.callbacks.progress(op);
            }
            catch (ex) {
                console.log(ex.toString());
                console.log(ex.stack);
            }
        }
    }
}
exports.recordEnd = recordEnd;
function recordOk(op, run, res) {
    /* res.conn.close(function(err, ok) {
       if(err)
        console.log('error closing' + err);
     });*/
    recordEnd(op, run, true, res.result);
}
exports.recordOk = recordOk;
function recordBad(op, run, res) {
    console.log('BADD!!!!' + res);
    recordEnd(op, run, false, res);
}
exports.recordBad = recordBad;
class RemoteExecutor {
    constructor(fork, handle, idx) {
        this.dest = fork;
        this.handle = handle;
        this.idx = idx;
    }
    ;
    run(statement) {
        var that = this;
        console.log('sending ' + that.handle + ' ' + that.idx);
        that.dest.send({ handle: that.handle, idx: that.idx, statement: statement });
    }
    ;
}
exports.RemoteExecutor = RemoteExecutor;
;
var tcnt = 0;
function scheduleOps(op, sqlexec) {
    while (op.slots.length < op.parallel) {
        var slot = { index: op.slots.length, statement: op.statement, status: 3 /* INITIAL */,
            duration: 0 };
        var idx = Math.floor(op.slots.length / 4);
        if (idx > 0) {
            slot.remote = new RemoteExecutor(forks[idx], op.name, op.slots.length);
        }
        op.slots.push(slot);
    }
    debuglog('augmenting parallel ' + op.slots.length);
    var terminate_nr = op.options && op.options.continuous && op.options.terminate_nr;
    if (terminate_nr && terminate_nr > 0 && op.metrics.count_total > terminate_nr) {
        op.status = 1 /* STOPPED */;
    }
    var t = Date.now();
    var terminate_delta_t = op.options && op.options.continuous && op.options.terminate_delta_t;
    if (terminate_delta_t && terminate_delta_t > 0 && op.t_started > 0
        && ((t - op.t_started) > terminate_delta_t)) {
        op.status = 1 /* STOPPED */;
    }
    if (op.status == 1 /* STOPPED */) {
        return;
    }
    if (op.options.every_t > 0) {
        // figure out if the last runnig started op 
        debuglog('delta is ' + (Date.now() - op.options.t_last));
        if ((Date.now() - op.options.t_last) < op.options.every_t) {
            return;
        }
        // find a slot which is DONE. 
        var res = op.slots.filter(entry => entry.status == 2 /* DONE */ || entry.status == 3 /* INITIAL */);
        if (res.length) {
            var entry = res[0];
            entry.status = 0 /* RUNNING */;
            recordStart(op, entry);
            debuglog(op.statement);
            op.options.t_last = Date.now();
            op.metrics.count_started++;
            sqlexec.execStatement(entry.statement).then(res => {
                recordOk(op, entry, res);
                loopIt(sqlexec);
            }).catch(err => {
                recordBad(op, entry, err);
                loopIt(sqlexec);
            });
        }
        return;
    }
    op.slots.every(entry => {
        if ((op.options.continuous && entry.status != 0 /* RUNNING */) || entry.status == 3 /* INITIAL */) {
            debuglog(' t/s/f  ' + op.tag + ' ' + op.options.terminate_nr + '/' + op.metrics.count_started + '/' + op.metrics.count_total);
            if (op.options && (op.options.terminate_nr > 0) && op.metrics.count_started >= op.options.terminate_nr) {
                entry.status = 2 /* DONE */;
                return;
            }
            entry.status = 0 /* RUNNING */;
            recordStart(op, entry);
            debuglog(op.statement);
            op.metrics.count_started++;
            if (entry.remote) {
                entry.remote.run(entry.statement);
            }
            else {
                sqlexec.execStatement(entry.statement).then(res => {
                    recordOk(op, entry, res);
                    loopIt(sqlexec);
                }).catch(err => {
                    recordBad(op, entry, err);
                    loopIt(sqlexec);
                });
            }
            return (op.mode != 0 /* SEQUENTIAL */); // when sequential, stop after first scheduling
        }
        return true;
    });
}
exports.scheduleOps = scheduleOps;
function loopIt(sqlexec) {
    if (t_total == 0) {
        t_total = Date.now();
    }
    var removeKey = [];
    handles.forEach(function (op, key) {
        debuglog('looking at' + key + ' value ' + op.name);
        if (isTerminated(op)) {
            console.log('is terminated:' + op.name);
            removeKey.push(key);
        }
        scheduleOps(op, sqlexec);
    });
    removeKey.forEach(key => {
        const op = handles.get(key);
        handles.delete(key);
        console.log(' REMOVING ' + key);
        if (op.callbacks && op.callbacks.done) {
            op.callbacks.done(op);
        }
    });
    if (handles.size > 0) {
        setTimeout(function () { loopIt(sqlexec); }, 500);
    }
}
exports.loopIt = loopIt;
function startOpMonitor() {
    var d = new Date();
    var op = {
        tag: "monitor",
        name: "monitor",
        statement: 'SELECT * FROM SYS.INTERNAL_REL_NODE_RT_AVG;',
        t_started: 0,
        mode: 1 /* PARALLEL */,
        status: 0 /* RUNNING */,
        parallel: 4,
        options: {
            continuous: true,
            t_last: 0,
            every_t: 2000,
        },
        cps: [],
        cp_running: 0,
        slots: [],
        timings: [],
        allresults: [],
        metrics: new Metrics(),
        callbacks: {
            result: function (err, res) {
                if (!err) {
                    var timing = makeTimingRecord(res);
                    registerTiming(Date.now(), timing);
                }
            }
        }
    };
    handles.set(op.name, op);
    return op.name;
}
exports.startOpMonitor = startOpMonitor;
var cnt = 0;
const child_process = require("child_process");
/**
 *  execute a statement repeatedly until one calls close on the handle.
 *
 *
 */
function startOpRepeat(tag, statement, parallel, options = undefined, cb = undefined) {
    var d = new Date();
    var op = {
        tag: tag,
        name: tag + '_' + cnt++,
        statement: statement,
        t_started: 0,
        mode: 1 /* PARALLEL */,
        status: 0 /* RUNNING */,
        parallel: parallel,
        options: {
            continuous: true,
            terminate_nr: options && options.terminate_nr,
            terminate_delta_t: options && options.terminate_delta_t,
        },
        cps: [],
        cp_running: 0,
        slots: [],
        timings: [],
        allresults: [],
        callbacks: cb,
        metrics: new Metrics()
    };
    // the jdbc driver is limiting to ~4 parallel requests
    var terminate_nr = options.terminate_nr;
    handles.set(op.name, op);
    return op.name;
}
exports.startOpRepeat = startOpRepeat;
function startOpSequential(statement) {
    var d = new Date();
    var op = {
        tag: 'sequential',
        name: 'sequential',
        statement: statement,
        t_started: 0,
        status: 0 /* RUNNING */,
        parallel: 1,
        cps: [],
        cp_running: 0,
        options: {
            continuous: false,
        },
        mode: 0 /* SEQUENTIAL */,
        slots: [],
        allresults: [],
        timings: [],
        metrics: new Metrics()
    };
    if (handles.has(op.name)) {
        op = handles.get('sequential');
    }
    else {
        handles.set(op.name, op);
    }
    op.status = 0 /* RUNNING */;
    op.slots.push({
        index: op.slots.length,
        statement: statement,
        duration: 0,
        status: 3 /* INITIAL */
    });
    handles.set(op.name, op);
    return op.name;
}
exports.startOpSequential = startOpSequential;
function stopOp(handle) {
    if (handles.has(handle)) {
        console.log('STOPPING NOW!!!!!!!!!!!!!!!!!!!!');
        handles.get(handle).status = 1 /* STOPPED */;
    }
}
exports.stopOp = stopOp;
;
function dumpProgress(op) {
    var avg = getBestAvg(op.t_started, op.timings);
    console.log(' dump progress ' + op.metrics.count_total);
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
    handles.forEach(function (op) {
        if (op.status != 1 /* STOPPED */) {
            op.timings.push({ time: time, rec: rec });
            //console.log( 'timing length now' + op.timings.length);
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
            var sortedIntArr = Array.from(rec.keys()).map(k => parseInt(' ' + k)).sort();
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
var index = 0;
var allresults = [];
var forks = [];
function startSequence(executor, current_index = 0) {
    var hndl = startOpMonitor();
    //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 100 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    var tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    var parq_1m_zip = 'select max(VCHAR50RNDVL), vchar4dic6, avg(UINT64_RND) from GEN_1M_PAR_ZIP group by VCHAR4DIC6;';
    //ALTERD
    //tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 1000 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
    var arr = [
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
    arr.forEach(entry => entry['TAG'] = 'TCP_P_' + entry.PAR);
    arr.forEach(entry => entry['TAG'] = 'P1Z_P_' + entry.PAR);
    arr.forEach(entry => entry['statement'] = tcp_001_4);
    arr.forEach(entry => entry['statement'] = parq_1m_zip);
    arr.forEach(entry => entry['MAX_NR'] = 40);
    if (current_index == 0) {
        var max_parallel = arr.reduce((prev, entry) => Math.max(prev, entry.PAR), 0);
        for (var i = 0; i < Math.ceil(max_parallel / 4); ++i) {
            var cp = child_process.fork(`${__dirname}/../../runoneForked.js`, undefined, { silent: true });
            forks.push(cp);
            cp.on('message', (m) => {
                console.log('received message ' + m.handle + ' ' + m.idx + ' ' + m.result + ' ' + JSON.stringify(m.err));
                debugger;
                if (handles.has(m.handle)) {
                    console.log('have handle!');
                    var op = handles.get(m.handle);
                    if (op.slots.length > m.idx) {
                        var run = op.slots[m.idx];
                        if (m.err) {
                            recordBad(op, run, m.err);
                        }
                        else {
                            recordOk(op, run, { result: m.result });
                        }
                    }
                    else {
                        console.log('idx is out of bounds>> ' + op.slots.length);
                    }
                }
                else {
                    console.log(' no handle found !!');
                }
            });
        }
    }
    //var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);
    //QPM     |BAD%   |PAR    |NR_PARALLEL_PLAN       |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
    //10      |0      |4      |4      |165    |94     |173    |169    |2624
    //QPM     |BAD%   |PAR    |PAR_P  |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
    //10      |0      |8      |4      |174    |98     |171    |1      |2761
    var showOp = dumpProgress;
    var makeNext = function (op) {
        var res = dumpDone(op);
        allresults.push(res);
        dumpAllResults(allresults);
        stopOp('monitor');
        stopOp(handle);
        loopIt(executor);
        ++index;
        if (index < arr.length) {
            console.log("*** INDEX");
            startSequence(executor, index);
        }
        else {
            // assume done
            forks.forEach((fork, idx) => console.log('fork' + idx + ' ' + fork.connected));
            forks.forEach(fork => fork.kill());
        }
    };
    handle = startOpRepeat(arr[current_index].TAG, arr[current_index].statement, arr[current_index].PAR, { continuous: true, terminate_nr: arr[current_index].MAX_NR }, {
        progress: showOp,
        done: makeNext
    });
    loopIt(executor);
    var handle;
    setTimeout(function () {
    }, 500);
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
;

//# sourceMappingURL=averages.js.map

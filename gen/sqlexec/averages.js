"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aged_averages_1 = require("../aged_averages");
const debug = require("debug");
const debuglog = debug('average');
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
        this.count_ok = 0;
        this.count_bad = 0;
        this.query_bad = new aged_averages_1.RateSampledAverage();
        this.query_all = new aged_averages_1.RateSampledAverage();
        this.query_duration = new aged_averages_1.EventSampledAverage();
    }
}
;
;
var handles = new Map();
function isTerminated(op) {
    if (op.continous && (op.status != 1 /* STOPPED */) && (op.status != 2 /* DONE */))
        return false;
    return op.slots.every(run => run.status == 2 /* DONE */);
}
exports.isTerminated = isTerminated;
function recordStart(op, slot) {
    op.metrics.parallel++;
    if (op.t_started == 0) {
        op.t_started = new Date().getTime();
    }
    slot.status = 0 /* RUNNING */;
    console.log((Date.now() - op.t_started) + "S:" + op.parallel + " " + op.metrics.count_ok + "/" + op.metrics.count_bad);
    slot.duration = Date.now();
}
exports.recordStart = recordStart;
function recordEnd(op, slot, rc, res) {
    slot.status = 2 /* DONE */;
    op.metrics.parallel--;
    slot.duration = Date.now() - slot.duration;
    console.log((Date.now() - op.t_started) + "E:" + op.parallel + " " + op.metrics.count_ok + "/" + op.metrics.count_bad + ' ' + slot.duration + ' ' + slot.index + ' ' + JSON.stringify(res));
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
    op.allresults.push({ ts: d.toUTCString(), t: d.getTime(), delta_t: d.getTime() - op.t_started, rc: rc, res: res });
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
var tcnt = 0;
function scheduleOps(op, sqlexec) {
    while (op.slots.length < op.parallel) {
        op.slots.push({ index: ++tcnt, statement: op.statement, status: 3 /* INITIAL */,
            duration: 0 });
    }
    debuglog('augmenting parallel ' + op.slots.length);
    if (op.status == 1 /* STOPPED */) {
        return;
    }
    op.slots.every(entry => {
        if ((op.continous && entry.status != 0 /* RUNNING */) || entry.status == 3 /* INITIAL */) {
            entry.status = 0 /* RUNNING */;
            recordStart(op, entry);
            debuglog(op.statement);
            sqlexec.execStatement(entry.statement).then(res => {
                recordOk(op, entry, res);
                loopIt(sqlexec);
            }).catch(err => {
                recordBad(op, entry, err);
                loopIt(sqlexec);
            });
            return (op.mode != 0 /* SEQUENTIAL */); // when sequential, stop after first scheduling
        }
        return true;
    });
}
exports.scheduleOps = scheduleOps;
function loopIt(sqlexec) {
    var removeKey = [];
    handles.forEach(function (op, key) {
        debuglog('looking at' + key + ' value ' + op.name);
        if (isTerminated(op)) {
            console.log('is terminated:' + op.name);
            removeKey.push(key);
        }
        scheduleOps(op, sqlexec);
    });
    removeKey.forEach(key => handles.delete(key));
}
exports.loopIt = loopIt;
var cnt = 0;
/**
 *  execute a statement repeatedly until one calls close on the handle.
 *
 *
 */
function startOpRepeat(statement, parallel) {
    var d = new Date();
    var op = {
        name: d.toUTCString() + cnt++,
        statement: statement,
        t_started: 0,
        mode: 1 /* PARALLEL */,
        status: 0 /* RUNNING */,
        parallel: parallel,
        continous: true,
        slots: [],
        allresults: [],
        metrics: new Metrics()
    };
    handles.set(op.name, op);
    return op.name;
}
exports.startOpRepeat = startOpRepeat;
function startOpSequential(statement) {
    var d = new Date();
    var op = {
        name: 'sequential',
        statement: statement,
        t_started: 0,
        status: 0 /* RUNNING */,
        parallel: 1,
        continous: false,
        mode: 0 /* SEQUENTIAL */,
        slots: [],
        allresults: [],
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

//# sourceMappingURL=averages.js.map

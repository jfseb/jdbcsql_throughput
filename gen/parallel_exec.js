"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * Allows to execute statements in parallel, continous or a given
 * amount of time.
 *
 *
 */
const debug = require("debug");
const assert = require("assert");
const debuglog = debug('average');
'use strict';
const _ = require("lodash");
/**
 * Responses of a dispatcher
 */
const constants_1 = require("./constants");
var handles = new Map();
var every_t_interval = undefined;
var every_t_use_count = 0;
/*
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
  remote? : RemoteExecutor
};

interface IMetrics {
  parallel : number,
  count_total : number,
  count_started : number,
  count_ok : number,
  sum_duration_all : number,
  count_bad : number,
}

class Metrics implements IMetrics {
  parallel : number = 0;
  count_started : number = 0;
  count_total : number = 0;
  sum_duration_all : number = 0;
  count_ok: number = 0;
  count_bad: number = 0;
}
*/
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
    op.lastResult = res;
    op.lastRC = rc;
    console.log('E' + (Date.now() - t_total) + ' ' + (Date.now() - op.t_started) + "E:" + op.parallel + " " + op.metrics.count_started + "/" + op.metrics.count_total + "/" + op.metrics.count_ok + "/" + op.metrics.count_bad + ' ' + slot.duration + ' ' + slot.index + ' len=' + (_.isArray(res) ? res.length : res) + ' ' + op.name); //
    debuglog(JSON.stringify(res));
    if (rc) {
        op.metrics.count_ok++;
    }
    else {
        op.metrics.count_bad++;
    }
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
    if (op.callbacks && op.callbacks.progress) {
        try {
            op.callbacks.progress(op, rc);
        }
        catch (ex) {
            console.log(ex.toString());
            console.log(ex.stack);
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
    if (res.stack) {
        console.log(res.toString() + "\n" + '' + res.stack);
    }
    recordEnd(op, run, false, res);
}
exports.recordBad = recordBad;
var cnt = 0;
class ParallelExec {
    constructor(executors) {
        this.executors = executors;
        this.executorUsage = new Array(executors.length).fill(0);
    }
    ;
    /**
     * execute a statement repeatedly until one calls close on the handle.
     *
     * @param {string} tag : identifying tag used in some output
     * part of IParallelOp.tag
     * @param options
     * @param cb : callback
     */
    startOpRepeat(tag, statement, parallel, options = undefined, cb = undefined) {
        var d = new Date();
        options = options || { continuous: true };
        var op = {
            tag: tag,
            name: (options && options.forcename) ? options.forcename : (tag + '_' + cnt++),
            statement: statement,
            t_started: 0,
            mode: 1 /* PARALLEL */,
            status: 0 /* RUNNING */,
            parallel: parallel,
            options: {
                continuous: true,
                every_t: options && options.every_t,
                terminate_nr: options && options.terminate_nr,
                terminate_delta_t: options && options.terminate_delta_t,
            },
            cps: [],
            cp_running: 0,
            slots: [],
            timings: [],
            allresults: [],
            callbacks: cb,
            metrics: new constants_1.Metrics()
        };
        // the jdbc driver is limiting to ~4 parallel requests
        var terminate_nr = options.terminate_nr;
        var that = this;
        if (op.options.every_t) {
            every_t_interval = every_t_interval || setInterval(that.loopIt.bind(that), 20);
            every_t_use_count++;
        }
        //assert(handles.has(op.name) == false);
        handles.set(op.name, op);
        this.loopIt();
        return op.name;
    }
    changeParallelOp(handle, parallel) {
        // TODO
        if (!handles.has(handle)) {
            return;
        }
        var res = handles.get(handle);
        res.parallel = parallel;
        //
        if (res.parallel > res.slots.length) {
            res.slots = res.slots.slice(0, res.parallel);
        }
        //
        if (!handle)
            assert(false);
    }
    startSequentialSimple(statement) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.startOpSequential("simplseg" + Date.now(), statement, {
                progress: function (op, rc) {
                    if (!rc) {
                        reject(op.lastResult);
                    }
                    else {
                        resolve(op.lastResult);
                    }
                }
            });
        });
    }
    /**
     * Run a stingle statement sequential
     * @param statement
     */
    startOpSequential(tag, statement, cb) {
        var d = new Date();
        var op = {
            tag: tag,
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
            callbacks: cb,
            mode: 0 /* SEQUENTIAL */,
            slots: [],
            allresults: [],
            timings: [],
            metrics: new constants_1.Metrics()
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
            status: 3 /* INITIAL */,
            executor: this.assignMinUsedExecutor()
        });
        handles.set(op.name, op);
        this.loopIt();
        return op.name;
    }
    ;
    triggerLoop() {
        this.loopIt();
    }
    /**
     * mark the operation with handle as STOPPED,
     * queries will continue to run and finish and fire events,
     * only then is the handle removed.
     * @param handle
     */
    stopOp(handle) {
        if (handles.has(handle)) {
            console.log('STOPPING ' + handle + ' NOW!!!');
            handles.get(handle).status = 1 /* STOPPED */;
        }
    }
    ;
    /**
     * return the parallel op with the handle,
     * @param handle
     */
    getOp(handle) {
        return handles.get(handle);
    }
    ;
    getHandles() {
        return Array.from(handles.keys());
    }
    ;
    registerTiming(time, rec) {
        handles.forEach(function (op) {
            if (op.status != 1 /* STOPPED */) {
                op.timings.push({ time: time, rec: rec });
            }
        });
    }
    ;
    assignMinUsedExecutor() {
        var idxmin = 0;
        var min = this.executorUsage.reduce((prev, el, index) => {
            if (el < prev) {
                idxmin = index;
            }
            return Math.min(prev, el);
        }, 200000);
        this.executorUsage[idxmin]++;
        return this.executors[idxmin];
    }
    ;
    freeExecutorUsage(slots) {
        var that = this;
        slots.forEach(slot => {
            var idx = that.executors.indexOf(slot.executor);
            if (idx > 0) {
                assert(idx < that.executorUsage.length);
                assert(that.executorUsage[idx] > 0);
                that.executorUsage[idx]--;
            }
        });
    }
    ;
    scheduleOps(op) {
        var that = this;
        while (op.slots.length < op.parallel) {
            var slot = { index: op.slots.length, statement: op.statement, status: 3 /* INITIAL */,
                duration: 0, executor: this.assignMinUsedExecutor() };
            op.slots.push(slot);
        }
        while ((op.slots.length > op.parallel) && op.mode != 0 /* SEQUENTIAL */) {
            op.slots = op.slots.slice(0, op.parallel);
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
                entry.executor.execStatement(entry.statement).then(res => {
                    recordOk(op, entry, res);
                    that.loopIt();
                }).catch(err => {
                    recordBad(op, entry, err);
                    that.loopIt();
                });
            }
            return;
        }
        op.slots.every(entry => {
            if ((op.options.continuous && entry.status != 0 /* RUNNING */) || entry.status == 3 /* INITIAL */) {
                console.log(' t/s/f  ' + op.tag + ' ' + op.options.terminate_nr + '/' + op.metrics.count_started + '/' + op.metrics.count_total);
                if (op.options && (op.options.terminate_nr > 0) && op.metrics.count_started >= op.options.terminate_nr) {
                    entry.status = 2 /* DONE */;
                    return;
                }
                entry.status = 0 /* RUNNING */;
                recordStart(op, entry);
                debuglog(op.statement);
                op.metrics.count_started++;
                entry.executor.execStatement(entry.statement).then(res => {
                    recordOk(op, entry, res);
                    that.loopIt();
                }).catch(err => {
                    recordBad(op, entry, err);
                    that.loopIt();
                });
                return (op.mode != 0 /* SEQUENTIAL */); // when sequential, stop after first scheduling
            }
            if (op.mode == 0 /* SEQUENTIAL */ && entry.status == 0 /* RUNNING */) {
                return false;
            }
            return true;
        });
    }
    ;
    loopIt() {
        var that = this;
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
            that.scheduleOps(op);
        });
        removeKey.forEach(key => {
            const op = handles.get(key);
            that.freeExecutorUsage(op.slots);
            if (op.options.every_t) {
                --every_t_use_count;
                if (every_t_use_count == 0) {
                    assert(every_t_interval);
                    clearInterval(every_t_interval);
                }
            }
            handles.delete(key);
            console.log(' REMOVING ' + key);
            if (op.callbacks && op.callbacks.done) {
                op.callbacks.done(op);
            }
        });
        if (handles.size > 0) {
            var that = this;
            setTimeout(function () {
                that.loopIt();
            }, 500);
        }
    }
}
exports.ParallelExec = ParallelExec;
; // class ParallelExec

//# sourceMappingURL=parallel_exec.js.map

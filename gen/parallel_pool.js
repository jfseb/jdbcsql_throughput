"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const debuglog = debug('average');
'use strict';
const sqlexec_remote_1 = require("./sqlexec_remote");
var SQLExec = require('./sqlexec.js').SQLExec;
class ParallelPool {
    constructor(nrexec, pool, config, configFileName) {
        var nrForks = Math.floor((nrexec - 1) / 4);
        this.pool = pool;
        console.log('settign up ' + nrForks + ' forks');
        this.forks = new sqlexec_remote_1.Forks(nrForks, configFileName);
        ;
    }
    ;
    getExecutors() {
        if (!this.executors) {
            this.executors = (new SQLExec()).getExecutors(this.pool, 4);
            this.executors = this.executors.concat(this.forks.getExecutors(4));
        }
        return this.executors;
    }
}
exports.ParallelPool = ParallelPool;

//# sourceMappingURL=parallel_pool.js.map

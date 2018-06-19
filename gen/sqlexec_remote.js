"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cnt = 0;
const child_process = require("child_process");
//import { removeListener, fork } from 'cluster';
//import { LOADIPHLPAPI } from 'dns';
const debug = require("debug");
//import { INSPECT_MAX_BYTES } from 'buffer';
const debuglog = debug('sqlexec_remote');
'use strict';
/**
 * array of all forks
 */
var forks = [];
/**
 * running counter of ops ever sent
 */
var tokencnt = 0;
/**
 *
 */
var openops = {};
/**
 * Execute queries remote.
 *
 *
 */
function setUpForks(nrforks, configfile) {
    for (var i = 0; i < nrforks; ++i) {
        console.log('starting fork' + i);
        var cp = undefined;
        if (configfile) {
            cp = child_process.fork(`${__dirname}/runinfork.js`, [configfile], { silent: true });
        }
        else {
            cp = child_process.fork(`${__dirname}/runinfork.js`, undefined, { silent: true });
        }
        forks.push(cp);
        cp.on('message', (m) => {
            debuglog.enabled && debuglog('received message ' + m.handle + ' ' + JSON.stringify(m.result) + ' ' + JSON.stringify(m.err));
            var op = openops[m.handle];
            if (!op) {
                console.log("unknown handle in message" + m.handle);
                return;
            }
            if (m.err) {
                op.reject(m.err);
            }
            else {
                debuglog.enabled && debuglog('resolving with ' + JSON.stringify(m.result));
                op.resolve({ result: m.result });
            }
            delete op[m.handle];
        });
    }
}
;
function stopForks() {
    forks.forEach((fork, idx) => console.log('fork' + idx + ' ' + fork.connected));
    forks.forEach(fork => fork.kill());
    forks = [];
    openops = {};
}
class Forks {
    constructor(nr, configFileName) {
        setUpForks(nr, configFileName);
    }
    getFork(index) {
        return forks[index];
    }
    stop() {
        stopForks();
    }
    getForksCount() {
        return forks.length;
    }
    getExecutors(exec_per_fork) {
        var u = new SQLExecRemote();
        var res = [];
        for (var i = 0; i < forks.length; ++i) {
            for (var k = 0; k < exec_per_fork; ++k) {
                res.push(u.makeRunner(forks[i]));
            }
        }
        return res;
    }
}
exports.Forks = Forks;
;
class SQLExecRemote {
    makeRunner(fork) {
        var r = {
            pool: fork,
            execStatement: function (statement) {
                return new Promise(function (resolve, reject) {
                    ++tokencnt;
                    openops[tokencnt] = { resolve: resolve, reject: reject };
                    console.log('sending message' + tokencnt + ' ' + statement);
                    fork.send({ handle: tokencnt, statement: statement });
                });
            }
        };
        return r;
    }
    ;
}
exports.SQLExecRemote = SQLExecRemote;

//# sourceMappingURL=sqlexec_remote.js.map

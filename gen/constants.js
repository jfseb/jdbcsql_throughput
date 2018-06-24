"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
/** Struture read from file
*/
class IStatementRun {
    constructor() {
        this.tag = undefined;
        this.parallel = 0;
        this.statement = undefined;
        this.terminate_nr = 0;
        this.terminate_delta_t = 0;
    }
}
exports.IStatementRun = IStatementRun;
;
;
class Metrics {
    constructor() {
        this.parallel = 0;
        this.count_started = 0;
        this.count_total = 0;
        this.sum_duration_all = 0;
        this.count_ok = 0;
        this.count_bad = 0;
    }
}
exports.Metrics = Metrics;
;
;
;
;
;

//# sourceMappingURL=constants.js.map

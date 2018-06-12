'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class RateSampledAverage {
    constructor() {
        this.averages = [];
        this.buckets = [];
        for (var i = 0; i < 5; ++i) {
            this.averages.push(0);
            this.buckets.push(0);
        }
    }
    ;
    AddSample() {
    }
}
exports.RateSampledAverage = RateSampledAverage;
;
class EventSampledAverage {
    constructor() {
        this.averages = [];
        this.buckets = [];
        for (var i = 0; i < 5; ++i) {
            this.averages.push(0);
            this.buckets.push(0);
        }
    }
    ;
    AddSample(o) {
    }
}
exports.EventSampledAverage = EventSampledAverage;
;
exports.aged_averages = {
    RateSampledAverage: RateSampledAverage,
    EventSampledAverage: EventSampledAverage
};

//# sourceMappingURL=aged_averages.js.map

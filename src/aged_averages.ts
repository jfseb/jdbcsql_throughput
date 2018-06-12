
'use strict';
export class RateSampledAverage {
  averages : number[] = [];
  buckets: number[] = [];
  constructor() {
    for(var i = 0; i < 5; ++i) {
      this.averages.push(0);
      this.buckets.push(0);
    }
  };
  AddSample()
  {

  }
 };

 export class EventSampledAverage {
  averages : number[] = [];
  buckets: number[] = [];
  constructor() {
    for(var i = 0; i < 5; ++i) {
      this.averages.push(0);
      this.buckets.push(0);
    }
  };
  AddSample(o : number ) {

  }
 };

export const aged_averages = {
  RateSampledAverage : RateSampledAverage,
  EventSampledAverage : EventSampledAverage
};


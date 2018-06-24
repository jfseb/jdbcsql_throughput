import * as fs from 'fs';
import * as assert from 'assert';
import * as debug from 'debug';
import {IStatementRun} from './constants';
const debuglog = debug('parseinput');

/*
export class IStatementRun
{
  parallel: number = 0;
  statement : string = undefined;
  tag : string = undefined;
  terminate_nr? : number = 0;
  terminate_delta_t? : number = 0;
};
*/

export class ParseInput {
  fnin : string = undefined;
  src : string = undefined;
  constructor(fnin : string) {
    this.fnin = fnin;
    if(fnin) {
      this.src = ' ' + fs.readFileSync(fnin);
    }
  };

  parseIntArg(prefix : string, input : string, defaultValue : number) {
    assert(prefix);
    console.log('here input >' + input + '<');
    if(input.length == 0) {
      return defaultValue;
    }
    assert(input);
    var input = input.replace(/  /g,' ');
    var args = input.split(/ /);
    for(var i = 0; i < args.length; ++i) {
      if(args[i].startsWith(prefix)) {
        try {
          return parseInt(args[i].substr(prefix.length));
        } catch(e) {
          return defaultValue;
        }
      }
    }
    return defaultValue;
  }

  RegExpTagLine : RegExp = new RegExp(/^--\s*\[(TAG=)?([A-Z0-9_]+)\]\s*(.*)/);
  RegExpComment : RegExp = new RegExp(/^--/);

  isComment(line: string) : boolean
  {
    return !!this.RegExpComment.exec(line);
  }

  parseTagLine(line : string) : { tag: string, tail : string}
  {
    var m = this.RegExpTagLine.exec(line);
    if(!m) {
      return undefined;
    }
    return {
      tag : m[2],
      tail : m[3]
    };
  }
  /**
   * --[TAG] NP=x NP
   * @param input
   */
  parseString(input : string) : IStatementRun[]
  {
    var that = this;
    var res = [];
    var rec = undefined;
    var prevrec = undefined;
    input = input || this.src;
    var x = input.split(/\n/);
    x.forEach( (line,index) => {
      line = line.trim();
      debuglog('here line ' + index + ' ' + line);
      var r  = that.parseTagLine(line);
      debuglog(' here r ' + JSON.stringify(r));
      if(line.length == 0) {

      } else if(r) {
        console.log(' got a new rec entry ' + JSON.stringify(r));
        if(rec)
        {
          if(!rec.statement) {
            console.log('missing statement at ' + that.fnin + '[' + index + ':1]');
            process.exit(-1);
          }
          debuglog('adding' + ( res.length + 1 ) + 'record : ' + JSON.stringify(rec));
          res.push(rec);
          prevrec = rec;
        }
        assert(r.tag);
        var tail = r.tail || "";
        rec = new IStatementRun();
        rec.tag = r.tag;
        rec.parallel = that.parseIntArg('P=', tail, (prevrec && prevrec.parallel) || 1);
        rec.terminate_delta_t = that.parseIntArg('T=', tail, undefined);
        debuglog('here delta t' + rec.terminate_delta_t );
        rec.terminate_nr = that.parseIntArg('NR=', tail, undefined );
        if(!rec.terminate_delta_t && !rec.terminate_nr) {
          rec.terminate_nr = prevrec && prevrec.terminate_nr;
        } 
        if(!rec.terminate_delta_t && !rec.terminate_nr) {
          console.log('no termination at statement around line ' + index);
          process.exit(-1);
        } 
        rec.statement = "";
        debuglog('here new rec' + JSON.stringify(rec,undefined,2));
      }
      else if (!that.isComment(line)) {
        console.log('here statement  >' + line + '<')
        if(rec.statement.length) {
          rec.statement += "\n";
        }
        rec.statement += line;
        debuglog('here statement ' + rec.statement);
      }
    });
    if(rec.statement) {
      res.push(rec);
    }
    return res;
  };

}
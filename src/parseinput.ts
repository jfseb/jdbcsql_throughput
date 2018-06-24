import * as fs from 'fs';
import * as assert from 'assert';
import * as debug from 'debug';
const debuglog = debug('parseinput');


export class IStatementRun
{
  parallel: number = 0;
  statement : string = undefined;
  tag : string = undefined;
  terminate_nr? : number = 0;
  terminate_delta_t? : number = 0;
};

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

  RegExpTagLine : RegExp = new RegExp(/^--\s*\[([A-Z0-9_]+)\]\s+(.*)/);
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
      tag : m[1],
      tail : m[2]
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
    var x = input.split(/\n/);
    x.forEach( (line,index) => {
      line = line.trim();
      console.log('here line ' + index + ' ' + line);
      var r  = that.parseTagLine(line);
      console.log(' here r ' + JSON.stringify(r));
      if(line.length == 0) {

      } else if(r) {
        console.log(' got a new rec entry ' + JSON.stringify(r));
        if(rec)
        {
          if(!rec.statement) {
            console.log('missing statement at ' + that.fnin + '[' + index + ':1]');
            process.exit(-1);
          }
          console.log('here adding ' + JSON.stringify(rec));
          res.push(rec);
        }
        assert(r.tag);
        var tail = r.tail || "";
        rec = new IStatementRun();
        rec.tag = r.tag;
        rec.parallel = that.parseIntArg('P=', tail, 1);
        rec.terminate_delta_t = that.parseIntArg('T=', tail, undefined);
        console.log('here delta t' + rec.terminate_delta_t );
        rec.terminate_nr = that.parseIntArg('NR=', tail, undefined );
        rec.statement = "";
        console.log('here new rec' + JSON.stringify(rec,undefined,2));
      }
      else if (!that.isComment(line)) {
        console.log('here statement  >' + line + '<')
        if(rec.statement.length) {
          rec.statement += "\n";
        }
        rec.statement += line;
        console.log('here statement ' + rec.statement);
      }
    });
    if(rec.statement) {
      res.push(rec);
    }
    return res;
  };

}
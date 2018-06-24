
var root =  '../gen';
// var _ = require('lodash');
// var debuglog = require('debug')('plainRecoginizer.nunit')
//var debug = require('debug');
//const debuglog = debug('sqlexec.nunit');

var tap = require('tap');
// strongly recommended to load this first, as it brings up the jvm,
var ParseInput = require(root + '/parseinput.js');


tap.test('testParseInput.parseDefault' , function(test) {
  var parser = new ParseInput.ParseInput();
  tap.deepEqual(parser.parseIntArg('P=', 'ABC', 4), 4);
  tap.deepEqual(parser.parseIntArg('NP=', 'ABC=1 ANP=4 NP=3', 4), 3);
  tap.deepEqual(parser.parseIntArg('P=', 'P=-123', 4), -123);
  tap.deepEqual(parser.parseIntArg('NP=', 'U=4 NP=123 XP=434', 4), 123);
  tap.deepEqual(parser.parseIntArg('NP=', 'NP=444 NP=123', 4), 444);
  test.done();
});


tap.test('testParseInput.isTagLine' , function(test) {
  var parser = new ParseInput.ParseInput();
  tap.deepEqual(parser.parseTagLine('--ABC [DEF]'), undefined);
  tap.deepEqual(parser.parseTagLine('--[ABC_KLM] NP=3 ABC=1 ANP=4 NP=3'), { tag: 'ABC_KLM', tail : 'NP=3 ABC=1 ANP=4 NP=3'  });
  tap.deepEqual(parser.parseTagLine('--  [ABC_KLM] NP=3 ABC=1 ANP=4 NP=3'), { tag: 'ABC_KLM', tail : 'NP=3 ABC=1 ANP=4 NP=3'  } );
  test.done();
});



tap.test('testParseInput.isTagLine' , function(test) {
  var parser = new ParseInput.ParseInput();
  tap.deepEqual(parser.isComment('--ABC [DEF]'), true);
  tap.deepEqual(parser.parseTagLine('[ABC_KLM] NP=3 ABC=1 ANP=4 NP=3'), false);
  test.done();
});


var exampleInput = `
--[TAG_ABC] NR=500
SELECT * FROM T1;
--[TAG_DEF] P=4 T=30
--
SELECT ABC
FROM T1;
`;


var fs = require('fs');

tap.test('testParseInput.Full' , function(test) {
  fs.writeFileSync('test.tmp', exampleInput);
  var parser = new ParseInput.ParseInput('test.tmp');
  var res = parser.parseString(exampleInput);
  test.deepEqual(res.length, 2);
  test.deepEqual(res[0],
    {
      tag: 'TAG_ABC',
      statement : 'SELECT * FROM T1;',
      terminate_nr : 500,
      terminate_delta_t : undefined,
      parallel : 1
    });
  test.deepEqual(res[1],
    {
      tag: 'TAG_DEF',
      statement : 'SELECT ABC\nFROM T1;',
      terminate_nr : undefined,
      terminate_delta_t :30,
      parallel : 4
    });
  test.done();
});

tap.test('testParseInput.parseDefault' , function(test) {
  fs.writeFileSync('test.tmp', exampleInput);
  var parser = new ParseInput.ParseInput();
  tap.deepEqual(parser.parseIntArg('P=', 'ABC', 4), 4);
  tap.deepEqual(parser.parseIntArg('NP=', 'ABC=1 ANP=4 NP=3', 4), 3);
  tap.deepEqual(parser.parseIntArg('P=', 'P=-123', 4), -123);
  tap.deepEqual(parser.parseIntArg('NP=', 'U=4 NP=123 XP=434', 4), 123);
  tap.deepEqual(parser.parseIntArg('NP=', 'NP=444 NP=123', 4), 444);
  test.done();
});

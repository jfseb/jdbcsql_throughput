# jdbcsql_throughput [![Build Status](https://travis-ci.org/jfseb/jdbcsql_throughput.svg?branch=master)](https://travis-ci.org/jfseb/jdbc_sqlthroughput)[![Coverage Status](https://coveralls.io/repos/github/jfseb/jdbcsql_throughput/badge.svg?branch=master)](https://coveralls.io/github/jfseb/jdbcsql_throughput?branch=master)

Nodejs JDBC SQL connector and sample program for throughput measurement


## Built commandline

```
    npm install
    gulp
```

## Run monitor program

```
    node main.js <inputfile>
```


## Development

The src folder contains both typescript and js files.

All files are compiled to gen  (using tsc or babel)
Compilation is to ES2015, as the jscoverage parse cannot treat new language
feature correclty

gulp-instrument (one of the jscoverage gulp integration) is used to generate
coverage instrumented sources in gen_cov

Currently the test folder is not compiled, but contains directly es6 modules

gulp, gulp-watch



# jdbcsql_throughput
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



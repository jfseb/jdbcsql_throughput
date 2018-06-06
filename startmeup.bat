

e:
cd \projects\nodejs\botbuilder\mgnlq_abot
start "mgnlq_abot" cmd
start "mgnql_abot_gulp_watch"  gulp watch


e:
cd \projects\nodejs\botbuilder\mgnlq_parser1
start "mgnlq_parser1" cmd
start "mgnql_parser1 gulp watch"  gulp watch

e:
cd \projects\nodejs\botbuilder\mgnlq_er
start "mgnlq_er" cmd
start "mgnql_er_gulp_watch"  gulp watch

e:
cd \progs\mongodb\bin 
start "mongo"
start "mongo"  mongod.exe



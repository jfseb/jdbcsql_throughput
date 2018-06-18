/// <reference types="node" />
import * as child_process from 'child_process';
export declare class Forks {
    constructor(nr: number, configFileName: string);
    getFork(index: number): child_process.ChildProcess;
    stop(): void;
    getForksCount(): number;
    getExecutors(exec_per_fork: number): ISQLExecutor[];
}
import { ISQLExecutor } from './constants';
export declare class SQLExecRemote {
    makeRunner(fork: child_process.ChildProcess): ISQLExecutor;
}

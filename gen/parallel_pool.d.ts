import { Forks } from './sqlexec_remote';
import { ISQLExecutor } from './constants';
export declare class ParallelPool {
    executors: ISQLExecutor[];
    forks: Forks;
    pool: any;
    constructor(nrexec: number, pool: any, config: any, configFileName: string);
    getExecutors(): ISQLExecutor[];
}

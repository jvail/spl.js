declare function _default(options?: SplOptions, extensions?: (DbExtension | SplExtension)[]): Promise<Spl>;
export default _default;
export type Thenable<T> = T & PromiseLike<T>;
export type SplFs = {
    /**
     * - Mount files
     */
    mount: (path: string, options?: MountOption[]) => Thenable<Spl>;
    /**
     * - Unmount files
     */
    unmount: (path: string) => Thenable<Spl>;
    /**
     * - Read file from virtual filesystem
     */
    file: (path: string) => Promise<ArrayBuffer>;
    /**
     * - List directory contents
     */
    dir: (path: string) => Promise<string[]>;
    /**
     * - Delete file from virtual filesystem
     */
    unlink: (path: string) => Thenable<Spl>;
    /**
     * - Create directory in virtual filesystem
     */
    mkdir: (path: string) => Thenable<Spl>;
};
export type Spl = {
    /**
     * - Open a database
     */
    db: (path?: string | ArrayBuffer) => Db;
    /**
     * - Get version info
     */
    version: () => Thenable<VersionInfo>;
    /**
     * - Terminate the WebWorker
     */
    terminate: (cleanup?: boolean) => void;
    /**
     * - Filesystem operations
     */
    fs: SplFs;
    /**
     * - User-defined extension functions
     */
    ex: {
        [x: string]: Function;
    };
};
export type Db = {
    attach: (db: string, schema: string) => Thenable<Db>;
    detach: (schema: string) => Thenable<Db>;
    exec: (sql: string, par?: any) => Thenable<Db>;
    read: (sql: string) => Thenable<Db>;
    load: (src: string) => Thenable<Db>;
    save: () => Thenable<Db>;
    close: () => Thenable<Spl>;
    get: Result;
    /**
     * - User-defined extension functions
     */
    ex: {
        [x: string]: Function;
    };
};
export type Result = {
    first: Promise<any>;
    flat: Promise<any[]>;
    rows: Promise<any[][]>;
    cols: Promise<string[]>;
    objs: Promise<any[]>;
    sync: Promise<ResultData>;
    free: () => Promise<void>;
};
export type { SplOptions } from './typedefs.js';
export type { DbExtension } from './typedefs.js';
export type { SplExtension } from './typedefs.js';
export type { MountOption } from './typedefs.js';
export type { VersionInfo } from './typedefs.js';
export type { ResultData } from './typedefs.js';

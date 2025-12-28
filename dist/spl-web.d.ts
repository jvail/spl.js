declare function _default(options?: SplOptions, extensions?: Extension[]): Promise<Spl>;
export default _default;
export type ProcessedExtension = {
    extends: "db" | "spl";
    url: string;
    fns: {
        [name: string]: string;
    };
};
export type QueueItem = {
    resolve: (res: any) => void;
    reject: (err: any) => void;
};
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
    version: () => Thenable<any>;
    /**
     * - Terminate the WebWorker
     */
    terminate: (cleanup?: boolean) => void;
    /**
     * - Filesystem operations
     */
    fs: SplFs;
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
import type { SplOptions } from './typedefs.js';
import type { Extension } from './typedefs.js';
import type { MountOption } from './typedefs.js';
import type { ResultData } from './typedefs.js';

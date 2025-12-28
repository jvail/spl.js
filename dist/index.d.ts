declare function _default(options?: SplOptions, extensions?: Extension[]): Promise<Spl>;
export default _default;
/**
 * - A value that is both T and awaitable as T
 */
export type Thenable<T> = T & PromiseLike<T>;
/**
 * Query result accessor (async)
 */
export type Result = {
    /**
     * - First value of first row
     */
    first: Promise<any>;
    /**
     * - Flat array of all values
     */
    flat: Promise<any[]>;
    /**
     * - Array of row arrays
     */
    rows: Promise<any[][]>;
    /**
     * - Column names
     */
    cols: Promise<string[]>;
    /**
     * - Array of row objects
     */
    objs: Promise<any[]>;
    /**
     * - Synchronous result (transfers ArrayBuffers)
     */
    sync: Promise<ResultData>;
    /**
     * - Free result memory
     */
    free: () => Promise<void>;
};
/**
 * Database instance
 */
export type Db = {
    /**
     * - Attach another database
     */
    attach: (db: string, schema: string) => Thenable<Db>;
    /**
     * - Detach a database
     */
    detach: (schema: string) => Thenable<Db>;
    /**
     * - Execute SQL
     */
    exec: (sql: string, parameters?: any[] | {
        [name: string]: any;
    }) => Thenable<Db>;
    /**
     * - Read and execute a SQL script
     */
    read: (sql: string) => Thenable<Db>;
    /**
     * - Load database from path
     */
    load: (src: string) => Thenable<Db>;
    /**
     * - Save database to ArrayBuffer
     */
    save: () => Thenable<Db>;
    /**
     * - Close the database
     */
    close: () => Thenable<Spl>;
    /**
     * - Get query results
     */
    get: Result;
};
/**
 * Filesystem operations (Browser)
 */
export type SplFs = {
    /**
     * - Mount files to virtual filesystem
     */
    mount: (path: string, options?: MountOption[]) => Thenable<Spl>;
    /**
     * - Unmount from virtual filesystem
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
/**
 * SPL instance
 */
export type Spl = {
    /**
     * - Open a database
     */
    db: (path?: string | ArrayBuffer) => Thenable<Db>;
    /**
     * - Get version info
     */
    version: () => Thenable<Spl>;
    /**
     * - Terminate the WebWorker
     */
    terminate: (cleanup?: boolean) => void;
    /**
     * - Filesystem operations
     */
    fs: SplFs;
};
import type { SplOptions } from './typedefs.js';
import type { Extension } from './typedefs.js';
import type { ResultData } from './typedefs.js';
import type { MountOption } from './typedefs.js';

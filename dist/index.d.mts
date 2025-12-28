declare function _default(options?: SplOptions): Promise<Spl>;
export default _default;
/**
 * Database instance
 */
export type Db = {
    /**
     * - Attach another database
     */
    attach: (db: string, schema: string) => Db;
    /**
     * - Detach a database
     */
    detach: (schema: string) => Db;
    /**
     * - Execute SQL
     */
    exec: (sql: string, parameters?: any[] | {
        [name: string]: any;
    }) => Db;
    /**
     * - Read and execute a SQL script
     */
    read: (sql: string) => Db;
    /**
     * - Load database from path
     */
    load: (src: string) => Db;
    /**
     * - Save database to path or ArrayBuffer
     */
    save: (dest?: string) => Db | ArrayBuffer;
    /**
     * - Close the database
     */
    close: () => Spl;
    /**
     * - Get query results
     */
    get: ResultData;
};
/**
 * Filesystem operations (Node.js)
 */
export type SplFs = {
    /**
     * - Mount a local directory
     */
    mount: (path: string, mountpoint?: string) => Spl;
    /**
     * - Unmount a directory
     */
    unmount: (path: string) => Spl;
};
/**
 * SPL instance
 */
export type Spl = {
    /**
     * - Open a database
     */
    db: (path?: string | ArrayBuffer) => Db;
    /**
     * - Get version info
     */
    version: () => VersionInfo;
    /**
     * - Filesystem operations
     */
    fs: SplFs;
};
import type { SplOptions } from './typedefs.js';
import type { ResultData } from './typedefs.js';
import type { VersionInfo } from './typedefs.js';

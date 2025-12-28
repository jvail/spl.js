export default spl;
export type DbInstance = {
    /**
     * - Attach another database
     */
    attach: (db: string, schema: string) => DbInstance;
    /**
     * - Detach a database
     */
    detach: (schema: string) => DbInstance;
    /**
     * - Execute SQL with optional parameters
     */
    exec: (sql: string, parameters?: any[] | any) => DbInstance;
    /**
     * - Execute a SQL script
     */
    read: (sql: string) => DbInstance;
    /**
     * - Load database from path
     */
    load: (src: string) => DbInstance;
    /**
     * - Save database to path or return ArrayBuffer
     */
    save: (dest?: string) => DbInstance | ArrayBuffer;
    /**
     * - Close the database
     */
    close: () => SplInstance;
    /**
     * - Get query results
     */
    get: ResultData;
};
export type SplFs = {
    /**
     * - Mount filesystem
     */
    mount: (path: string, mountpoint?: string, options?: MountOption[]) => SplInstance;
    /**
     * - Unmount filesystem
     */
    unmount: (mountpoint: string) => SplInstance;
    /**
     * - Read file from virtual filesystem (Browser only)
     */
    file: (path: string) => ArrayBuffer;
    /**
     * - List directory contents (Browser only)
     */
    dir: (path: string) => string[];
    /**
     * - Delete file from virtual filesystem (Browser only)
     */
    unlink: (path: string) => SplInstance;
    /**
     * - Create directory in virtual filesystem (Browser only)
     */
    mkdir: (path: string) => SplInstance;
};
export type SplInstance = {
    /**
     * - Open a database
     */
    db: (path?: string | ArrayBuffer) => DbInstance;
    /**
     * - Get version info
     */
    version: () => VersionInfo;
    /**
     * - Filesystem operations
     */
    fs: SplFs;
};
/**
 * Initialize spl.js with optional WASM binary and options
 * @param {ArrayBuffer|null} [wasmBinary=null] - Pre-loaded WASM binary (for web worker)
 * @param {SplOptions} [options={}] - Configuration options
 * @returns {Promise<SplInstance>} The SPL instance
 */
declare function spl(wasmBinary?: ArrayBuffer | null, options?: SplOptions): Promise<SplInstance>;
import type { ResultData } from './typedefs.js';
import type { MountOption } from './typedefs.js';
import type { VersionInfo } from './typedefs.js';
import type { SplOptions } from './typedefs.js';

/** @import { SplOptions, ResultData, VersionInfo } from './typedefs.js' */

import spl from './spl.js';

/**
 * Database instance
 * @typedef {Object} Db
 * @property {(db: string, schema: string) => Db} attach - Attach another database
 * @property {(schema: string) => Db} detach - Detach a database
 * @property {(sql: string, parameters?: any[] | {[name:string]: any}) => Db} exec - Execute SQL
 * @property {(sql: string) => Db} read - Read and execute a SQL script
 * @property {(src: string) => Db} load - Load database from path
 * @property {(dest?: string) => Db | ArrayBuffer} save - Save database to path or ArrayBuffer
 * @property {() => Spl} close - Close the database
 * @property {ResultData} get - Get query results
 */

/**
 * Filesystem operations (Node.js)
 * @typedef {Object} SplFs
 * @property {(path: string, mountpoint?: string) => Spl} mount - Mount a local directory
 * @property {(path: string) => Spl} unmount - Unmount a directory
 */

/**
 * SPL instance
 * @typedef {Object} Spl
 * @property {(path?: string | ArrayBuffer) => Db} db - Open a database
 * @property {() => VersionInfo} version - Get version info
 * @property {SplFs} fs - Filesystem operations
 */

/**
 * Initialize spl.js for Node.js
 * @param {SplOptions} [options={}] - Configuration options
 * @returns {Promise<Spl>}
 */
export default (options = {}) => spl(null, options);

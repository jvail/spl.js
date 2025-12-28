/** @import { SplOptions, MountOption, Extension, ResultData } from './typedefs.js' */

/**
 * @template T
 * @typedef {T & PromiseLike<T>} Thenable - A value that is both T and awaitable as T
 */

/**
 * Query result accessor (async)
 * @typedef {Object} Result
 * @property {Promise<any>} first - First value of first row
 * @property {Promise<any[]>} flat - Flat array of all values
 * @property {Promise<any[][]>} rows - Array of row arrays
 * @property {Promise<string[]>} cols - Column names
 * @property {Promise<Object[]>} objs - Array of row objects
 * @property {Promise<ResultData>} sync - Synchronous result (transfers ArrayBuffers)
 * @property {() => Promise<void>} free - Free result memory
 */

/**
 * Database instance
 * @typedef {Object} Db
 * @property {(db: string, schema: string) => Thenable<Db>} attach - Attach another database
 * @property {(schema: string) => Thenable<Db>} detach - Detach a database
 * @property {(sql: string, parameters?: any[] | {[name:string]: any}) => Thenable<Db>} exec - Execute SQL
 * @property {(sql: string) => Thenable<Db>} read - Read and execute a SQL script
 * @property {(src: string) => Thenable<Db>} load - Load database from path
 * @property {() => Thenable<Db>} save - Save database to ArrayBuffer
 * @property {() => Thenable<Spl>} close - Close the database
 * @property {Result} get - Get query results
 */

/**
 * SPL instance
 * @typedef {Object} Spl
 * @property {(path?: string | ArrayBuffer) => Thenable<Db>} db - Open a database
 * @property {(path: string, options?: MountOption[]) => Thenable<Spl>} mount - Mount files
 * @property {(path: string) => Thenable<Spl>} unmount - Unmount files
 * @property {() => Thenable<Spl>} version - Get version info
 * @property {() => void} terminate - Terminate the WebWorker
 */

import spl from './spl-web.js';

/**
 * Initialize spl.js for Browser
 * @param {SplOptions} [options={}] - Configuration options
 * @param {Extension[]} [extensions=[]] - API extensions
 * @returns {Promise<Spl>}
 */
export default (options = {}, extensions = []) => spl(options, extensions);

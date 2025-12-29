/**
 * Shared type definitions for spl.js
 *
 * NOTE: Types imported from this file in spl-web.js and spl-node.mjs are only
 * "import type" in the generated .d.ts files. The build:types script uses sed
 * to convert these to "export type" so consumers can import them from 'spl.js'.
 */

/**
 * @typedef {Object} AutoGeoJSON
 * @property {number} precision - Precision used in Geometry to GeoJSON conversion
 * @property {0|1|2|3|4|5} options - Options as described in SpatiaLite's AsGeoJSON:
 *   - 0: no options
 *   - 1: GeoJSON BoundingBox
 *   - 2: GeoJSON CRS (short)
 *   - 3: BoundingBox + short CRS
 *   - 4: GeoJSON CRS (long)
 *   - 5: BoundingBox + long CRS
 */

/**
 * @typedef {Object} SplOptions
 * @property {boolean} [autoJSON=true] - Automatically stringify/parse JSON in results and parameters
 * @property {AutoGeoJSON|false} [autoGeoJSON] - Automatically convert geometry blobs to GeoJSON
 */

/**
 * Query result with column names and row data
 * @typedef {Object} ResultData
 * @property {any} first - First value of first row (or first row if multiple columns)
 * @property {any[]} flat - Flat array of all values
 * @property {any[][]} rows - Array of row arrays
 * @property {string[]} cols - Column names
 * @property {Object[]} objs - Array of row objects keyed by column name
 * @property {() => void} free - Free result memory
 */

/**
 * Version information object
 * @typedef {Object} VersionInfo
 * @property {string} spatialite - SpatiaLite version
 * @property {string} sqlite - SQLite version
 * @property {string} geos - GEOS version
 * @property {string} proj - PROJ version
 * @property {string} rttopo - librttopo version
 * @property {string} spl - spl.js version
 */

/**
 * Mount options for browser (file data to mount in virtual filesystem)
 * @typedef {Object} MountOption
 * @property {string} name - Name for the mounted file
 * @property {ArrayBuffer|Blob|File|FileList|string} data - File data or URL
 */

/**
 * Extension function for DB extensions - receives DbSync as first argument
 * @typedef {(db: DbSync, ...args: any[]) => any} DbExtensionFn
 */

/**
 * Extension function for SPL extensions - receives SplSync as first argument
 * @typedef {(spl: SplSync, ...args: any[]) => any} SplExtensionFn
 */

/**
 * Extension definition for extending the DB API
 * @typedef {Object} DbExtension
 * @property {'db'} extends - Extends the database API
 * @property {{[name: string]: DbExtensionFn}} fns - Extension functions that receive DbSync as first argument
 */

/**
 * Extension definition for extending the SPL API
 * @typedef {Object} SplExtension
 * @property {'spl'} extends - Extends the SPL API
 * @property {{[name: string]: SplExtensionFn}} fns - Extension functions that receive SplSync as first argument
 */


// =============================================================================
// Worker-side types (synchronous API available inside extensions)
// =============================================================================

/**
 * Filesystem operations available in the worker (synchronous)
 * @typedef {Object} SplFsSync
 * @property {(path: string, mountpoint?: string, options?: MountOption[]) => SplSync} mount - Mount filesystem
 * @property {(mountpoint: string) => SplSync} unmount - Unmount filesystem
 * @property {(path: string) => ArrayBuffer} file - Read file from virtual filesystem
 * @property {(path: string) => string[]} dir - List directory contents
 * @property {(path: string) => SplSync} unlink - Delete file from virtual filesystem
 * @property {(path: string) => SplSync} mkdir - Create directory in virtual filesystem
 */

/**
 * SPL instance available in the worker (synchronous API)
 * This is the type received by extension functions with `extends: 'spl'`
 * @typedef {Object} SplSync
 * @property {(path?: string | ArrayBuffer) => DbSync} db - Open a database
 * @property {() => VersionInfo} version - Get version info
 * @property {SplFsSync} fs - Filesystem operations
 */

/**
 * Database instance available in the worker (synchronous API)
 * This is the type received by extension functions with `extends: 'db'`
 * @typedef {Object} DbSync
 * @property {(db: string, schema: string) => DbSync} attach - Attach another database
 * @property {(schema: string) => DbSync} detach - Detach a database
 * @property {(sql: string, parameters?: any[] | {[name: string]: any}) => DbSync} exec - Execute SQL with optional parameters
 * @property {(sql: string) => DbSync} read - Execute a SQL script
 * @property {(src: string) => DbSync} load - Load database from path
 * @property {(dest?: string) => DbSync | ArrayBuffer} save - Save database to path or return ArrayBuffer
 * @property {() => SplSync} close - Close the database
 * @property {ResultData} get - Get query results
 */

/**
 * SQLite constants
 * @typedef {Object} SqliteConstants
 * @property {0} OK
 * @property {100} ROW
 * @property {101} DONE
 * @property {1} INTEGER
 * @property {2} FLOAT
 * @property {3} TEXT
 * @property {4} BLOB
 * @property {5} NULL
 */

export {};

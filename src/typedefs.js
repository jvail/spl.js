/**
 * Shared type definitions for spl.js
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
 * @property {string} 'spl.js' - spl.js version
 */

/**
 * Mount options for browser (file data to mount in virtual filesystem)
 * @typedef {Object} MountOption
 * @property {string} name - Name for the mounted file
 * @property {ArrayBuffer|Blob|File|FileList|string} data - File data or URL
 */

/**
 * Extension definition for extending SPL or DB API
 * @typedef {Object} Extension
 * @property {'db'|'spl'} extends - What API to extend
 * @property {{[name: string]: Function}} fns - Extension functions
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

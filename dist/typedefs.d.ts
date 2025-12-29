export type AutoGeoJSON = {
    /**
     * - Precision used in Geometry to GeoJSON conversion
     */
    precision: number;
    /**
     * - Options as described in SpatiaLite's AsGeoJSON:
     * - 0: no options
     * - 1: GeoJSON BoundingBox
     * - 2: GeoJSON CRS (short)
     * - 3: BoundingBox + short CRS
     * - 4: GeoJSON CRS (long)
     * - 5: BoundingBox + long CRS
     */
    options: 0 | 1 | 2 | 3 | 4 | 5;
};
export type SplOptions = {
    /**
     * - Automatically stringify/parse JSON in results and parameters
     */
    autoJSON?: boolean;
    /**
     * - Automatically convert geometry blobs to GeoJSON
     */
    autoGeoJSON?: AutoGeoJSON | false;
};
/**
 * Query result with column names and row data
 */
export type ResultData = {
    /**
     * - First value of first row (or first row if multiple columns)
     */
    first: any;
    /**
     * - Flat array of all values
     */
    flat: any[];
    /**
     * - Array of row arrays
     */
    rows: any[][];
    /**
     * - Column names
     */
    cols: string[];
    /**
     * - Array of row objects keyed by column name
     */
    objs: any[];
    /**
     * - Free result memory
     */
    free: () => void;
};
/**
 * Version information object
 */
export type VersionInfo = {
    /**
     * - SpatiaLite version
     */
    spatialite: string;
    /**
     * - SQLite version
     */
    sqlite: string;
    /**
     * - GEOS version
     */
    geos: string;
    /**
     * - PROJ version
     */
    proj: string;
    /**
     * - librttopo version
     */
    rttopo: string;
    /**
     * - spl.js version
     */
    spl: string;
};
/**
 * Mount options for browser (file data to mount in virtual filesystem)
 */
export type MountOption = {
    /**
     * - Name for the mounted file
     */
    name: string;
    /**
     * - File data or URL
     */
    data: ArrayBuffer | Blob | File | FileList | string;
};
/**
 * Extension function for DB extensions - receives DbSync as first argument
 */
export type DbExtensionFn = (db: DbSync, ...args: any[]) => any;
/**
 * Extension function for SPL extensions - receives SplSync as first argument
 */
export type SplExtensionFn = (spl: SplSync, ...args: any[]) => any;
/**
 * Extension definition for extending the DB API
 */
export type DbExtension = {
    /**
     * - Extends the database API
     */
    extends: "db";
    /**
     * - Extension functions that receive DbSync as first argument
     */
    fns: {
        [name: string]: DbExtensionFn;
    };
};
/**
 * Extension definition for extending the SPL API
 */
export type SplExtension = {
    /**
     * - Extends the SPL API
     */
    extends: "spl";
    /**
     * - Extension functions that receive SplSync as first argument
     */
    fns: {
        [name: string]: SplExtensionFn;
    };
};
/**
 * Filesystem operations available in the worker (synchronous)
 */
export type SplFsSync = {
    /**
     * - Mount filesystem
     */
    mount: (path: string, mountpoint?: string, options?: MountOption[]) => SplSync;
    /**
     * - Unmount filesystem
     */
    unmount: (mountpoint: string) => SplSync;
    /**
     * - Read file from virtual filesystem
     */
    file: (path: string) => ArrayBuffer;
    /**
     * - List directory contents
     */
    dir: (path: string) => string[];
    /**
     * - Delete file from virtual filesystem
     */
    unlink: (path: string) => SplSync;
    /**
     * - Create directory in virtual filesystem
     */
    mkdir: (path: string) => SplSync;
};
/**
 * SPL instance available in the worker (synchronous API)
 * This is the type received by extension functions with `extends: 'spl'`
 */
export type SplSync = {
    /**
     * - Open a database
     */
    db: (path?: string | ArrayBuffer) => DbSync;
    /**
     * - Get version info
     */
    version: () => VersionInfo;
    /**
     * - Filesystem operations
     */
    fs: SplFsSync;
};
/**
 * Database instance available in the worker (synchronous API)
 * This is the type received by extension functions with `extends: 'db'`
 */
export type DbSync = {
    /**
     * - Attach another database
     */
    attach: (db: string, schema: string) => DbSync;
    /**
     * - Detach a database
     */
    detach: (schema: string) => DbSync;
    /**
     * - Execute SQL with optional parameters
     */
    exec: (sql: string, parameters?: any[] | {
        [name: string]: any;
    }) => DbSync;
    /**
     * - Execute a SQL script
     */
    read: (sql: string) => DbSync;
    /**
     * - Load database from path
     */
    load: (src: string) => DbSync;
    /**
     * - Save database to path or return ArrayBuffer
     */
    save: (dest?: string) => DbSync | ArrayBuffer;
    /**
     * - Close the database
     */
    close: () => SplSync;
    /**
     * - Get query results
     */
    get: ResultData;
};
/**
 * SQLite constants
 */
export type SqliteConstants = {
    OK: 0;
    ROW: 100;
    DONE: 101;
    INTEGER: 1;
    FLOAT: 2;
    TEXT: 3;
    BLOB: 4;
    NULL: 5;
};

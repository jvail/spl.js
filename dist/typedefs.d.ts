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
     * 'spl.js' - spl.js version
     */
    "": string;
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
 * Extension definition for extending SPL or DB API
 */
export type Extension = {
    /**
     * - What API to extend
     */
    extends: "db" | "spl";
    /**
     * - Extension functions
     */
    fns: {
        [name: string]: Function;
    };
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

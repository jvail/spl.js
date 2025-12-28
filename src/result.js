/** @import { ResultData } from './typedefs.js' */

/**
 * Creates a result object from query columns and rows
 * @param {string[]} cols - Column names
 * @param {any[][]} rows - Row data arrays
 * @returns {ResultData}
 */
const result = function (cols = [], rows = []) {
    // @ts-ignore - constructor pattern
    if (!new.target) return Object.freeze(new result(cols, rows));

    /**
     * Convert a row array to an object keyed by column names
     * @param {any[]} row
     * @returns {Object.<string, any>}
     */
    const toObj = (row) =>
        cols.reduce((o, col, i) => {
            o[col] = row[i];
            return o;
        }, /** @type {Object.<string, any>} */ ({}));

    Object.defineProperty(this, 'first', {
        get: () => (rows[0] && rows[0].length == 1 ? rows[0][0] : rows[0]),
    });
    Object.defineProperty(this, 'flat', { get: () => rows.flat() });
    Object.defineProperty(this, 'cols', { get: () => cols.slice() });
    Object.defineProperty(this, 'rows', { get: () => rows.slice() });
    Object.defineProperty(this, 'objs', {
        get: () => rows.map((row) => toObj(row)),
    });

    this.free = () => {
        cols = [];
        rows = [];
    };
};

export default result;

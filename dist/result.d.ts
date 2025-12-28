export default result;
/** @import { ResultData } from './typedefs.js' */
/**
 * Creates a result object from query columns and rows
 * @param {string[]} cols - Column names
 * @param {any[][]} rows - Row data arrays
 * @returns {ResultData}
 */
declare function result(cols?: string[], rows?: any[][]): ResultData;
declare class result {
    constructor(cols?: string[], rows?: any[][]);
    free: () => void;
}
import type { ResultData } from './typedefs.js';

/** @import { SplOptions } from './typedefs.js' */
/** @import { SplInstance } from './spl.js' */

import spl from './spl.js';

/**
 * Initialize spl.js for Node.js
 * @param {SplOptions} [options={}] - Configuration options
 * @returns {Promise<SplInstance>}
 */
export default (options = {}) => spl(null, options);

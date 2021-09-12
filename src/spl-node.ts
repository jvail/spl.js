import { ISPLSync, ISplOptions } from './interfaces';
import spl from './spl';

export default (options: ISplOptions): ISPLSync => spl(null, options);


/** @type {import('./index.mjs').Result} */
const result = function (cols = [], rows = []) {

    if (!new.target) return Object.freeze(new result(cols, rows));

    const toObj = row => cols.reduce((o, col, i) => {
        o[col] = row[i];
        return o;
    }, {});

    Object.defineProperty(this, 'first', { get: () => rows[0] && rows[0].length == 1 ? rows[0][0] : rows[0] });
    Object.defineProperty(this, 'flat', { get: () => rows.flat() });
    Object.defineProperty(this, 'cols', { get: () => cols.slice() });
    Object.defineProperty(this, 'rows', { get: () => rows.slice() });
    Object.defineProperty(this, 'objs', { get: () => rows.map(row => toObj(row)) });

    this.free = () => {
        cols = [];
        rows = [];
    };

};

export default result;

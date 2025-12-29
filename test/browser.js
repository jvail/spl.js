import tape from 'tape';
import SPL from '../dist/index.js';

tape('version tests', async (t) => {
    t.plan(5);
    const db = await SPL().then((spl) => spl.db());

    t.equal(await db.exec('select sqlite_version()').get.first, '3.51.1');
    t.equal(
        await db.exec('select spatialite_version()').get.first,
        '5.1.1-rc0',
    );
    t.equal(
        await db.exec('select geos_version()').get.first,
        '3.14.1-CAPI-1.20.5',
    );
    t.equal(
        await db.exec('select proj_version()').get.first,
        'Rel. 9.7.1, December 1st, 2025',
    );
    t.equal(await db.exec('select rttopo_version()').get.first, '1.1.0');

    await db.close();
});

tape('feature tests', async (t) => {
    t.plan(1);

    const db = await SPL().then((spl) => spl.db());

    t.deepEqual(
        await db
            .exec(
                `select
        HasIconv(),
        HasMathSQL(),
        HasProj(),
        HasProj6(),
        HasGeos(),
        HasGeosAdvanced(),
        HasGeosTrunk(),
        HasGeosReentrant(),
        HasGeosOnlyReentrant(),
        HasMinZip(),
        HasRtTopo(),
        HasLibXML2(),
        HasEpsg(),
        HasFreeXL(),
        HasGeoPackage(),
        HasGCP(),
        HasTopology(),
        HasKNN(),
        HasRouting()`,
            )
            .get.objs.then((objs) => objs[0]),
        {
            'HasIconv()': 1,
            'HasMathSQL()': 1,
            'HasProj()': 1,
            'HasProj6()': 0,
            'HasGeos()': 1,
            'HasGeosAdvanced()': 1,
            'HasGeosTrunk()': 0,
            'HasGeosReentrant()': 1,
            'HasGeosOnlyReentrant()': 0,
            'HasMinZip()': 1,
            'HasRtTopo()': 1,
            'HasLibXML2()': 0,
            'HasEpsg()': 1,
            'HasFreeXL()': 0,
            'HasGeoPackage()': 1,
            'HasGCP()': 1,
            'HasTopology()': 1,
            'HasKNN()': 1,
            'HasRouting()': 1,
        },
    );

    await db.close();
});

tape('function chaining tests', async (t) => {
    const spl = await SPL();
    const db = await spl.db();

    t.plan(4);

    t.equals(await db.read('select 1'), db);
    t.equals(await db.exec('select 1'), db);
    t.equals(await db.exec('select 1').get.free(), undefined);
    t.equals(await db.close(), spl);
});

tape('format tests', async (t) => {
    t.plan(5);

    const db = await SPL().then((spl) => spl.db());

    t.deepEqual(
        await db.exec('select * from (values(1,2,3), (4,5,6))').get.rows,
        [
            [1, 2, 3],
            [4, 5, 6],
        ],
    );
    t.deepEqual(
        await db.exec('select * from (values(1,2,3), (4,5,6))').get.flat,
        [1, 2, 3, 4, 5, 6],
    );
    t.deepEqual(await db.exec('select 1 as first').get.objs, [{ first: 1 }]);
    t.deepEqual(await db.exec('select 1 as first, 2 second').get.cols, [
        'first',
        'second',
    ]);
    t.deepEqual(
        await db.exec('select * from (values(1,2,3), (4,5,6))').get.first,
        [1, 2, 3],
    );

    await db.close();
});

tape('parameter tests', async (t) => {
    t.plan(10);

    const db = await SPL().then((spl) => spl.db());

    t.deepEqual(await db.exec('select ?1 a, ?1 b', [1]).get.objs, [
        { a: 1, b: 1 },
    ]);
    t.deepEqual(await db.exec('select ? a, ? b', [1, 2]).get.objs, [
        { a: 1, b: 2 },
    ]);
    t.deepEqual(await db.exec('select ? a', [1, 2]).get.objs, [
        { a: 1 },
        { a: 2 },
    ]);
    t.deepEqual(await db.exec('select @a', { '@a': 1 }).get.objs, [
        { '@a': 1 },
    ]);
    t.deepEqual(await db.exec('select @a, @a, @b', { '@a': 'text' }).get.objs, [
        { '@a': 'text', '@a1': 'text', '@b': null },
    ]);
    t.deepEqual(await db.exec('select :a', { ':a': 1 }).get.objs, [
        { ':a': 1 },
    ]);
    t.deepEqual(await db.exec('select $a', { $a: 1 }).get.objs, [{ $a: 1 }]);
    t.deepEqual(
        await db.exec('select ? as a, ? as b, ? as c, ? as d, ? as e', [
            1,
            null,
            false,
            'text',
            new Uint8Array([0, 1]).buffer,
        ]).get.objs,
        [{ a: 1, b: null, c: 0, d: 'text', e: new Uint8Array([0, 1]).buffer }],
    );
    t.deepEqual(
        await db.exec('select @a a, @b b', [
            { '@a': 1.0, '@b': 1.1 },
            { '@a': 2.0, '@b': 2.1 },
            { '@a': 3.0, '@b': 3.1 },
        ]).get.objs,
        [
            { a: 1.0, b: 1.1 },
            { a: 2.0, b: 2.1 },
            { a: 3.0, b: 3.1 },
        ],
    );
    t.equals(
        await db.exec("select * from (values ('a'), ('b')) where column1 = ?", [
            'a',
        ]).get.first,
        'a',
    );

    await db.close();
});

tape('type tests', async (t) => {
    t.plan(4);

    const db = await SPL().then((spl) => spl.db());

    t.deepEqual(await db.exec('select 1, 1.1').get.first, [1, 1.1]);
    t.deepEqual(await db.exec('select true, false').get.first, [1, 0]);
    t.deepEqual(
        await db.exec("select 'ABC', 'abc', 'äüÖß', '☀', '☎'").get.first,
        ['ABC', 'abc', 'äüÖß', '☀', '☎'],
    );

    const blobResult = await db.exec('select ?', [
        new Uint8Array([1, 2, 3]).buffer,
    ]).get.first;
    t.deepEqual(Array.from(new Uint8Array(blobResult)), [1, 2, 3]);

    await db.close();
});

tape('strict quoting tests', async (t) => {
    t.plan(2);

    const db = await SPL().then((spl) => spl.db());

    try {
        await db.exec('select "quoted"').get.first;
        t.fail('should have thrown');
    } catch (_) {
        t.pass('double quotes throw');
    }

    try {
        await db.exec("select 'quoted'").get.first;
        t.pass('single quotes work');
    } catch (_) {
        t.fail('should not have thrown');
    }

    await db.close();
});

tape('mounting', async (t) => {
    const file = 'files/dbs/sqlite3.db';
    const sqlite = await fetch(file).then((res) => res.arrayBuffer());
    const spl = await SPL();

    t.plan(2);

    t.equals(
        await spl
            .fs.mount('a', [{ name: 'sqlite', data: sqlite }])
            .db()
            .attach('file:a/sqlite', 'test')
            .exec('select name from test.sqlite_master').get.first,
        'i_am_a_file_db_table',
    );

    t.equals(
        await spl
            .fs.mount('b', [
                {
                    name: 'sqlite',
                    data: new URL(file, window.location.href).toString(),
                },
            ])
            .db()
            .attach('file:b/sqlite?immutable=1', 'test')
            .exec('select name from test.sqlite_master').get.first,
        'i_am_a_file_db_table',
    );
});

// copied from src/sqlean/test/stats.sql
tape('extensions - stats', async (t) => {
    t.plan(7);

    const spl = await SPL();
    const db = await spl.db();

    t.true(
        await db.exec(
            'select percentile(value, 25) = 25.5 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        await db.exec(
            'select round(stddev(value), 1) = 28.7 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        await db.exec(
            'select round(stddev_samp(value), 1) = 28.7 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        await db.exec(
            'select round(stddev_pop(value), 1) = 28.6 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        await db.exec(
            'select variance(value) = 825 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        await db.exec(
            'select var_samp(value) = 825 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        await db.exec(
            'select round(var_pop(value), 0) = 817 from generate_series(1, 99)',
        ).get.first,
    );
});

tape('sql worker error handling', async (t) => {
    t.plan(3);

    const db = await SPL().then((spl) => spl.db());

    t.equals(
        await db
            .exec('select a')
            .get.first.then(() => false)
            .catch(() => true),
        true,
    );

    t.equals(
        await db
            .exec('select a')
            .get.first.then(
                () => false,
                () => true,
            )
            .catch(() => false),
        true,
    );

    t.equals(
        await (async () => {
            try {
                await db.exec('select a').get.first;
                return false;
            } catch (_) {
                return true;
            }
        })(),
        true,
    );
});

tape('large inserts', async (t) => {
    t.plan(2);

    const db = await SPL().then((spl) => spl.db());
    const ii = 10000;

    let script = `
        SELECT InitSpatialMetaData(1);
        CREATE TABLE large (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);
        SELECT AddGeometryColumn('large', 'geometry', 4326, 'GEOMETRY', 'XY');
    `;

    const geom = `{
        "type":"Polygon",
        "coordinates":[[[35.172522345781324,31.807637007387367],[35.1730225777626,31.807379406789376],[35.17296088695526,31.807292779878278],[35.17246065497398,31.807550380717725],[35.172522345781324,31.807637007387367]]]
    }`;
    const values = [];

    for (let i = 0; i < ii; ++i) {
        script += `\nINSERT INTO large (geometry) VALUES (SetSRID(GeomFromGeoJSON('${geom}'), 4326));`;
        values.push(geom);
    }

    await db.read(script);
    t.equals(await db.exec('SELECT count(*) FROM large').get.first, ii);

    await db.exec(
        `INSERT OR REPLACE INTO large (geometry) VALUES (SetSRID(GeomFromGeoJSON(?), 4326))`,
        values,
    );
    t.equals(await db.exec('SELECT count(*) FROM large').get.first, 2 * ii);
});

tape('proj embeded', async (t) => {
    t.plan(2);

    const db = await SPL().then((spl) => spl.db());

    await db.exec('SELECT InitSpatialMetaDataFull(1)');

    t.deepEqual(
        await db.exec(
            'SELECT Transform(GeomFromText(?, 4326), 3857)',
            'Point(10 10)',
        ).get.first,
        { type: 'Point', coordinates: [1113194.907933, 1118889.974858] },
    );

    t.deepEqual(
        await db.exec(
            'SELECT Transform(GeomFromText(?, 4326), 32601)',
            'Point(10 10)',
        ).get.first,
        { type: 'Point', coordinates: [-268980.132218, 18882329.956321] },
    );
});

// TODO: firefox: Dynamic module import is disabled or not supported in this context
tape('extensions', async (t) => {
    /** @type {import('../dist/index.js').DbExtension[]} */
    const extensions = [
        {
            extends: 'db',
            fns: {
                tables: (db) =>
                    db.exec(
                        "select name from sqlite_master where type='table'",
                    ),
                master: (db, type) =>
                    db.exec('select name from sqlite_master where type=?', [
                        type,
                    ]),
                async_fn: (_, delay) => {
                    return new Promise((resolve) =>
                        setTimeout(resolve(delay), delay),
                    );
                },
            },
        },
        {
            extends: 'spl',
            fns: {
                spatialite_version: (spl) => {
                    const db = spl.db();
                    const version = db.exec('select spatialite_version()').get
                        .first;
                    db.close();
                    return version;
                },
            },
        },
    ];

    const spl = await SPL({}, extensions);

    const db = spl.db().read(`
            create table hello (world);
            create view hello_view as select * from hello;
        `);

    t.plan(4);

    t.equals(await db.ex.tables().get.first, 'hello');
    t.equals(await db.ex.master('view').get.first, 'hello_view');
    t.equals(await spl.ex.spatialite_version(), '5.1.1-rc0');
    t.equals(await db.ex.async_fn(10), 10);
});

tape('json', async (t) => {
    t.plan(4);

    let db = (
        await SPL({
            autoGeoJSON: {
                precision: 0,
                options: 0,
            },
        })
    ).db();

    t.deepEqual(
        await db.exec('select json(@js)', { '@js': { hello: 'json' } }).get
            .first,
        { hello: 'json' },
    );

    t.deepEqual(
        await db.exec('select geomfromtext(?)', ['POINT(11.1 11.1)']).get.first,
        { type: 'Point', coordinates: [11, 11] },
    );

    db.close();

    // https://github.com/jvail/spl.js/issues/33
    db = (
        await SPL({
            autoGeoJSON: {
                precision: 8,
                options: 0,
            },
        })
    ).db();

    const [a, b] = await fetch('files/json/precision.json').then((res) =>
        res.json(),
    );

    t.doesNotThrow(
        async () =>
            await db.exec(
                'SELECT CastToMulti(ST_Union(GeomFromGeoJSON(@a), GeomFromGeoJSON(@b)))',
                { '@a': a, '@b': b },
            ).get.first,
    );

    t.doesNotThrow(
        async () =>
            await db.exec(
                `SELECT CastToMulti(ST_Union(GeomFromGeoJSON('${JSON.stringify(a)}'), GeomFromGeoJSON('${JSON.stringify(b)}'))) as a`,
            ).get.first,
    );

    db.close();
});

tape('spl.version() method', async (t) => {
    t.plan(6);

    const spl = await SPL();
    const v = await spl.version();

    t.equals(typeof v.spatialite, 'string');
    t.equals(typeof v.sqlite, 'string');
    t.equals(typeof v.geos, 'string');
    t.equals(typeof v.proj, 'string');
    t.equals(typeof v.rttopo, 'string');
    t.equals(typeof v.spl, 'string');
});

tape('execute sql scripts', async (t) => {
    t.plan(2);

    const db = await SPL().then((spl) => spl.db());

    const result = await db
        .read(
            `
            create table test (col);
            insert into test values (1);
            insert into test values (2);
        `,
        )
        .exec('select * from test').get.objs;

    t.deepEqual(result, [{ col: 1 }, { col: 2 }]);

    try {
        await db.read('this is not sql');
        t.fail('should have thrown');
    } catch (_) {
        t.pass('invalid SQL throws');
    }

    await db.close();
});

tape('save to ArrayBuffer', async (t) => {
    t.plan(3);

    const spl = await SPL();
    const db = await spl.db();
    await db.exec('create table t(x)');
    await db.exec('insert into t values(123)');

    const buf = await db.save();

    t.true(buf instanceof ArrayBuffer);
    t.true(buf.byteLength > 0);

    // Verify the ArrayBuffer can be used to create a new database
    const db2 = await spl.db(buf);
    t.equals(await db2.exec('select x from t').get.first, 123);

    await db.close();
    await db2.close();
});

tape('db from arraybuffer', async (t) => {
    t.plan(1);

    const buf = await fetch('files/dbs/sqlite3.db').then((res) =>
        res.arrayBuffer(),
    );

    const db = await SPL().then((spl) => spl.db(buf));
    t.deepEqual(await db.exec('select * from i_am_a_file_db_table').get.objs, [
        { col: 1 },
    ]);

    await db.close();
});

tape('error handling - double close', async (t) => {
    t.plan(1);

    const spl = await SPL();
    const db = await spl.db();
    await db.close();

    try {
        await db.close();
        t.fail('should have thrown');
    } catch (e) {
        // Error may be string or Error object in worker context
        const msg = typeof e === 'string' ? e : e.message || String(e);
        t.true(msg.includes('Database closed'));
    }
});

tape('error handling - exec on closed db', async (t) => {
    t.plan(1);

    const spl = await SPL();
    const db = await spl.db();
    await db.close();

    try {
        await db.exec('select 1').get.first;
        t.fail('should have thrown');
    } catch (e) {
        const msg = typeof e === 'string' ? e : e.message || String(e);
        t.true(msg.includes('Database closed'));
    }
});

tape('error handling - read on closed db', async (t) => {
    t.plan(1);

    const spl = await SPL();
    const db = await spl.db();
    await db.close();

    try {
        await db.read('select 1');
        t.fail('should have thrown');
    } catch (e) {
        const msg = typeof e === 'string' ? e : e.message || String(e);
        t.true(msg.includes('Database closed'));
    }
});

tape('error handling - invalid SQL', async (t) => {
    t.plan(2);

    const db = await SPL().then((spl) => spl.db());

    try {
        await db.exec('not valid sql').get.first;
        t.fail('should have thrown');
    } catch (_) {
        t.pass('invalid SQL throws');
    }

    try {
        await db.exec('select from where').get.first;
        t.fail('should have thrown');
    } catch (_) {
        t.pass('syntax error throws');
    }

    await db.close();
});

tape('error handling - save/load on closed db', async (t) => {
    t.plan(2);

    const spl = await SPL();
    const db = await spl.db();
    await db.close();

    try {
        await db.save();
        t.fail('should have thrown');
    } catch (e) {
        const msg = typeof e === 'string' ? e : e.message || String(e);
        t.true(msg.includes('Database closed'));
    }

    try {
        await db.load('test.db');
        t.fail('should have thrown');
    } catch (e) {
        const msg = typeof e === 'string' ? e : e.message || String(e);
        t.true(msg.includes('Database closed'));
    }
});

tape('options - autoJSON disabled', async (t) => {
    t.plan(2);

    const db = (await SPL({ autoJSON: false })).db();

    // JSON should be returned as string, not parsed
    const res = await db.exec("select json_object('a', 1) as j").get.first;
    t.equals(typeof res, 'string');
    t.equals(res, '{"a":1}');

    await db.close();
});

tape('options - autoGeoJSON disabled', async (t) => {
    t.plan(2);

    const db = (await SPL({ autoGeoJSON: false })).db();

    // Geometry should be returned as ArrayBuffer, not GeoJSON
    const res = await db.exec("select geomfromtext('POINT(1 2)')").get.first;
    t.true(res instanceof ArrayBuffer);
    t.true(res.byteLength > 0);

    await db.close();
});

tape('options - both autoJSON and autoGeoJSON disabled', async (t) => {
    t.plan(2);

    const db = (await SPL({ autoJSON: false, autoGeoJSON: false })).db();

    const jsonRes = await db.exec("select json_object('x', 1)").get.first;
    t.equals(typeof jsonRes, 'string');

    const geomRes = await db.exec("select geomfromtext('POINT(0 0)')").get
        .first;
    t.true(geomRes instanceof ArrayBuffer);

    await db.close();
});

tape('edge case - empty result set', async (t) => {
    t.plan(5);

    const db = await SPL().then((spl) => spl.db());

    const res = db.exec('select 1 where 0').get;

    t.deepEquals(await res.rows, []);
    t.deepEquals(await res.flat, []);
    t.deepEquals(await res.objs, []);
    t.equals(await res.first, undefined);
    t.deepEquals(await res.cols, ['1']);

    await db.close();
});

tape('edge case - NULL values in results', async (t) => {
    t.plan(3);

    const db = await SPL().then((spl) => spl.db());

    t.equals(await db.exec('select null').get.first, null);
    t.deepEquals(await db.exec('select null as a, 1 as b').get.objs, [
        { a: null, b: 1 },
    ]);
    t.deepEquals(await db.exec('select null, null, null').get.flat, [
        null,
        null,
        null,
    ]);

    await db.close();
});

tape('edge case - multiple databases from same spl instance', async (t) => {
    t.plan(3);

    const spl = await SPL();

    const db1 = await spl.db();
    const db2 = await spl.db();

    await db1.exec('create table t1(x)');
    await db1.exec('insert into t1 values(1)');

    // db2 should not see db1's table (separate in-memory databases)
    try {
        await db2.exec('select * from t1').get.first;
        t.fail('should have thrown');
    } catch (_) {
        t.pass('separate databases are isolated');
    }

    // Each db works independently
    await db2.exec('create table t2(y)');
    await db2.exec('insert into t2 values(2)');

    t.equals(await db1.exec('select x from t1').get.first, 1);
    t.equals(await db2.exec('select y from t2').get.first, 2);

    await db1.close();
    await db2.close();
});

tape('edge case - transactions', async (t) => {
    t.plan(3);

    const db = await SPL().then((spl) => spl.db());

    // Basic transaction
    await db.read(`
        BEGIN;
        CREATE TABLE t(x);
        INSERT INTO t VALUES(1);
        COMMIT;
    `);
    t.equals(await db.exec('select x from t').get.first, 1);

    // Rollback
    await db.read('BEGIN;');
    await db.exec('insert into t values(2)');
    await db.read('ROLLBACK;');
    t.equals(await db.exec('select count(*) from t').get.first, 1);

    // Nested savepoints
    await db.read(`
        BEGIN;
        INSERT INTO t VALUES(3);
        SAVEPOINT sp1;
        INSERT INTO t VALUES(4);
        ROLLBACK TO sp1;
        COMMIT;
    `);
    t.equals(await db.exec('select count(*) from t').get.first, 2);

    await db.close();
});

tape('edge case - result.free() clears data', async (t) => {
    t.plan(4);

    const db = await SPL().then((spl) => spl.db());

    const res = db.exec('select 1, 2, 3').get;
    t.equals((await res.flat).length, 3);
    t.equals((await res.rows).length, 1);

    await res.free();

    t.equals((await res.flat).length, 0);
    t.equals((await res.rows).length, 0);

    await db.close();
});

tape('edge case - in-memory database basic operations', async (t) => {
    t.plan(4);

    const spl = await SPL();

    // Explicit :memory:
    const db1 = await spl.db(':memory:');
    await db1.exec('create table t(x)');
    await db1.exec('insert into t values(1)');
    t.equals(await db1.exec('select x from t').get.first, 1);
    await db1.close();

    // Implicit in-memory (no argument)
    const db2 = await spl.db();
    await db2.exec('create table t(x)');
    await db2.exec('insert into t values(2)');
    t.equals(await db2.exec('select x from t').get.first, 2);
    await db2.close();

    // Empty string should also work as in-memory
    const db3 = await spl.db('');
    await db3.exec('create table t(x)');
    await db3.exec('insert into t values(3)');
    t.equals(await db3.exec('select x from t').get.first, 3);
    await db3.close();

    // null should work as in-memory
    const db4 = await spl.db(null);
    await db4.exec('create table t(x)');
    await db4.exec('insert into t values(4)');
    t.equals(await db4.exec('select x from t').get.first, 4);
    await db4.close();
});

tape('mount with Blob', async (t) => {
    t.plan(1);

    const sqliteData = await fetch('files/dbs/sqlite3.db').then((res) =>
        res.arrayBuffer(),
    );
    const blob = new Blob([sqliteData]);

    const spl = await SPL();
    spl.fs.mount('blobs', [{ name: 'test.db', data: blob }]);

    const db = await spl.db();
    await db.attach('file:blobs/test.db?immutable=1', 'test');

    t.equals(
        await db.exec('select name from test.sqlite_master').get.first,
        'i_am_a_file_db_table',
    );

    await db.close();
});

tape('mount with ArrayBuffer', async (t) => {
    t.plan(1);

    const sqliteData = await fetch('files/dbs/sqlite3.db').then((res) =>
        res.arrayBuffer(),
    );

    const spl = await SPL();
    spl.fs.mount('buffers', [{ name: 'test.db', data: sqliteData }]);

    const db = await spl.db();
    await db.attach('file:buffers/test.db?immutable=1', 'test');

    t.equals(
        await db.exec('select name from test.sqlite_master').get.first,
        'i_am_a_file_db_table',
    );

    await db.close();
});

tape('get.sync accessor', async (t) => {
    t.plan(6);

    const db = await SPL().then((spl) => spl.db());

    const res = await db.exec('select 1 as a, 2 as b').get.sync;

    t.deepEquals(res.cols, ['a', 'b']);
    t.deepEquals(res.rows, [[1, 2]]);
    t.deepEquals(res.flat, [1, 2]);
    t.deepEquals(res.objs, [{ a: 1, b: 2 }]);
    // first returns entire row when multiple columns, single value when one column
    t.deepEquals(res.first, [1, 2]);

    // Test single column - first should return the value directly
    const res2 = await db.exec('select 42 as val').get.sync;
    t.equals(res2.first, 42);

    await db.close();
});

tape('attach and detach', async (t) => {
    t.plan(3);

    const sqliteData = await fetch('files/dbs/sqlite3.db').then((res) =>
        res.arrayBuffer(),
    );

    const spl = await SPL();
    spl.fs.mount('attach_test', [{ name: 'sqlite3.db', data: sqliteData }]);

    const db = await spl.db();
    await db.attach('file:attach_test/sqlite3.db?immutable=1', 'other');

    t.equals(
        await db.exec('select col from other.i_am_a_file_db_table').get.first,
        1,
    );

    // Detach and verify it's gone
    await db.detach('other');

    try {
        await db.exec('select col from other.i_am_a_file_db_table').get.first;
        t.fail('should have thrown');
    } catch (_) {
        t.pass('detach works - table no longer accessible');
    }

    // Re-attach works
    await db.attach('file:attach_test/sqlite3.db?immutable=1', 'other');
    t.equals(
        await db.exec('select col from other.i_am_a_file_db_table').get.first,
        1,
    );

    await db.close();
});

tape('unmount', async (t) => {
    t.plan(2);

    const sqliteData = await fetch('files/dbs/sqlite3.db').then((res) =>
        res.arrayBuffer(),
    );

    const spl = await SPL();
    await spl.fs.mount('unmount_test', [{ name: 'test.db', data: sqliteData }]);

    // Verify mount works
    const db = await spl.db();
    await db.attach('file:unmount_test/test.db?immutable=1', 'test');
    t.equals(
        await db.exec('select name from test.sqlite_master').get.first,
        'i_am_a_file_db_table',
    );
    await db.detach('test');
    await db.close();

    // Unmount should work
    t.doesNotThrow(async () => await spl.fs.unmount('unmount_test'));
});

tape('save to named file and load', async (t) => {
    t.plan(1);

    const spl = await SPL();

    const db1 = await spl.db();
    await db1.read(`
        create table test (col);
        insert into test values (42);
    `);

    // Save to ArrayBuffer and create new db from it
    const buf = await db1.save();
    await db1.close();

    // Load into new database
    const db2 = await spl.db(buf);
    t.equals(await db2.exec('select col from test').get.first, 42);

    await db2.close();
});

tape('autoincrement: https://github.com/jvail/spl.js/issues/15', async (t) => {
    t.plan(1);

    const db = await SPL().then((spl) => spl.db());
    const srid = 32636;
    const tableName = 'test';
    const script = `
        SELECT InitSpatialMetadata(1);
        CREATE TABLE ${tableName} (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, field INTEGER, src_id TEXT);
        SELECT AddGeometryColumn('${tableName}', 'geometry', ${srid}, 'GEOMETRY', 'XY');
    `;
    await db.read(script);
    const batchSize = 10000;
    const geom =
        '{"type": "Polygon", "coordinates": [[[35.172522345781324,31.807637007387367],[35.1730225777626,31.807379406789376],[35.17296088695526,31.807292779878278],[35.17246065497398,31.807550380717725],[35.172522345781324,31.807637007387367]]]}';

    const parameters = [];
    for (let i = 0; i < batchSize; ++i) {
        parameters.push({
            '@field': i,
            '@src_id': i.toString(),
            '@geometry': geom,
        });
    }
    const statement = `INSERT OR REPLACE INTO ${tableName} (field, src_id, geometry) VALUES (@field, @src_id, ST_Transform(SetSRID(GeomFromGeoJSON(@geometry), 4326), ${srid}));`;
    await db.exec(statement, parameters);

    t.equals(await db.exec('select max(id) from test').get.first, batchSize);

    await db.close();
});

tape('geopackage loading', async (t) => {
    t.plan(2);

    const spl = await SPL();
    await spl.fs.mount('gpkg', [
        {
            name: 'london.gpkg',
            data: new URL(
                'files/dbs/london.gpkg',
                window.location.href,
            ).toString(),
        },
    ]);

    const db = await spl.db().load('file:gpkg/london.gpkg?immutable=1').read(`
            select enablegpkgmode();
            select initspatialmetadata(1);
        `);

    // Check that we can read from the geopackage
    const count = await db.exec('select count(*) from london_boroughs').get
        .first;
    t.true(count > 0);

    // Check that geometry is returned as GeoJSON (could be Polygon or MultiPolygon)
    const geom = await db.exec('select geom from london_boroughs limit 1').get
        .first;
    t.true(geom.type === 'Polygon' || geom.type === 'MultiPolygon');

    await db.close();
});

tape('import geojson from mounted file', async (t) => {
    t.plan(2);

    // Create a simple GeoJSON FeatureCollection
    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { name: 'Point 1' },
                geometry: { type: 'Point', coordinates: [0, 0] },
            },
            {
                type: 'Feature',
                properties: { name: 'Point 2' },
                geometry: { type: 'Point', coordinates: [1, 1] },
            },
        ],
    };

    const blob = new Blob([JSON.stringify(geojson)], {
        type: 'application/json',
    });

    const spl = await SPL();
    await spl.fs.mount('json', [{ name: 'test.geojson', data: blob }]);

    const db = await spl.db().read(`
        SELECT InitSpatialMetaDataFull(1);
        SELECT ImportGeoJSON('/json/test.geojson', 'points');
    `);

    const count = await db.exec('select count(*) from points').get.first;
    t.equals(count, 2);

    const names = await db.exec('select name from points order by name').get
        .flat;
    t.deepEquals(names, ['Point 1', 'Point 2']);

    await db.close();
});

tape('extension with async function', async (t) => {
    t.plan(2);

    /** @type {import('../dist/index.js').DbExtension} */
    const extension = {
        extends: 'db',
        fns: {
            getCountAsync: async (db, table) => {
                // Simulate async operation
                await new Promise((resolve) => setTimeout(resolve, 10));
                return db.exec(`SELECT count(*) FROM ${table}`).get.first;
            },
            sumAsync: async (_, a, b) => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                return a + b;
            },
        },
    };

    const spl = await SPL({}, [extension]);
    const db = await spl.db().read(`
        create table items (val);
        insert into items values (1), (2), (3);
    `);

    const count = await db.ex.getCountAsync('items');
    t.equals(count, 3);

    const sum = await db.ex.sumAsync(10, 20);
    t.equals(sum, 30);

    await db.close();
});

tape('multiple mounts chained', async (t) => {
    t.plan(2);

    const db1Data = await fetch('files/dbs/sqlite3.db').then((res) =>
        res.arrayBuffer(),
    );

    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { id: 1 },
                geometry: { type: 'Point', coordinates: [0, 0] },
            },
        ],
    };

    const spl = await SPL();

    // Chain multiple mounts
    await spl
        .fs.mount('db1', [{ name: 'test.db', data: db1Data }])
        .fs.mount('json1', [
            {
                name: 'geo.json',
                data: new Blob([JSON.stringify(geojson)]),
            },
        ]);

    const db = await spl.db();
    await db.attach('file:db1/test.db?immutable=1', 'attached');

    // Access first mount
    t.equals(
        await db.exec('select name from attached.sqlite_master').get.first,
        'i_am_a_file_db_table',
    );

    // Access second mount via ImportGeoJSON
    await db.read(`
        SELECT InitSpatialMetaDataFull(1);
        SELECT ImportGeoJSON('/json1/geo.json', 'geo');
    `);
    t.equals(await db.exec('select count(*) from geo').get.first, 1);

    await db.close();
});

tape('proj.db mounting and transformation', async (t) => {
    t.plan(1);

    const spl = await SPL();

    // Mount proj_test.db (minimal proj.db with EPSG:5243)
    await spl.fs.mount('proj', [
        {
            name: 'proj.db',
            data: new URL(
                'files/dbs/proj_test.db',
                window.location.href,
            ).toString(),
        },
    ]);

    const db = await spl.db().read(`
        SELECT InitSpatialMetaDataFull(1);
        SELECT PROJ_SetDatabasePath('/proj/proj.db');
    `);

    // Test transformation using EPSG:5243 which requires full proj.db (not in proj_min.db)
    const result = await db.exec(
        "SELECT Transform(GeomFromText('POINT(10 10)', 5243), 4326)",
    ).get.first;

    // Check that transformation worked (same as node.js test)
    t.deepEquals(result, { type: 'Point', coordinates: [10.500143, 51.00009] });

    await db.close();
});

tape('file system API - readFile, readDir, unlink, mkdir', async (t) => {
    t.plan(8);

    const spl = await SPL();

    // Create export directory
    await spl.fs.mkdir('/export');

    const db = await spl.db();
    await db.read(`
        SELECT InitSpatialMetaDataFull(1);
        CREATE TABLE test_points (id INTEGER PRIMARY KEY, name TEXT);
        SELECT AddGeometryColumn('test_points', 'geom', 4326, 'POINT', 'XY');
        INSERT INTO test_points (id, name, geom) VALUES (1, 'Point A', MakePoint(0, 0, 4326));
        INSERT INTO test_points (id, name, geom) VALUES (2, 'Point B', MakePoint(1, 1, 4326));
    `);

    // Export to shapefile
    await db.exec(
        "SELECT ExportSHP('test_points', 'geom', '/export/points', 'UTF-8')",
    );

    // Read directory contents
    const files = await spl.fs.dir('/export');
    t.true(files.includes('points.shp'), 'should have .shp file');
    t.true(files.includes('points.shx'), 'should have .shx file');
    t.true(files.includes('points.dbf'), 'should have .dbf file');

    // Read one of the files
    const shpBuffer = await spl.fs.file('/export/points.shp');
    t.true(shpBuffer instanceof ArrayBuffer, 'readFile returns ArrayBuffer');
    t.true(shpBuffer.byteLength > 0, 'shapefile has content');

    // Delete files
    for (const file of files) {
        await spl.fs.unlink('/export/' + file);
    }

    // Verify deletion
    const filesAfter = await spl.fs.dir('/export');
    t.equals(filesAfter.length, 0, 'all files deleted');

    // Test error handling - read non-existent file
    try {
        await spl.fs.file('/export/nonexistent.shp');
        t.fail('should have thrown for non-existent file');
    } catch (err) {
        t.pass('throws on non-existent file');
    }

    // Test error handling - unlink non-existent file
    try {
        await spl.fs.unlink('/export/nonexistent.shp');
        t.fail('should have thrown for non-existent file');
    } catch (err) {
        t.pass('throws on unlink non-existent');
    }

    await db.close();
});

tape('browser-specific - terminate worker', async (t) => {
    t.plan(1);

    const spl = await SPL();
    const db = await spl.db();
    await db.exec('select 1');

    // terminate() should work without error
    spl.terminate();
    t.pass('terminate() completes without error');
});

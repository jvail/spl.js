// const tape = require('tape');
import tape from 'tape';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import events from 'events';
// tape (node:8860) MaxListenersExceededWarning:
events.EventEmitter.defaultMaxListeners = 100;

import SPL from '../dist/index.mjs';
// const fs = require('fs');
// const path = require('path');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keep = ['.gitkeep', '.gitignore'];
fs.readdir(path.join(__dirname, 'files/tmp'), (err, files) => {
    if (err) throw err;
    for (const file of files) {
        if (keep.indexOf(file) < 0) {
            fs.unlink(path.join(__dirname, 'files/tmp', file), (err) => {
                if (err) throw err;
            });
        }
    }
});

tape('version tests', async (t) => {
    t.plan(5);
    const spl = await SPL();

    const db = spl.db();

    t.equal(db.exec('select sqlite_version()').get.first, '3.51.1');
    t.equal(db.exec('select spatialite_version()').get.first, '5.1.1-rc0');
    t.equal(db.exec('select geos_version()').get.first, '3.14.1-CAPI-1.20.5');
    t.equal(
        db.exec('select proj_version()').get.first,
        'Rel. 9.7.1, December 1st, 2025',
    );
    t.equal(db.exec('select rttopo_version()').get.first, '1.1.0');

    db.close();
});

tape('feature tests', async (t) => {
    t.plan(1);

    const db = (await SPL()).db();

    t.deepEqual(
        db.exec(`select
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
        HasRouting()`).get.objs[0],
        {
            'HasIconv()': 1,
            'HasMathSQL()': 1,
            'HasProj()': 1,
            'HasProj6()': 0, // TODO: reports 0 but should be 1 -> fix in spatialite source?
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

    db.close();
});

tape('function chaining tests', async (t) => {
    const spl = await SPL();
    const db = spl.db();

    t.plan(4);

    t.equals(db.read('select 1'), db);
    t.equals(db.exec('select 1'), db);
    t.equals(db.exec('select 1').get.free(), undefined);
    t.equals(db.close(), spl);
});

tape('format tests', async (t) => {
    t.plan(5);

    const db = (await SPL()).db();

    t.deepEqual(db.exec('select * from (values(1,2,3), (4,5,6))').get.rows, [
        [1, 2, 3],
        [4, 5, 6],
    ]);
    t.deepEqual(
        db.exec('select * from (values(1,2,3), (4,5,6))').get.flat,
        [1, 2, 3, 4, 5, 6],
    );
    t.deepEqual(db.exec('select 1 as first').get.objs, [{ first: 1 }]);
    t.deepEqual(db.exec('select 1 as first, 2 second').get.cols, [
        'first',
        'second',
    ]);
    t.deepEqual(
        db.exec('select * from (values(1,2,3), (4,5,6))').get.first,
        [1, 2, 3],
    );

    db.close();
});

tape('parameter tests', async (t) => {
    t.plan(10);

    const db = (await SPL()).db();

    t.deepEqual(db.exec('select ?1 a, ?1 b', [1]).get.objs, [{ a: 1, b: 1 }]);

    t.deepEqual(db.exec('select ? a, ? b', [1, 2]).get.objs, [{ a: 1, b: 2 }]);
    t.deepEqual(db.exec('select ? a', [1, 2]).get.objs, [{ a: 1 }, { a: 2 }]);
    t.deepEqual(db.exec('select @a', { '@a': 1 }).get.objs, [{ '@a': 1 }]);
    t.deepEqual(db.exec('select @a, @a, @b', { '@a': 'text' }).get.objs, [
        { '@a': 'text', '@a1': 'text', '@b': null },
    ]);
    t.deepEqual(db.exec('select :a', { ':a': 1 }).get.objs, [{ ':a': 1 }]);
    t.deepEqual(db.exec('select $a', { $a: 1 }).get.objs, [{ $a: 1 }]);
    t.deepEqual(
        db.exec('select ? as a, ? as b, ? as c, ? as d, ? as e', [
            1,
            null,
            false,
            'text',
            new Uint8Array([0, 1]).buffer,
        ]).get.objs,
        [{ a: 1, b: null, c: 0, d: 'text', e: new Uint8Array([0, 1]).buffer }],
    );
    t.deepEqual(
        db.exec('select @a a, @b b', [
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
        db.exec("select * from (values ('a'), ('b')) where column1 = ?", ['a'])
            .get.first,
        'a',
    );

    db.close();
});

tape('type tests', async (t) => {
    t.plan(4);

    const db = (await SPL()).db();

    t.deepEqual(db.exec('select 1, 1.1').get.first, [1, 1.1]);
    t.deepEqual(db.exec('select true, false').get.first, [1, 0]);
    t.deepEqual(db.exec("select 'ABC', 'abc', 'äüÖß', '☀', '☎'").get.first, [
        'ABC',
        'abc',
        'äüÖß',
        '☀',
        '☎',
    ]);
    t.deepEqual(
        Array.from(
            new Uint8Array(
                db.exec('select ?', [new Uint8Array([1, 2, 3]).buffer]).get
                    .first,
            ),
        ),
        [1, 2, 3],
    );

    db.close();
});

tape('strict quoting tests', async (t) => {
    t.plan(2);

    const db = (await SPL()).db();

    t.throws(() => db.exec('select "quoted"'));
    t.doesNotThrow(() => db.exec("select 'quoted'"));

    db.close();
});

tape('shapefiles', async (t) => {
    t.plan(2);

    const db = (await SPL()).fs.mount(__dirname).db();

    t.deepEqual(
        db.exec('select importzipshp(?, ?, ?, ?) as count', [
            'files/shp/shp.zip',
            'ne_110m_admin_0_countries',
            'shpzip',
            'CP1252',
        ]).get.objs,
        [{ count: 177 }],
    );

    t.deepEqual(
        db.exec('select importshp(?, ?, ?) as count', [
            'files/shp/ne_110m_admin_0_countries',
            'shp',
            'CP1252',
        ]).get.objs,
        [{ count: 177 }],
    );
});

tape('memory and local dbs', async (t) => {
    t.plan(2);

    const s = (await SPL()).fs.mount(__dirname);
    let db = s.db('files/tmp/memory_and_local_dbs_1.db');
    db.exec('create table test(col)');
    db.exec('insert into test values(1)');
    db.close();
    db = s.db('files/tmp/memory_and_local_dbs_1.db');

    t.deepEqual(db.exec('select * from test').get.objs, [{ col: 1 }]);
    db.close();

    t.throws(() => s.db().export());
});

tape('execute sql scripts', async (t) => {
    t.plan(2);

    const db = (await SPL()).db();

    t.deepEqual(
        db
            .read(
                `
            create table test (col);
            insert into test values (1);
            insert into test values (2);
        `,
            )
            .exec('select * from test').get.objs,
        [{ col: 1 }, { col: 2 }],
    );

    t.throws(() => db.read('this is not sql'));
});

tape('mounting', async (t) => {
    t.plan(2);
    let db;

    db = (await SPL()).fs.mount(__dirname + '/files/shp/').db();

    t.deepEqual(
        db.exec('select importzipshp(?, ?, ?, ?) as count', [
            'shp.zip',
            'ne_110m_admin_0_countries',
            'shpzip',
            'CP1252',
        ]).get.objs,
        [{ count: 177 }],
    );

    db = (await SPL()).fs.mount(__dirname + '/files/shp/', 'somename').db();

    t.deepEqual(
        db.exec('select importzipshp(?, ?, ?, ?) as count', [
            'somename/shp.zip',
            'ne_110m_admin_0_countries',
            'shpzip',
            'CP1252',
        ]).get.objs,
        [{ count: 177 }],
    );
});

tape('virtual tables', async (t) => {
    t.plan(1);
    let db = (await SPL()).fs.mount(__dirname + '/files/shp/', 'shp').db();

    db.exec(
        "create virtual table countries using virtualshape('shp/ne_110m_admin_0_countries', CP1252, 4326)",
    );
    t.equals(db.exec('select count(*) from countries').get.first, 177);
});

tape('save and load from/to memory', async (t) => {
    t.plan(1);
    const s = await SPL();
    const name = 'save_and_load_from_to_memory.db';

    s.fs.mount(__dirname + '/files/tmp/')
        .db()
        .read(
            `
            create table test (col);
            insert into test values (1);
        `,
        )
        .save(name)
        .close();

    t.deepEqual(s.db().load(name).exec('select * from test').get.objs, [
        { col: 1 },
    ]);
});

tape('db from arraybuffer', async (t) => {
    t.plan(1);

    const buf = fs.readFileSync(__dirname + '/files/dbs/sqlite3.db').buffer;

    t.deepEqual(
        (await SPL()).db(buf).exec('select * from i_am_a_file_db_table').get
            .objs,
        [{ col: 1 }],
    );
});

tape('proj', async (t) => {
    t.plan(5);

    const db = (await SPL())
        .fs.mount(__dirname + '/../dist/proj', 'proj')
        .fs.mount(__dirname + '/files/shp', 'root')
        .db()
        .read('select InitSpatialMetaDataFull(1)');

    t.deepEqual(
        db.exec('select PROJ_SetDatabasePath(?) as path', ['/proj/proj.db']).get
            .objs,
        [{ path: '/proj/proj.db' }],
    );

    t.deepEqual(db.exec('select PROJ_GetDatabasePath() as path').get.objs, [
        { path: '/proj/proj.db' },
    ]);

    t.deepEqual(
        db.exec('select PROJ_GuessSridFromZipSHP(?, ?) as srid', [
            'shp.zip',
            'ne_110m_admin_0_countries',
        ]).get.objs,
        [{ srid: 4326 }],
    );

    t.deepEqual(
        db.exec(
            'select PROJ_AsProjString(NULL, a.srid) ProjString from (select PROJ_GuessSridFromZipSHP(?, ?) srid) a',
            ['shp.zip', 'ne_110m_admin_0_countries'],
        ).get.objs,
        [{ ProjString: '+proj=longlat +datum=WGS84 +no_defs +type=crs' }],
    );

    // test any EPSG code not available in proj_min.db
    t.deepEqual(
        db.exec('SELECT Transform(GeomFromText(?, 5243), 4326)', 'Point(10 10)')
            .get.first,
        { type: 'Point', coordinates: [10.500143, 51.00009] },
    );
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
        db.exec('select json(@js)', { '@js': { hello: 'json' } }).get.first,
        { hello: 'json' },
    );

    t.deepEqual(
        db.exec('select geomfromtext(?)', ['POINT(11.1 11.1)']).get.first,
        { type: 'Point', coordinates: [11, 11] },
    );

    db.close();

    // https://github.com/jvail/spl.js/issues/33
    db = (
        await SPL({
            autoGeoJSON: {
                precision: 15,
                options: 0,
            },
        })
    ).db();

    const [a, b] = JSON.parse(
        fs.readFileSync(__dirname + '/files/json/precision.json').toString(),
    );
    t.doesNotThrow(
        () =>
            db.exec(
                'SELECT CastToMulti(ST_Union(GeomFromGeoJSON(@a), GeomFromGeoJSON(@b)))',
                { '@a': a, '@b': b },
            ).get.first,
    );

    t.doesNotThrow(
        () =>
            db.exec(
                `SELECT CastToMulti(ST_Union(GeomFromGeoJSON('${JSON.stringify(a)}'), GeomFromGeoJSON('${JSON.stringify(b)}'))) as a`,
            ).get.first,
    );

    db.close();
});

// copied from src/sqlean/test/stats.sql
tape('extensions - stats', async (t) => {
    t.plan(7);

    const db = (await SPL()).db();

    t.true(
        db.exec(
            'select percentile(value, 25) = 25.5 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        db.exec(
            'select round(stddev(value), 1) = 28.7 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        db.exec(
            'select round(stddev_samp(value), 1) = 28.7 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        db.exec(
            'select round(stddev_pop(value), 1) = 28.6 from generate_series(1, 99)',
        ).get.first,
    );
    t.true(
        db.exec('select variance(value) = 825 from generate_series(1, 99)').get
            .first,
    );
    t.true(
        db.exec('select var_samp(value) = 825 from generate_series(1, 99)').get
            .first,
    );
    t.true(
        db.exec(
            'select round(var_pop(value), 0) = 817 from generate_series(1, 99)',
        ).get.first,
    );
});

tape('autoincrement: https://github.com/jvail/spl.js/issues/15', async (t) => {
    t.plan(1);

    const db = (await SPL()).db();
    const srid = 32636;
    const tableName = 'test';
    const script = `
        SELECT InitSpatialMetadata(1);
        --CREATE TABLE ${tableName} (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, field INTEGER, src_id TEXT);
        CREATE TABLE ${tableName} (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, field INTEGER, src_id TEXT);
        SELECT AddGeometryColumn('${tableName}', 'geometry', ${srid}, 'GEOMETRY', 'XY');
    `;
    db.read(script);
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
    db.exec(statement, parameters);

    t.equals(db.exec('select max(id) from test').get.first, batchSize);
});

tape('spl.version() method', async (t) => {
    t.plan(6);

    const spl = await SPL();
    const v = spl.version();

    t.equals(typeof v.spatialite, 'string');
    t.equals(typeof v.sqlite, 'string');
    t.equals(typeof v.geos, 'string');
    t.equals(typeof v.proj, 'string');
    t.equals(typeof v.rttopo, 'string');
    t.equals(typeof v.spl, 'string');
});

tape('attach and detach', async (t) => {
    t.plan(3);

    const spl = await SPL();
    spl.fs.mount(__dirname + '/files/tmp/');

    // Create a database file to attach
    const db1 = spl.db('attach_test.db');
    db1.exec('create table t1(x)');
    db1.exec('insert into t1 values(42)');
    db1.close();

    // Attach from another database
    const db2 = spl.db();
    db2.attach('attach_test.db', 'other');

    t.equals(db2.exec('select x from other.t1').get.first, 42);

    // Detach and verify it's gone
    db2.detach('other');
    t.throws(() => db2.exec('select x from other.t1'));

    // Re-attach works
    db2.attach('attach_test.db', 'other');
    t.equals(db2.exec('select x from other.t1').get.first, 42);

    db2.close();
});

tape('unmount', async (t) => {
    t.plan(2);

    const spl = await SPL();
    spl.fs.mount(__dirname + '/files/shp/', 'testmount');

    // Verify mount works
    const db = spl.db();
    t.doesNotThrow(() =>
        db.exec('select importzipshp(?, ?, ?, ?) as count', [
            'testmount/shp.zip',
            'ne_110m_admin_0_countries',
            'test_unmount',
            'CP1252',
        ]),
    );
    db.close();

    // Unmount
    t.doesNotThrow(() => spl.fs.unmount('testmount'));
});

tape('save to ArrayBuffer', async (t) => {
    t.plan(3);

    const spl = await SPL();
    const db = spl.db();
    db.exec('create table t(x)');
    db.exec('insert into t values(123)');

    const buf = db.save();

    t.true(buf instanceof ArrayBuffer);
    t.true(buf.byteLength > 0);

    // Verify the ArrayBuffer can be used to create a new database
    const db2 = spl.db(buf);
    t.equals(db2.exec('select x from t').get.first, 123);

    db.close();
    db2.close();
});

tape('error handling - double close', async (t) => {
    t.plan(1);

    const spl = await SPL();
    const db = spl.db();
    db.close();

    t.throws(() => db.close(), /Database closed/);
});

tape('error handling - exec on closed db', async (t) => {
    t.plan(1);

    const spl = await SPL();
    const db = spl.db();
    db.close();

    t.throws(() => db.exec('select 1'), /Database closed/);
});

tape('error handling - read on closed db', async (t) => {
    t.plan(1);

    const spl = await SPL();
    const db = spl.db();
    db.close();

    t.throws(() => db.read('select 1'), /Database closed/);
});

tape('error handling - invalid SQL', async (t) => {
    t.plan(2);

    const db = (await SPL()).db();

    t.throws(() => db.exec('not valid sql'));
    t.throws(() => db.exec('select from where'));

    db.close();
});

tape('error handling - load non-existent file', async (t) => {
    t.plan(1);

    const spl = await SPL();
    spl.fs.mount(__dirname + '/files/tmp/');
    const db = spl.db();

    t.throws(() => db.load('/nonexistent/path/to/database.db'));

    db.close();
});

tape('error handling - save/load on closed db', async (t) => {
    t.plan(2);

    const spl = await SPL();
    const db = spl.db();
    db.close();

    t.throws(() => db.save(), /Database closed/);
    t.throws(() => db.load('test.db'), /Database closed/);
});

tape('options - autoJSON disabled', async (t) => {
    t.plan(2);

    const db = (await SPL({ autoJSON: false })).db();

    // JSON should be returned as string, not parsed
    const res = db.exec("select json_object('a', 1) as j").get.first;
    t.equals(typeof res, 'string');
    t.equals(res, '{"a":1}');

    db.close();
});

tape('options - autoGeoJSON disabled', async (t) => {
    t.plan(2);

    const db = (await SPL({ autoGeoJSON: false })).db();

    // Geometry should be returned as ArrayBuffer, not GeoJSON
    const res = db.exec("select geomfromtext('POINT(1 2)')").get.first;
    t.true(res instanceof ArrayBuffer);
    t.true(res.byteLength > 0);

    db.close();
});

tape('options - both autoJSON and autoGeoJSON disabled', async (t) => {
    t.plan(2);

    const db = (await SPL({ autoJSON: false, autoGeoJSON: false })).db();

    const jsonRes = db.exec("select json_object('x', 1)").get.first;
    t.equals(typeof jsonRes, 'string');

    const geomRes = db.exec("select geomfromtext('POINT(0 0)')").get.first;
    t.true(geomRes instanceof ArrayBuffer);

    db.close();
});

tape('edge case - empty result set', async (t) => {
    t.plan(5);

    const db = (await SPL()).db();

    const res = db.exec('select 1 where 0').get;

    t.deepEquals(res.rows, []);
    t.deepEquals(res.flat, []);
    t.deepEquals(res.objs, []);
    t.equals(res.first, undefined);
    t.deepEquals(res.cols, ['1']);

    db.close();
});

tape('edge case - NULL values in results', async (t) => {
    t.plan(3);

    const db = (await SPL()).db();

    t.equals(db.exec('select null').get.first, null);
    t.deepEquals(db.exec('select null as a, 1 as b').get.objs, [
        { a: null, b: 1 },
    ]);
    t.deepEquals(db.exec('select null, null, null').get.flat, [
        null,
        null,
        null,
    ]);

    db.close();
});

tape('edge case - multiple databases from same spl instance', async (t) => {
    t.plan(3);

    const spl = await SPL();

    const db1 = spl.db();
    const db2 = spl.db();

    db1.exec('create table t1(x)');
    db1.exec('insert into t1 values(1)');

    // db2 should not see db1's table (separate in-memory databases)
    t.throws(() => db2.exec('select * from t1'));

    // Each db works independently
    db2.exec('create table t2(y)');
    db2.exec('insert into t2 values(2)');

    t.equals(db1.exec('select x from t1').get.first, 1);
    t.equals(db2.exec('select y from t2').get.first, 2);

    db1.close();
    db2.close();
});

tape('edge case - transactions', async (t) => {
    t.plan(3);

    const db = (await SPL()).db();

    // Basic transaction
    db.read(`
        BEGIN;
        CREATE TABLE t(x);
        INSERT INTO t VALUES(1);
        COMMIT;
    `);
    t.equals(db.exec('select x from t').get.first, 1);

    // Rollback
    db.read('BEGIN;');
    db.exec('insert into t values(2)');
    db.read('ROLLBACK;');
    t.equals(db.exec('select count(*) from t').get.first, 1);

    // Nested savepoints
    db.read(`
        BEGIN;
        INSERT INTO t VALUES(3);
        SAVEPOINT sp1;
        INSERT INTO t VALUES(4);
        ROLLBACK TO sp1;
        COMMIT;
    `);
    t.equals(db.exec('select count(*) from t').get.first, 2);

    db.close();
});

tape('edge case - result.free() clears data', async (t) => {
    t.plan(4);

    const db = (await SPL()).db();

    const res = db.exec('select 1, 2, 3').get;
    t.equals(res.flat.length, 3);
    t.equals(res.rows.length, 1);

    res.free();

    t.equals(res.flat.length, 0);
    t.equals(res.rows.length, 0);

    db.close();
});

tape('edge case - in-memory database basic operations', async (t) => {
    t.plan(4);

    const spl = await SPL();

    // Explicit :memory:
    const db1 = spl.db(':memory:');
    db1.exec('create table t(x)');
    db1.exec('insert into t values(1)');
    t.equals(db1.exec('select x from t').get.first, 1);
    db1.close();

    // Implicit in-memory (no argument)
    const db2 = spl.db();
    db2.exec('create table t(x)');
    db2.exec('insert into t values(2)');
    t.equals(db2.exec('select x from t').get.first, 2);
    db2.close();

    // Empty string should also work as in-memory
    const db3 = spl.db('');
    db3.exec('create table t(x)');
    t.equals(
        db3.exec('insert into t values(3)').exec('select x from t').get.first,
        3,
    );
    db3.close();

    // null should work as in-memory
    const db4 = spl.db(null);
    db4.exec('create table t(x)');
    t.equals(
        db4.exec('insert into t values(4)').exec('select x from t').get.first,
        4,
    );
    db4.close();
});

tape('topology - create and use topology', async (t) => {
    t.plan(5);

    const spl = await SPL();
    spl.fs.mount(__dirname + '/files/dbs/', 'data');

    const db = spl.db();
    db.exec('select initspatialmetadata(1)');
    db.attach('file:data/london.gpkg?immutable=1', 'london');

    // Get SRID from geopackage
    const srid = db.exec(
        'select srid(geom) from london.london_boroughs limit 1',
    ).get.first;
    t.equals(srid, 27700, 'SRID should be 27700');

    // Create table from geopackage data
    db.read(`
        create table london_boroughs_0 (name);
        select addgeometrycolumn('london_boroughs_0', 'geom', ${srid}, 'POLYGON');
        insert into london_boroughs_0 select name, geomfromgpb(geom) from london.london_boroughs;
    `);

    // Check that we have rows
    const count = db.exec('select count(*) from london_boroughs_0').get.first;
    t.true(count > 0, 'Table should have rows');

    // Create topology
    db.exec('select createtopology(?, ?, ?, ?)', ['topo', srid, 0, 0]);

    // Check topology was created
    const topoExists = db.exec(
        "select count(*) from sqlite_master where type='table' and name='topo_node'",
    ).get.first;
    t.equals(topoExists, 1, 'Topology tables should exist');

    // Build topology from geometry table
    db.exec('select topogeo_fromgeotable(?, ?, ?, ?)', [
        'topo',
        null,
        'london_boroughs_0',
        null,
    ]);

    // Check that faces were created
    const faces = db.exec('select count(*) from topo_face').get.first;
    t.true(faces > 0, 'Topology should have faces');

    // Test generalization
    db.exec('select topogeo_togeotablegeneralize(?, ?, ?, ?, ?, ?)', [
        'topo',
        null,
        'london_boroughs_0',
        'geom',
        'london_boroughs_100',
        100,
    ]);

    const genCount = db.exec(
        'select count(*) from london_boroughs_100 where geom is not null',
    ).get.first;
    t.true(genCount > 0, 'Generalized table should have geometries');

    db.close();
});

const tape = require('tape');
const spatial = require('../dist/spl');
const fs = require('fs');
const path = require('path');

const keep = ['.gitkeep', '.gitignore'];
fs.readdir(path.join(__dirname, 'files/tmp'), (err, files) => {
    if (err) throw err;
    for (const file of files) {
        if (keep.indexOf(file) < 0) {
            fs.unlink(path.join(__dirname, 'files/tmp', file), err => {
                if (err) throw err;
            });
        }
    }
});

// tape (node:8860) MaxListenersExceededWarning:
require('events').EventEmitter.defaultMaxListeners = 100;

tape('version tests', t => {

    t.plan(5);
    const spl = spatial();

    const db = spl.db();

    t.equal(
        db.exec("select sqlite_version()").get.first,
        '3.36.0'
    );
    t.equal(
        db.exec("select spatialite_version()").get.first,
        '5.0.1'
    );
    t.equal(
        db.exec("select geos_version()").get.first,
        '3.9.0-CAPI-1.16.2'
    );
    t.equal(
        db.exec("select proj_version()").get.first,
        'Rel. 8.1.0, July 1st, 2021'
    );
    t.equal(
        db.exec("select rttopo_version()").get.first,
        '1.1.0'
    );

    db.close();

});

tape('feature tests', t => {

    t.plan(1);

    const db = spatial().db();

    t.deepEqual(db.exec(`select
        HasIconv(),
        HasMathSQL(),
        HasGeoCallbacks(),
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
        HasRouting()`
    ).get.objs[0], {
        'HasIconv()': 1,
        'HasMathSQL()': 1,
        'HasGeoCallbacks()': 1,
        'HasProj()': 1,
        'HasProj6()': 0, // TODO: reports 0 but should be 1 -> fix in spatialite source?
        'HasGeos()': 1,
        'HasGeosAdvanced()': 1,
        'HasGeosTrunk()': 0,
        'HasGeosReentrant()': 1,
        'HasGeosOnlyReentrant()': 1,
        'HasMinZip()': 1,
        'HasRtTopo()': 1,
        'HasLibXML2()': 0,
        'HasEpsg()': 1,
        'HasFreeXL()': 0,
        'HasGeoPackage()': 1,
        'HasGCP()': 1,
        'HasTopology()': 1,
        'HasKNN()': 1,
        'HasRouting()': 1
    });

    db.close();

});

tape('function chaining tests', t => {

    const spl = spatial();
    const db = spl.db();

    t.plan(4);

    t.equals(
        db.read('select 1'),
        db
    );
    t.equals(
        db.exec('select 1'),
        db
    );
    t.equals(
        db.exec('select 1').get.free(),
        undefined
    );
    t.equals(
        db.close(),
        spl
    );

});

tape('format tests', t => {

    t.plan(5);

    const db = spatial().db();

    t.deepEqual(
        db.exec("select * from (values(1,2,3), (4,5,6))").get.rows,
        [[1, 2, 3], [4, 5, 6]]
    );
    t.deepEqual(
        db.exec("select * from (values(1,2,3), (4,5,6))").get.flat,
        [1, 2, 3, 4, 5, 6]
    );
    t.deepEqual(
        db.exec("select 1 as first").get.objs,
        [{ first: 1 }]
    );
    t.deepEqual(
        db.exec("select 1 as first, 2 second").get.cols,
        ['first', 'second']
    );
    t.deepEqual(
        db.exec("select * from (values(1,2,3), (4,5,6))").get.first,
        [1, 2, 3]
    );

    db.close();

});

tape('parameter tests', t => {

    t.plan(10);

    const db = spatial().db();

    t.deepEqual(
        db.exec("select ?1 a, ?1 b", [1]).get.objs,
        [{ 'a': 1, 'b': 1 }]
    );

    t.deepEqual(
        db.exec("select ? a, ? b", [1, 2]).get.objs,
        [{ 'a': 1, 'b': 2 }]
    );
    t.deepEqual(
        db.exec("select ? a", [1, 2]).get.objs,
        [{ 'a': 1 }, { 'a': 2 }]
    );
    t.deepEqual(
        db.exec("select @a", { '@a': 1 }).get.objs,
        [{ '@a': 1 }]
    );
    t.deepEqual(
        db.exec("select @a, @a, @b", { '@a': 'text' }).get.objs,
        [{ '@a': 'text', '@a1': 'text', '@b': null }]
    );
    t.deepEqual(
        db.exec("select :a", { ':a': 1 }).get.objs,
        [{ ':a': 1 }]
    );
    t.deepEqual(
        db.exec("select $a", { $a: 1 }).get.objs,
        [{ $a: 1 }]
    );
    t.deepEqual(
        db.exec("select ? as a, ? as b, ? as c, ? as d, ? as e", [1, null, false, 'text', new Uint8Array([0,1]).buffer]).get.objs,
        [{ a: 1, b: null, c: 0, d: 'text', e: new Uint8Array([0]).buffer }]
    );
    t.deepEqual(
        db.exec("select @a a, @b b", [
            { '@a': 1.0, '@b': 1.1 },
            { '@a': 2.0, '@b': 2.1 },
            { '@a': 3.0, '@b': 3.1 }
        ]).get.objs,
        [
            { a: 1.0, b: 1.1 },
            { a: 2.0, b: 2.1 },
            { a: 3.0, b: 3.1 }
        ]
    );
    t.equals(
        db.exec("select * from (values ('a'), ('b')) where column1 = ?", ['a']).get.first,
        'a'
    );

    db.close();

});

tape('type tests', t => {

    t.plan(4);

    const db = spatial().db();

    t.deepEqual(
        db.exec("select 1, 1.1").get.first,
        [1, 1.1]
    );
    t.deepEqual(
        db.exec("select true, false").get.first,
        [1, 0]
    );
    t.deepEqual(
        db.exec("select 'ABC', 'abc', 'äüÖß', '☀', '☎'").get.first,
        ['ABC', 'abc', 'äüÖß', '☀', '☎']
    );
    t.deepEqual(
        Array.from(new Uint8Array(db.exec("select ?", [new Uint8Array([1,2,3]).buffer]).get.first)),
        [1, 2, 3]
    );

    db.close();

});

tape('strict quoting tests', t => {

    t.plan(2);

    const db = spatial().db();

    t.throws(() => db.exec("select \"quoted\""));
    t.doesNotThrow(() => db.exec("select 'quoted'"));

    db.close();

});

tape('shapefiles', t => {

    t.plan(2);

    const db = spatial().mount(__dirname).db();

    t.deepEqual(
        db.exec('select importzipshp(?, ?, ?, ?) as count', [
            'files/shp/shp.zip', 'ne_110m_admin_0_countries', 'shpzip', 'CP1252'
        ]).get.objs,
        [{ count: 177}]
    );

    t.deepEqual(
        db.exec('select importshp(?, ?, ?) as count', [
            'files/shp/ne_110m_admin_0_countries', 'shp', 'CP1252'
        ]).get.objs,
        [{ count: 177}]
    );

});

tape('memory and local dbs', t => {

    t.plan(2);

    const s = spatial().mount(__dirname);
    let db = s.db('files/tmp/memory_and_local_dbs_1.db');
    db.exec('create table test(col)');
    db.exec('insert into test values(1)');
    db.close();
    db = s.db('files/tmp/memory_and_local_dbs_1.db');

    t.deepEqual(
        db.exec('select * from test').get.objs,
        [{ col: 1 }]
    );
    db.close();

    t.throws(() => s.db().export());

});

tape('execute sql scripts', t => {

    t.plan(2);

    const db = spatial().db();

    t.deepEqual(
        db.read(`
            create table test (col);
            insert into test values (1);
            insert into test values (2);
        `).exec('select * from test').get.objs,
        [{ col: 1 }, { col: 2 }]
    );

    t.throws(() => db.read('this is not sql'));

});


tape('mounting', t => {

    t.plan(2);
    let db;

    db = spatial().mount(__dirname + '/files/shp/').db();

    t.deepEqual(
        db.exec('select importzipshp(?, ?, ?, ?) as count', [
            'shp.zip', 'ne_110m_admin_0_countries', 'shpzip', 'CP1252'
        ]).get.objs,
        [{ count: 177 }]
    );

    db = spatial().mount(__dirname + '/files/shp/', 'somename').db();

    t.deepEqual(
        db.exec('select importzipshp(?, ?, ?, ?) as count', [
            'somename/shp.zip', 'ne_110m_admin_0_countries', 'shpzip', 'CP1252'
        ]).get.objs,
        [{ count: 177 }]
    );

});

tape('virtual tables', t => {

    t.plan(2);
    let db = spatial()
        .mount(__dirname + '/files/shp/', 'shp')
        .mount(__dirname + '/files/csv/', 'csv')
        .db();

    db.exec("create virtual table countries using virtualshape('shp/ne_110m_admin_0_countries', CP1252, 4326)");

    db.exec("create virtual table places using virtualtext('csv/testcase1.csv', UTF-8, 0, POINT, DOUBLEQUOTE)");

    t.equals(db.exec('select count(*) from countries').get.first, 177);
    t.deepEquals(
        db.exec("select col003 from places WHERE col003 = 'Canal Creek'").get.objs,
        [ { COL003: 'Canal Creek' }, { COL003: 'Canal Creek' } ]
    );

});

tape('save and load from/to memory', t => {

    t.plan(1);
    const s = spatial();
    const name = 'save_and_load_from_to_memory.db'

    s.mount(__dirname + '/files/tmp/')
        .db().read(`
            create table test (col);
            insert into test values (1);
        `).save(name).close();

    t.deepEqual(
        s.db().load(name).exec('select * from test').get.objs,
        [{ col: 1 }]
    );

});

tape('db from arraybuffer', t => {


    t.plan(1);

    const buf = fs.readFileSync(__dirname + '/files/dbs/sqlite3.db').buffer;

    t.deepEqual(
        spatial().db(buf).exec('select * from i_am_a_file_db_table').get.objs,
        [{ col: 1 }]
    );

});

tape('proj', t => {

    t.plan(4);

    const db = spatial()
            .mount(__dirname + '/../dist/proj', 'proj')
            .mount(__dirname + '/files/shp', 'root')
            .db().read('select InitSpatialMetaDataFull(1)');

    t.deepEqual(
        db.exec('select PROJ_SetDatabasePath(?) as path', ['/proj/proj.db']).get.objs,
        [{ path: '/proj/proj.db' }]
    );

    t.deepEqual(
        db.exec('select PROJ_GetDatabasePath() as path').get.objs,
        [{ path: '/proj/proj.db' }]
    );

    t.deepEqual(
        db.exec('select PROJ_GuessSridFromZipSHP(?, ?) as srid', [
            'shp.zip', 'ne_110m_admin_0_countries'
        ]).get.objs,
        [{ srid: 4326 }]
    );

    t.deepEqual(
        db.exec('select PROJ_AsProjString(NULL, a.srid) ProjString from (select PROJ_GuessSridFromZipSHP(?, ?) srid) a', [
            'shp.zip', 'ne_110m_admin_0_countries'
        ]).get.objs,
        [{ ProjString: '+proj=longlat +datum=WGS84 +no_defs +type=crs' }]
    );

});


tape('json', t => {

    t.plan(2);

    const db = spatial({
        autoGeoJSON: {
            precision: 0,
            options: 0
        }
    }).db()

    t.deepEqual(
        db.exec('select json(@js)', { '@js': { hello: 'json' }}).get.first,
        { hello: 'json' }
    );

    t.deepEqual(
        db.exec('select geomfromtext(?)', [ 'POINT(11.1 11.1)' ]).get.first,
        { type: 'Point', 'coordinates': [11, 11] }
    )

});


// copied from src/sqlean/test/stats.sql
tape('extensions - stats', t => {

    t.plan(7);

    const db = spatial().db()

    t.true(db.exec('select percentile(value, 25) = 25.5 from generate_series(1, 99)').get.first);
    t.true(db.exec('select round(stddev(value), 1) = 28.7 from generate_series(1, 99)').get.first);
    t.true(db.exec('select round(stddev_samp(value), 1) = 28.7 from generate_series(1, 99)').get.first);
    t.true(db.exec('select round(stddev_pop(value), 1) = 28.6 from generate_series(1, 99)').get.first);
    t.true(db.exec('select variance(value) = 825 from generate_series(1, 99)').get.first);
    t.true(db.exec('select var_samp(value) = 825 from generate_series(1, 99)').get.first);
    t.true(db.exec('select round(var_pop(value), 0) = 817 from generate_series(1, 99)').get.first);

});

const tape = require('tape');
const SPL = require('../dist/index').default;


tape('version tests', async t => {

    const spl = await SPL();
    const db = await spl.db();

    t.plan(5);

    t.deepEqual(
        await db.exec("select sqlite_version()").get.objs,
        [{ 'sqlite_version()': '3.39.4' }]
    );
    t.deepEqual(
        await db.exec("select spatialite_version()").get.objs,
        [{ 'spatialite_version()': '5.0.1' }]
    );
    t.deepEqual(
        await db.exec("select geos_version()").get.objs,
        [{ 'geos_version()': '3.9.0-CAPI-1.16.2' }]
    );
    t.deepEqual(
        await db.exec("select proj_version()").get.objs,
        [{ 'proj_version()': 'Rel. 9.1.0, September 1st, 2022' }]
    );
    t.deepEqual(
        await db.exec("select rttopo_version()").get.objs,
        [{ 'rttopo_version()': '1.1.0' }]
    );

});

tape('feature tests', async t => {

    t.plan(1);

    const spl = await SPL();
    const db = await spl.db();

    t.deepEqual(await db.exec(`select
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
    ).get.objs, [ {
        'HasIconv()': 1,
        'HasMathSQL()': 1,
        'HasGeoCallbacks()': 1,
        'HasProj()': 1,
        'HasProj6()': 0, // TODO: reports 0 but should be 1?
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
    }]);

});

tape('function chaining tests', async t => {

    const spl = await SPL();
    const db = await spl.db();

    t.plan(4);

    t.equals(
        await db.read('select 1'),
        db
    );
    t.equals(
        await db.exec('select 1'),
        db
    );
    t.equals(
        await db.exec('select 1').get.free(),
        undefined
    );
    t.equals(
        await db.close(),
        spl
    );

});

tape('mounting', async t => {

    const file = 'files/dbs/sqlite3.db';
    const sqlite = await fetch(file).then(res => res.arrayBuffer());
    const spl = await SPL();

    t.plan(2);

    t.equals(
        await spl.mount('a', [
            { name: 'sqlite', data: sqlite }
        ]).db().attach('file:a/sqlite', 'test').exec('select name from test.sqlite_master').get.first,
        'i_am_a_file_db_table'
    );

    t.equals(
        await spl.mount('b', [
            { name: 'sqlite', data: new URL(file, window.location.href).toString() }
        ]).db().attach('file:b/sqlite?immutable=1', 'test').exec('select name from test.sqlite_master').get.first,
        'i_am_a_file_db_table'
    );

});


// copied from src/sqlean/test/stats.sql
tape('extensions - stats', async t => {

    t.plan(7);

    const spl = await SPL();
    const db = await spl.db();

    t.true(await db.exec('select percentile(value, 25) = 25.5 from generate_series(1, 99)').get.first);
    t.true(await db.exec('select round(stddev(value), 1) = 28.7 from generate_series(1, 99)').get.first);
    t.true(await db.exec('select round(stddev_samp(value), 1) = 28.7 from generate_series(1, 99)').get.first);
    t.true(await db.exec('select round(stddev_pop(value), 1) = 28.6 from generate_series(1, 99)').get.first);
    t.true(await db.exec('select variance(value) = 825 from generate_series(1, 99)').get.first);
    t.true(await db.exec('select var_samp(value) = 825 from generate_series(1, 99)').get.first);
    t.true(await db.exec('select round(var_pop(value), 0) = 817 from generate_series(1, 99)').get.first);

});


tape('sql worker error handling', async t => {

    t.plan(3);

    const db = await SPL().then(spl => spl.db());

    t.equals(
        await db.exec('select a').get.first
            .then(() => false)
            .catch(() => true),
        true
    );

    t.equals(
        await db.exec('select a').get.first
            .then(() => false, () => true)
            .catch(() => false),
        true
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
        true
    );

});

tape('large inserts', async t => {

    t.plan(2);

    const db = await SPL().then(spl => spl.db());
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
    const values = []

    for (let i = 0; i < ii; ++i) {
        script += `\nINSERT INTO large (geometry) VALUES (SetSRID(GeomFromGeoJSON('${geom}'), 4326));`;
        values.push(geom)
    }

    await db.read(script);
    t.equals(await db.exec('SELECT count(*) FROM large').get.first, ii);

    await db.exec(`INSERT OR REPLACE INTO large (geometry) VALUES (SetSRID(GeomFromGeoJSON(?), 4326))`, values)
    t.equals(await db.exec('SELECT count(*) FROM large').get.first, 2 * ii);

});

tape('proj embeded', async t => {

    t.plan(2);

    const db = await SPL().then(spl => spl.db());

    await db.exec('SELECT InitSpatialMetaDataFull(1)');

    t.deepEqual(
        await db.exec('SELECT Transform(GeomFromText(?, 4326), 3857)', 'Point(10 10)').get.first,
        { type: 'Point', coordinates: [ 1113194.907933, 1118889.974858 ] }
    );

    t.deepEqual(
        await db.exec('SELECT Transform(GeomFromText(?, 4326), 32601)', 'Point(10 10)').get.first,
        { type: 'Point', coordinates: [ -268980.132218, 18882329.956321 ] }
    );

});

// TODO: firefox: Dynamic module import is disabled or not supported in this context
tape('extensions', async t => {

    const extensions = [
        {
            extends: 'db',
            fns: {
                'tables': db => db.exec('select name from sqlite_master where type=\'table\''),
                'master': (db, type) => db.exec('select name from sqlite_master where type=?', [type]),
                'async_fn': (_, delay) => {
                    return new Promise(resolve => setTimeout(resolve(delay), delay));
                }
            }
        },
        {
            extends: 'spl',
            fns: {
                'spatialite_version': spl => {
                    const db = spl.db();
                    const version = db.exec('select spatialite_version()').get.first;
                    db.close();
                    return version;
                }
            }
        }
    ];

    const spl = await SPL(extensions);

    const db = spl.db()
        .read(`
            create table hello (world);
            create view hello_view as select * from hello;
        `);

    t.plan(4);

    t.equals(
        await db.tables().get.first,
        'hello'
    );
    t.equals(
        await db.master('view').get.first,
        'hello_view'
    );
    t.equals(
        await spl.spatialite_version(),
        '5.0.1'
    );
    t.equals(
        await db.async_fn(10),
        10
    );

});

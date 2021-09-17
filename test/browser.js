const tape = require('tape');
const SPL = require('../dist/index').default;


tape('version tests', async t => {

    const spl = await SPL();
    const db = await spl.db();

    t.plan(5);

    t.deepEqual(
        await db.exec("select sqlite_version()").get.objs,
        [{ 'sqlite_version()': '3.36.0' }]
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
        [{ 'proj_version()': 'Rel. 8.1.0, July 1st, 2021' }]
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

// TODO: firefox: Dynamic module import is disabled or not supported in this context
tape('extensions', async t => {

    const extensions = [
        {
            extends: 'db',
            fns: {
                'tables': db => db.exec('select name from sqlite_master where type=\'table\''),
                'master': (db, type) => db.exec('select name from sqlite_master where type=?', [type])
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

    t.plan(3);

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

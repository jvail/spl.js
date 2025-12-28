import SPL from '../dist/index.js';

document.querySelector('#slider').valueToValueIndicatorTransform = (v) =>
    v + 'm';

const container = document.querySelector('#svg-container');
let mbr;

const spl = await SPL();

const db = await spl
    .fs.mount('data', [
        {
            name: 'london_boroughs',
            data: new URL(
                '../test/files/dbs/london.gpkg',
                window.location.href,
            ).toString(),
        },
    ])
    .db()
    .exec('select initspatialmetadata(1)')
    .attach('file:data/london_boroughs?immutable=1', 'london');

const srid = await db.exec(
    'select srid(geom) from london.london_boroughs limit 1',
).get.first;

await db.read(`
    create table london_boroughs_0 (name);
    select addgeometrycolumn('london_boroughs_0', 'geom', ${srid}, 'POLYGON');
    insert into london_boroughs_0 select name, geomfromgpb(geom) from london.london_boroughs;
`);

mbr = await db.exec(`
    select json_array(mbrminx(geom), mbrmaxx(geom), mbrminy(geom), mbrmaxy(geom))
    from (select extent(geom) geom from london_boroughs_0)
`).get.first;

const svg = (table) => {
    db.exec(
        `select assvg(geom, 0, 1) path from ${table} where geom not null`,
    ).get.objs.then((res) => {
        const svgEl = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
        );
        svgEl.setAttribute('height', '800px');
        svgEl.setAttribute(
            'viewBox',
            `${mbr[0]} ${-mbr[3]} ${mbr[1] - mbr[0]} ${mbr[3] - mbr[2]}`,
        );
        res.forEach((row) => {
            const pathEl = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path',
            );
            pathEl.setAttribute('d', row.path);
            pathEl.setAttribute('fill', 'whitesmoke');
            pathEl.setAttribute('stroke', '#6200ee');
            pathEl.setAttribute('stroke-width', 100);
            svgEl.appendChild(pathEl);
        });
        container.innerHTML = '';
        container.appendChild(svgEl);
    });
};

svg('london_boroughs_0');

document.querySelector('mwc-slider').addEventListener('input', (evt) => {
    const m = evt.target.value;
    db.exec(
        `select count() from sqlite_master where type='table' and name='london_boroughs_${m}'`,
    ).get.first.then((exists) => {
        if (!exists) {
            db.exec('select topogeo_togeotablegeneralize(?, ?, ?, ?, ?, ?)', [
                'topo',
                null,
                'london_boroughs_0',
                'geom',
                'london_boroughs_' + m,
                m,
            ]).then(() => svg('london_boroughs_' + m));
        } else {
            svg('london_boroughs_' + m);
        }
    });
});

db.exec('select createtopology(?, ?, ?, ?)', ['topo', srid, 0, 0])
    .exec('select topogeo_fromgeotable(?, ?, ?, ?)', [
        'topo',
        null,
        'london_boroughs_0',
        null,
    ])
    .then(() => document.querySelector('#progress').remove());

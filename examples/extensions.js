import { d3, geoAitoff, topojson } from './lib/lib.js';
import SPL from '../dist/index.js';

/** @type {import('../dist/index.js').DbExtension} */
const extension = {
    extends: 'db',
    fns: {
        toTopoJSON: async (db, table, column = 'geometry') => {
            if (typeof topojson === 'undefined') {
                await import('https://unpkg.com/topojson-server@3');
            }
            return topojson.topology(
                db.exec(`SELECT ${column} FROM ${table}`).get.flat,
            );
        },
    },
};

const spl = await SPL({}, [extension]);
const db = await spl
    .fs.mount('data', [
        {
            name: 'world.geojson',
            data: await fetch('data/world.json').then((res) =>
                res.arrayBuffer(),
            ),
        },
    ])
    .db().read(`
        SELECT InitSpatialMetaDataFull(1);
        SELECT ImportGeoJSON('/data/world.geojson', 'world');
    `);

const context = d3.select('canvas').node().getContext('2d');
const path = d3.geoPath().projection(geoAitoff()).context(context);

db.ex.toTopoJSON('world').then((topology) => {
    context.beginPath();
    document.querySelector('#progress').remove();
    path(topojson.mesh(topology));
    context.stroke();
});

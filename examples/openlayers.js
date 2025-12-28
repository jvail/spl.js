import { ol } from './lib/lib.js';
import SPL from '../dist/index.js';

const map = new ol.Map({
    layers: [
        new ol.TileLayer({
            source: new ol.OSM(),
        }),
    ],
    target: 'map',
    view: new ol.View({
        center: [0, 0],
        zoom: 2,
    }),
});

const spl = await SPL();

const db = await spl
    .fs.mount('proj', [
        // Mounts proj.db required for transformation of EPSG 27700 to 3857.
        // Instead of downloading the entire db spl/sqlite will only fetch required db pages.
        {
            name: 'proj.db',
            data: new URL(
                '../dist/proj/proj.db',
                window.location.href,
            ).toString(),
        },
    ])
    .fs.mount('data', [
        {
            name: 'london_boroughs.gpkg',
            data: new URL(
                '../test/files/dbs/london.gpkg',
                window.location.href,
            ).toString(),
        },
    ])
    .db()
    .load('file:data/london_boroughs.gpkg?immutable=1').read(`
        select enablegpkgmode();
        select initspatialmetadata(1);
        select PROJ_SetDatabasePath('/proj/proj.db'); -- set proj.db path
    `);

// geoms are already GeoJSON objects. No need for AsGeoJSON().
const geoms = await db.exec('select transform(geom, 3857) from london_boroughs')
    .get.flat;

document.querySelector('#progress').remove();

const collection = {
    type: 'FeatureCollection',
    features: geoms.map((geometry) => ({
        type: 'Feature',
        geometry,
    })),
};

const source = new ol.Vector({
    features: new ol.GeoJSON().readFeatures(collection),
});

map.addLayer(new ol.VectorLayer({ source }));
map.getView().fit(source.getExtent());

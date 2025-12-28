import { ol, debounce } from './lib/lib.js';
import SPL from '../dist/index.js';

document.querySelector('#sliderleft').valueToValueIndicatorTransform = (v) =>
    v + 'm';

const map = new ol.Map({
    layers: [
        new ol.TileLayer({
            source: new ol.OSM(),
        }),
    ],
    target: 'mapleft',
    view: new ol.View({
        projection: 'EPSG:3857',
    }),
});

const spl = await SPL();

const lights = await fetch('./data/lights.zip').then((response) =>
    response.blob(),
);

const db = await spl
    .fs.mount('data', [{ name: 'lights.zip', data: lights }])
    .db()
    .exec('SELECT InitSpatialMetaData(1)')
    .exec('SELECT ImportZipSHP(?, ?, ?, ?, ?)', [
        '/data/lights.zip',
        'lights',
        'lights',
        'UTF-8',
        4326,
    ]);

const extent = await db.exec(`
    SELECT json_array(MbrMinX(extent), MbrMinY(extent), MbrMaxX(extent), MbrMaxY(extent))
    FROM (SELECT Transform(Extent(geometry), 3857)  extent FROM lights)
`).get.first;

map.getView().fit(extent);

let layer;
const [minx, miny, maxx, maxy] = extent;
let lon = minx + (maxx - minx) / 2;
let lat = miny + (maxy - miny) / 2;
let bufferWidth = 200;

const style = new ol.Style({
    image: new ol.Circle({
        radius: 6,
        fill: new ol.Fill({
            color: [255, 239, 0],
        }),
    }),
    zIndex: Infinity,
});

const lightsOn = (lon, lat) => {
    db.exec(
        `
        SELECT Collect(geometry) FROM lights
        WHERE Within(
            geometry,
            Transform(Buffer(MakePoint(${lon}, ${lat}, 3857), ${bufferWidth}, 8), 4326)
        ) AND geometry IS NOT NULL
    `,
    )
        .get.flat.then((geoms) => {
            const collection = {
                type: 'FeatureCollection',
                features: geoms.map((geometry) => ({
                    type: 'Feature',
                    geometry,
                })),
            };
            const source = new ol.Vector({
                features: new ol.GeoJSON({
                    featureProjection: 'EPSG:3857',
                }).readFeatures(collection),
            });
            map.removeLayer(layer);
            layer = new ol.VectorLayer({ source, style });
            map.addLayer(layer);
        })
        .catch((err) => console.log(err));
};

const marker = new ol.Feature(new ol.Point([lon, lat]));
const markerMove = new ol.Translate({
    features: new ol.Collection([marker]),
});

markerMove.on(
    'translating',
    debounce((evt) => lightsOn(...evt.coordinate), 100, {
        maxWait: 10,
        leading: true,
        trailing: true,
    }),
);
markerMove.on('translateend', (evt) => lightsOn(...evt.coordinate));

map.addInteraction(markerMove);
map.addLayer(
    new ol.VectorLayer({
        zIndex: Infinity,
        source: new ol.Vector({
            features: [marker],
        }),
        style: [
            new ol.Style({
                image: new ol.Icon({
                    scale: 0.7,
                    anchor: [0.5, 1],
                    src: '//raw.githubusercontent.com/jonataswalker/map-utils/master/images/marker.png',
                }),
            }),
        ],
    }),
);

document.querySelector('#sliderleft').addEventListener('input', (evt) => {
    bufferWidth = evt.target.value;
    lightsOn(...marker.getGeometry().flatCoordinates);
});

lightsOn(...marker.getGeometry().flatCoordinates);

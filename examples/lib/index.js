import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import Vector from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import WKB from 'ol/format/WKB';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import Collection from 'ol/Collection';
import Translate from 'ol/interaction/Translate';
import { CircularProgress } from '@material/mwc-circular-progress';
import { Slider } from '@material/mwc-slider';
import * as d3 from 'd3';
import { geoAitoff } from 'd3-geo-projection';
import * as topojson from 'topojson-client';
import debounce from 'lodash-es/debounce';

const ol = {
    Map, View, TileLayer, VectorLayer, OSM, Vector,
    GeoJSON, WKB,
    Point, Feature, Collection,
    Translate,
    Style, Circle, Fill, Icon
};

export {
    ol,
    d3, geoAitoff,
    topojson,
    debounce,
    CircularProgress, Slider
}

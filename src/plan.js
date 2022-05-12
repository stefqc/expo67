import 'ol/ol.css';
import './plan.css';
import {Map, View} from 'ol';
import {Tile as TileLayer} from 'ol/layer';
import {XYZ} from 'ol/source';
import {FullScreen, defaults as defaultControls} from 'ol/control'
import {defaults as defaultInteractions} from 'ol/interaction';
import addPavilionLayer from './pavilionLayer';
import OpacitySlider from './OpacitySlider';
import YouAreHere from './YouAreHere';

const planBounds = [-8187430,5698391,-8184280, 5705700]
const planCenter = [-8185855, 5702045];

// Le plan est conçu pour être consulté ouest vers le haut
const westTop = 2 * Math.PI / 4;

const controls = defaultControls({
  attribution: false,
  rotate: false,
  zoomOptions: {
    className: 'zoom',
    zoomInTipLabel: 'Zoom avant',
    zoomOutTipLabel: 'Zoom arrière'
  }
}).extend([
  new FullScreen({tipLabel: 'Plein écran'}),
]);

const interactions = defaultInteractions({
  altShiftDragRotate: false,
  pinchRotate: false
});

var map = new Map({
  target: 'map',
  controls: controls,
  interactions: interactions,
  view: new View({
    center: planCenter,
    rotation: westTop,
    zoom: 16,
    minZoom: 14,
    maxZoom:18
  }),

  // Requis pour que les raccourcis clavier fonctionnent
  keyboardEventTarget: document
});


map.addLayer(new TileLayer({
  source: new XYZ({
     url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    //url: 'tuiles/satellite/{z}/{y}_{x}.jpg'
  }),
  //extent: planBounds
}));

const expo67Layer = new TileLayer({
  source: new XYZ({
    tileUrlFunction: tileUrl
  }),
  extent: planBounds 
});

map.addLayer(expo67Layer);
addPavilionLayer(map);

map.addControl(new OpacitySlider({
  className: 'opacity-slider',
  layer:expo67Layer, 
  leftLabel: '1967', 
  rightLabel: '2022'
}));

map.addControl(new YouAreHere({extent:planBounds}));

function tileUrl(tileCoord, pixelRatio, projection){

  const z = tileCoord[0];
  const x = tileCoord[1];
  const y = tileCoord[2];

  if (z == 18) {
    if ((x<77515 || x>77523 || y<93774 || y>93796) &&
      (x<77522 || x>77529 || y<93749 || y>93776) &&
      (x<77528 || x>77535 || y<93762 || y>93786)) {
      return 'tuiles/transparent.gif'
    }
  }
  
  return 'tuiles/plan/' + z + '/' + y + '_' + x + '.gif';
}

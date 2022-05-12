import pavilionsJson from './pavillons.geojson?url'
import GeoJSON from 'ol/format/GeoJSON';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {Fill, Stroke, Style, Text,} from 'ol/style';
import Control from 'ol/control/Control';
import {CLASS_CONTROL, CLASS_HIDDEN, CLASS_UNSELECTABLE} from 'ol/css.js';
import EventType from 'ol/events/EventType';


const pavilionLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: pavilionsJson
  }),
  opacity: 0,
  style: displayPavilionsName
});


function addPavilionLayer(map) {
  map.addLayer(pavilionLayer);
  map.addControl(new Labels());
  map.on('dblclick', function(evt) {
    displayFeatureInfo(map, evt.pixel);
    evt.preventDefault();
  });

}

function displayPavilionsName(feature, resolution) {

  const CITE_DU_HAVRE = 2;
  const ILE_SAINTE_HELENE = 3;
  const ILE_NOTRE_DAME = 4;
  const LA_RONDE = 5;

  let color = Math.floor(feature.get('id') / 100);
  switch (color) {
    case CITE_DU_HAVRE:
      color = 'plum';
      break;
    case ILE_SAINTE_HELENE:
      color = 'lightgreen';
      break;
    case ILE_NOTRE_DAME:
      color = 'yellow'
      break;
    case LA_RONDE:
      color = 'orange';
      break;
    default:
      color = 'white';
  }

  return new Style({
    text: new Text({
      font: '16px sans-serif',
      fill: new Fill({color: 'black'}),
      stroke: new Stroke({color: color, width: 10}),
      text: stringDivider(feature.get('nom'), 12, '\n'),
      overflow: true
    })
  })
}

// http://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function stringDivider(str, width, spaceReplacer) {
  if (str.length > width) {
    var p = width;
    while (p > 0 && str[p] != ' ' && str[p] != '-') {
      p--;
    }
    if (p > 0) {
      var left;
      if (str.substring(p, p + 1) == '-') {
        left = str.substring(0, p + 1);
      } else {
        left = str.substring(0, p);
      }
      var right = str.substring(p + 1);
      return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
    }
  }
  return str;
}


function  displayFeatureInfo(map, pixel) {
  const features = map.getFeaturesAtPixel(pixel);
  const feature = features.length ? features[0] : undefined;
  if (features.length) {
    alert(feature.get('nom'));
  } 
}

class Labels extends Control {

  constructor() {
    super({
      element: document.createElement('div')
    });

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.title = 'Afficher le nom\ndes pavillons';

    button.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this),
      false
    );

    this.element.className = 'labels-control ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    this.element.appendChild(button);

  }

  handleClick_(event) {
    pavilionLayer.getOpacity() ? pavilionLayer.setOpacity(0) : pavilionLayer.setOpacity(1);
  }
}


export default addPavilionLayer;

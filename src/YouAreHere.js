import Geolocation from 'ol/Geolocation';
import Control from 'ol/control/Control';
import EventType from 'ol/events/EventType';
import Overlay from 'ol/Overlay';
import {CLASS_CONTROL, CLASS_HIDDEN, CLASS_UNSELECTABLE} from 'ol/css.js';
import {containsCoordinate} from 'ol/extent';
import Polygon from 'ol/geom/Polygon';
import addInfoBox from './infoBox.js';

const OFF = 0;
const WAITING = 1;
const TRACKING = 2;

const chezmoi = new Polygon([[ 
  [-8188174,5703058],
  [-8188085,5703189],
  [-8187814,5703014],
  [-8187907,5702873],
  [-8188174,5703058]]]);


class YouAreHere extends Control {

  constructor(opt_options) {
    const options = opt_options ? opt_options : {};
    super({
      element: document.createElement('div')
    });

    const tipLabel = options.tipLabel ? options.tipLabel : 'Géolocalisation';

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.title = tipLabel;

    button.addEventListener(
      EventType.CLICK,
      this.handleClick_.bind(this),
      false
    );

    this.extent_ = options.extent;

    const cssClasses =
      'you-are-here-control ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    const element = this.element;
    element.className = cssClasses;
    element.appendChild(button);

    this.infoBox_ = undefined;

    this.overlay_= new Overlay({
      element: document.createElement('div'),
      className: 'you-are-here',
      positioning: 'center-center',
      stopEvent: false
    });
    this.geolocation_ = new Geolocation({
      trackingOptions: { enableHighAccuracy: true}
    });
    this.geolocation_.on('change:position', this.handlePositionChange_.bind(this))
    this.geolocation_.on('error', this.handlePositionError_.bind(this));

    this.filter_ = undefined;

    this.state_ = OFF;
    document.addEventListener('visibilitychange', this.handleVisibilityChange_.bind(this));

  }

  setMap(map) {
    super.setMap(map);
    this.infoBox_ = addInfoBox(map);
  }

  handlePositionChange_() {

    let position = this.geolocation_.getPosition();
    const accuracy = this.geolocation_.getAccuracy();
    position = this.filter_.process(position[1], position[0], accuracy, Date.now());
    const inExtent = this.extent_ ? containsCoordinate(this.extent_, position) : true;
    //const inExtent =  chezmoi.intersectsCoordinate(position);

    switch (this.state_) {
      case WAITING:
        if (inExtent) {
          const map = this.getMap();
          this.infoBox_.hide();
          this.overlay_.setPosition(position);
          map.addOverlay(this.overlay_);
          map.getView().animate({center:position});
          this.state_ = TRACKING;
        } else {
          this.geolocation_.setTracking(false);
          this.infoBox_.setText('Géolocalisation disponible seulement sur le site d\'expo');
          this.state_ = OFF;
        }
        break;
      case TRACKING:
        if(inExtent) {
          this.overlay_.setPosition(position);

        } else {
          this.geolocation_.setTracking(false);
          this.infoBox_.setText('Au revoir');
          this.getMap().removeOverlay(this.overlay_);
          this.state_ = OFF;
        }
        break;

    }

  }

  handlePositionError_(error) {
    this.geolocation_.setTracking(false);
    this.infoBox_.setText(error.message);
    this.state_ = OFF

  }

  handleClick_(event) {
    const map = this.getMap();

    switch (this.state_) {
      case OFF:
        this.infoBox_.setText('En attente');
        this.geolocation_.setProjection(map.getView().getProjection());
        this.filter_ = new GPSKalmanFilter();
        this.state_ = WAITING;
        this.geolocation_.setTracking(true);
        break;
      case TRACKING:
        map.getView().animate({center:this.overlay_.getPosition()});

        break;
      default:


    }
  }

  handleVisibilityChange_(event) {
    if (document.visibilityState == 'hidden' && this.state_ != OFF) {
      this.geolocation_.setTracking(false);
      this.getMap().removeOverlay(this.overlay_);
      this.state_ = WAITING;
    } else if (document.visibilityState == 'visible' && this.state_ == WAITING) {
      this.filter_ = new GPSKalmanFilter();
      this.geolocation_.setTracking(true);
    }

  }
}

//  https://stackoverflow.com/questions/1134579/smooth-gps-data
class GPSKalmanFilter {
  constructor (decay = 3) {
    this.decay = decay
    this.variance = -1
    this.minAccuracy = 1
  }

  process (lat, lng, accuracy, timestampInMs) {
    if (accuracy < this.minAccuracy) accuracy = this.minAccuracy

    if (this.variance < 0) {
      this.timestampInMs = timestampInMs
      this.lat = lat
      this.lng = lng
      this.variance = accuracy * accuracy
    } else {
      const timeIncMs = timestampInMs - this.timestampInMs

      if (timeIncMs > 0) {
        this.variance += (timeIncMs * this.decay * this.decay) / 1000
        this.timestampInMs = timestampInMs
      }

      const _k = this.variance / (this.variance + (accuracy * accuracy))
      this.lat += _k * (lat - this.lat)
      this.lng += _k * (lng - this.lng)

      this.variance = (1 - _k) * this.variance
    }

    return [this.lng, this.lat]
  }
}
export default YouAreHere;

import Geolocation from 'ol/Geolocation';
import Control from 'ol/control/Control';
import EventType from 'ol/events/EventType';
import Overlay from 'ol/Overlay';
import {CLASS_CONTROL, CLASS_HIDDEN, CLASS_UNSELECTABLE} from 'ol/css.js';
import {containsCoordinate} from 'ol/extent';
import Polygon from 'ol/geom/Polygon';
import {getDistance} from  'ol/sphere';
import {toLonLat} from 'ol/proj';

const OFF = 0;
const WAITING = 1;
const TRACKING = 2;

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


    this.overlay_= new Overlay({
      element: document.createElement('div'),
      className: 'you-are-here',
      positioning: 'center-center',
      stopEvent: false
    });
    this.geolocation_ = new Geolocation({
      trackingOptions: { enableHighAccuracy: true, maximumAge: 0}
    });
    this.geolocation_.on('change:position', this.handlePositionChange_.bind(this))
    this.geolocation_.on('error', this.handlePositionError_.bind(this));

    this.dlg_ = new GpsStatusDlg(this.handleDlgResult_.bind(this)) ;

    document.addEventListener('visibilitychange', this.handleVisibilityChange_.bind(this));

    // Lorsque la gólocalisation est activée, le centre de la carte est 
    // mise à jour à chaque nouvelle position. Cependant si l'utilisateur
    // manipule la carte, on continue de mettre à jour la position, mais
    // on ne recentre pas pour ne pas causer de confusion. 
    this.updateViewCenter = false;

    // La première position retournée lorsque le GPS démarre est parfois la
    // dernière position générée lorsque la GPS s'est arrêté. Cette variable
    // permet de rejeter la première position retournée.
    this.isFirstPosition_ = true; 

    this.state_ = OFF;

  }

  setMap(map) {
    super.setMap(map);
    map.addControl(this.dlg_)
    map.on('movestart', this.handleMapMovestart_.bind(this));
    map.once('rendercomplete',
      () => { if (sessionStorage.getItem('GpsOn')) { 
        this.startTracking_();
        }
      }
    );
  }

  startTracking_() {
    this.dlg_.show();
    this.isFirstPosition_ = true;
    this.updateViewCenter_ = true;
    sessionStorage.setItem('GpsOn', 'true');
    this.geolocation_.setProjection(this.getMap().getView().getProjection())
    this.geolocation_.setTracking(true);
    this.state_ = WAITING;

  }

  stopTracking_() {
    this.geolocation_.setTracking(false);
    sessionStorage.removeItem('GpsOn');
    this.getMap().removeOverlay(this.overlay_);
    this.state_ = OFF;
  }

  handlePositionChange_() {

    const map = this.getMap()
    const view = map.getView();
    const position = this.geolocation_.getPosition();
    const accuracy = this.geolocation_.getAccuracy();
    const inExtent = this.extent_ ? containsCoordinate(this.extent_, position) : true;

    switch (this.state_) {
      case WAITING:
        if (this.isFirstPostion_) {
          this.isFirstPosition_ = false;
        } else {

          if (inExtent && accuracy < 20) {
            this.dlg_.hide();
            this.overlay_.setPosition(position);
            map.addOverlay(this.overlay_);
            view.animate({center:position});
            this.state_ = TRACKING;
          }
        }
        break;

      case TRACKING:
        if (inExtent) {
          this.overlay_.setPosition(position);
          const distance = getDistance(toLonLat(position),
            toLonLat(view.getCenter()));
          if (this.updateViewCenter_ && distance > 7.5 && !view.getAnimating()) {
            view.animate({center:position})
          }
        } else {
          this.stopTracking_();
        }

        break;
    }
  }

  handlePositionError_(error) {
    this.stopTracking_();
    this.dlg_.show(error.message);
  }

  handleClick_(event) {
    switch (this.state_) {
      case OFF:
        this.startTracking_();
        break;
      case TRACKING:
        if (this.updateViewCenter_ == false) {
          this.updateViewCenter_ = true;
          this.getMap().getView().animate({center:this.overlay_.getPosition()});
        } else {
          this.stopTracking_();
        }
        break;
      default:

    }
  }

  handleMapMovestart_() {

    if (this.state_ == TRACKING && this.getMap().getView().getInteracting()) {
      this.updateViewCenter_ = false;
    }
  }

  handleVisibilityChange_(event) {
    if (document.visibilityState == 'hidden' && this.state_ != OFF) {
      this.getMap().removeOverlay(this.overlay_);
    } else if (document.visibilityState == 'visible' && this.state_ != OFF) {
      this.startTracking_();
    }
  }

  handleDlgResult_() {
    this.stopTracking_();
  }
}


class GpsStatusDlg extends Control {

  constructor(callback) {
    super({
      element: document.createElement('div')
    });
    
    this.element.className = 'dialog-box ' + CLASS_UNSELECTABLE ; 
    this.element.style.display = 'none';
    this.msg_ = document.createElement('p');

    this.cancelBtn_ = document.createElement('button');
    this.cancelBtn_.setAttribute('type', 'button');
    this.cancelBtn_.textContent = 'Annuler';
    this.cancelBtn_.addEventListener('click', this.cancelBtnClickHandler_.bind(this));

    this.element.appendChild(this.msg_);
    this.element.appendChild(this.cancelBtn_);


    this.callback_ = callback;;
    this.intervalId_ = undefined;
    this.remainingSeconds_ = undefined;

  }

  show(msg) {
    this.remainingSeconds_ = 20;

    if (this.intervalId_) {
      clearTimeout(this.intervalId_)
      this.intervalId_ = undefined;
    }
    if (msg) {
      this.msg_.innerHTML = msg;
    } else {
      this.intervalId_ = setInterval(this.intervalHandler_.bind(this), 1000);
      this.msg_.innerHTML = 'Géolocalisation en cours... ' + this.remainingSeconds_ + 's';
    }

    this.element.style.display = 'block';
  }

  hide() {
    clearTimeout(this.intervalId_);
    this.intervalId_ = undefined;
    this.element.style.display = 'none';
  }
 
  cancelBtnClickHandler_() {
    this.hide();
    this.callback_();
  }

  intervalHandler_() {
    this.remainingSeconds_--;
    if (this.remainingSeconds_ > 0) {
      this.msg_.innerHTML = 'Géolocalisation en cours... ' + this.remainingSeconds_ + 's';
    } else {
      this.msg_.innerHTML = 'La géolocalisation a échouée.<ul>' +
        '<li>Êtes-vous bien au parc Jean Drapeau?</li>' +
        '<li>Votre appareil est-il équipé d\'un GPS?</li>' +
        '<li>Êtes-vous à l\'extérieur?</li>' +
        '<li>Réessayez de nouveau, parfois c\'est plus long.</li></ul>';
      clearTimeout(this.intervalId_);
      this.intervalId_ = undefined;
      this.callback_();
    }
  }

}

export default YouAreHere;

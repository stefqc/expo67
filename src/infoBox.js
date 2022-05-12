import Control from 'ol/control/Control';
import EventType from 'ol/events/EventType';
import {CLASS_CONTROL, CLASS_HIDDEN, CLASS_UNSELECTABLE} from 'ol/css.js';


class InfoBox extends Control {
  constructor() {
   
    
    super({
      element: document.createElement('div')
    });
    
    this.element.className = 'status-box';
    this.element.style.display = 'none';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.setAttribute('type', 'button');
    closeBtn.textContent = 'x';
    closeBtn.addEventListener('click', this.handleClose.bind(this));

    this.statusText_ = document.createElement('p');
    this.element.appendChild(closeBtn);
    this.element.appendChild(this.statusText_);
  }

  setText(text) {
    if (this.element.style.display == 'none')
       this.element.style.display = 'block';
    this.statusText_.textContent = text;
  }

  handleClose() {
    this.hide();
  }

  hide() {
    this.element.style.display = 'none';
  }
}

const theInfoBox = new InfoBox();

function addInfoBox(map) {
  if (theInfoBox.getMap() != map) {
    map.addControl(theInfoBox);
  }
  return theInfoBox;
}
export default addInfoBox;

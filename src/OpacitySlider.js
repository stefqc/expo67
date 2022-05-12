import Control from 'ol/control/Control';
import {CLASS_UNSELECTABLE} from 'ol/css';

/**
 * @classdesc
 * A slider type of control for zooming.
 *
 * Example:
 *
 *     map.addControl(new ZoomSlider());
 *
 * @api
 */
class OpacitySlider extends Control {
  /**
   * @param {Options=} opt_options Zoom slider options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    super({
      element: document.createElement('div'),
    });

    this.layer_ = options.layer;

    const className =
      options.className !== undefined ? options.className : '';
    const containerElement = this.element;
    containerElement.className =
      className + ' ' + CLASS_UNSELECTABLE;
    let span = document.createElement('span');
    span.textContent = options.leftLabel !== undefined ? options.leftLabel : '';
    containerElement.appendChild(span);
  
    const sliderElement = document.createElement('input');
    sliderElement.setAttribute('type', 'range');
    sliderElement.setAttribute('value', '0')

    sliderElement.addEventListener(
      'input',
      this.onInput_.bind(this),
      false
    );
    containerElement.appendChild(sliderElement);

    span = document.createElement('span');
    span.textContent = options.rightLabel !== undefined ? options.rightLabel : ''
    containerElement.appendChild(span);
  }


  onInput_(event) {
    this.layer_.setOpacity(1 - event.target.value / 100);
  }

}

export default OpacitySlider;

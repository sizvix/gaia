/**
 * FxosTvModalDialog creates a dialog with a group of buttons as select
 * options. It also includes open/close animation and bubbling animation.
 * The template is shown below:
 *   <fxos-tv-dialog class="modal-dialog">
 *     <div class="outer-container">
 *       <div class="container">
 *         <div class="modal-dialog-message-container">
 *           <div class="modal-dialog-message"></div>
 *           <div class="modal-dialog-custom-group"></div>
 *         </div>
 *         <div class="modal-dialog-button-group">
 *           <fxos-tv-button></fxos-tv-button>
 *           ...
 *           <fxos-tv-button></fxos-tv-button>
 *         </div>
 *       </div>
 *     </div>
 *   </fxos-tv-dialog>
 */

(function(exports) {
  'use strict';

  var DEFAULT_MARGIN = 44;

  function FxosTvModalDialog(container, options) {
    // Determine whether this dialog is opened or not
    this._clickedIndex = null;
    this.defaultFocusElement = null;

    this._margin = options && options.margin ? options.margin : DEFAULT_MARGIN;
    this._translateX = 0;

    BaseModalDialog.call(this, container);

    this.element.id = 'fxos-tv-modal-dialog-' + this.dialogCounter;
  }

  var proto = Object.create(BaseModalDialog.prototype);

  /**
   * The counter for the created fxos-tv-modal-dialogs
   * @type {Number}
   */
  proto._dialogCounter = -1;

  Object.defineProperty(proto, 'dialogCounter', { get: function () {
    this._dialogCounter += 1;
    return this._dialogCounter;
  }});

  proto._init = function() {
    this.fxosTvBubble = document.createElement('fxos-tv-bubbles');
    this.element.addEventListener('will-open', this);
    this.element.addEventListener('will-close', this);
    this.element.addEventListener('opened', this);
    this.element.addEventListener('closed', this);
    this.fxosTvBubble.addEventListener('all-items-bubbled', this);
  };

  proto._render = function() {
    this.messageElement = document.createElement('div');
    this.messageElement.classList.add('modal-dialog-message');

    this.customElementGroup = document.createElement('div');
    this.customElementGroup.classList.add('modal-dialog-custom-group');

    this.messageContainer = document.createElement('div');
    this.messageContainer.classList.add('modal-dialog-message-container');
    this.messageContainer.appendChild(this.messageElement);
    this.messageContainer.appendChild(this.customElementGroup);

    this.buttonGroup = document.createElement('div');
    this.buttonGroup.classList.add('modal-dialog-button-group');
    this.buttonGroup.setAttribute('fxos-tv-bubbles', 'true');

    this.innerContainer.appendChild(this.messageContainer);
    this.innerContainer.appendChild(this.buttonGroup);
  };

  proto._renderMessage = function(options) {
    this.message = options.message || {};

    this.customSettings = options.customElementSettings || null;
    if (this.customSettings) {
      while (this.customElementGroup.firstChild) {
        this.customElementGroup.removeChild(this.customElementGroup.firstChild);
      }
      this.customElementGroup.appendChild(this.customSettings.element);
      this.customElementGroup.classList.remove('hidden');
    } else {
      this.customElementGroup.classList.add('hidden');
    }

    if (!this.message.textRaw && !this.message.textL10nId) {
      this.messageElement.classList.add('hidden');
    } else {
      this.messageElement.classList.remove('hidden');
      this.messageElement.textContent = this.message.textRaw || '';
      if (this.message.textL10nId) {
        this._setL10n(this.messageElement, this.message.textL10nId);
      }
    }
  };

  proto._renderButtons = function(options) {
    var renderedCallback = options.onButtonRendered;
    this.buttonElements = [];
    this.buttonSettings = options.buttonSettings || [];
    this.buttonGroup.innerHTML = '';

    // Set up every button
    this.buttonSettings.forEach(function buildButton(buttonSetting, index) {
      var button = document.createElement('fxos-tv-button');
      button.setAttribute('type', buttonSetting.type || 'circle-text');
      button.textContent = buttonSetting.textRaw || 'OK';
      if (buttonSetting.textL10nId) {
        this._setL10n(button, buttonSetting.textL10nId);
      }
      button.classList.add(buttonSetting.class || 'confirm');
      if (buttonSetting.icon) {
        button.style.backgroundImage = 'url(' + buttonSetting.icon + ')';
      } else if (buttonSetting.iconFont) {
        button.dataset.icon = buttonSetting.iconFont;
      }
      button.addEventListener('click', function() {
        // Click action will be handled in closed event
        this._clickedIndex = index;
        this.close();
      }.bind(this));
      this.buttonElements.push(button);
      this.buttonGroup.appendChild(button);
      if (!this.defaultFocusElement || buttonSetting.defaultFocus) {
        this.defaultFocusElement = button;
      }
      if (renderedCallback) {
        // We add render callback to let user to do more complex visual
        // modifications.
        renderedCallback(button, buttonSetting);
      }
    }.bind(this));
  };

  proto._open = function(options) {
    this._renderMessage(options);
    this._renderButtons(options);
    BaseModalDialog.prototype._open.call(this, options);
  };

  proto.startKeyNavigation = function() {
    var id = '#' + this.element.id;
    SpatialNavigation.init();
    SpatialNavigation.add({
      id: this.element.id,
      selector: id + ' button, ' + id + ' input, ' + id + ' fxos-tv-button',
      restrict: 'self-only'
    });

    SpatialNavigation.makeFocusable();
    SpatialNavigation.focus(this.defaultFocusElement);
  };

  /**
   * Scroll the list to the input element
   */
  proto._scrollTo = function(element) {
    var newTransition = this._getScrollOffset(element);
    this._translateX = newTransition;
    this.buttonGroup.style.transform = 'translateX(' + this._translateX +
                                       'px)';
  };

  /**
   * Get the offset of the node element
   */
  proto._getScrollOffset = function(nodeElem) {
    if (!this._viewWidth) {
      this._viewWidth = this.innerContainer.clientWidth - 2 * this._margin;
    }
    var nodeLeft = nodeElem.offsetLeft;
    var nodeWidth = nodeElem.offsetWidth;
    var listWidth = this.buttonGroup.offsetWidth;
    var newTranslate = this._translateX;
    var lastElement = this.buttonElements[this.buttonElements.length - 1];
    var firstElement = this.buttonElements[0];

    if (listWidth < this._viewWidth) {
      // align to horizontal center if list width is smaller than the container
      return (this._viewWidth - listWidth) / 2 + this._margin;
    } else if (nodeLeft + nodeWidth >
                          -this._translateX + this._viewWidth + this._margin) {
      // scroll left if the node falls beyond the right edge of container
      newTranslate = this._viewWidth - nodeLeft - nodeWidth + this._margin;
    } else if (nodeLeft < -this._translateX + this._margin) {
      // scroll right if the node falls beyond the left edge of container
      newTranslate = -nodeLeft + this._margin;
    }

    // If the new scroll offset contains first/last node, we have to align the
    // list to begin/end.
    if (lastElement.offsetLeft + lastElement.offsetWidth <=
                              -newTranslate + this._viewWidth + this._margin) {
      return this._viewWidth + this._margin - lastElement.offsetLeft -
                                              lastElement.offsetWidth;
    } else if (firstElement.offsetLeft >= -newTranslate + this._margin) {
      return -firstElement.offsetLeft + this._margin;
    }
    return newTranslate;
  };

  proto._getFocusedElement = function() {
    return document.activeElement;
  };

  proto._focusContent = function() {
    var elem = this._getFocusedElement();
    this._scrollTo(elem);

    // move focus to fxos-tv dialog while transition running
    if (elem.focus && (typeof elem.focus) === 'function') {
      elem.focus();
    }
  };

  proto._blurContent = function() {
    var elem = this._getFocusedElement();
    if (elem.blur && (typeof elem.blur === 'function')) {
      elem.blur();
    }
  };

  proto.stopKeyNavigation = function() {
    this.defaultFocusElement = null;
    SpatialNavigation.remove(this.element.id);
  };

  proto.handleEvent = function(e) {

    switch(e.target) {
      case this.element:
        if (e.type === 'will-open' || e.type === 'will-close') {
          this.fireEvent('modal-dialog-' + e.type);
        } else if (e.type === 'opened') {
          this._scrollTo(this.buttonElements[0]);
          // Play bubble animation when the fxos-tv-dialog is opened
          this.fxosTvBubble.play(this.buttonElements);
        } else if (e.type === 'closed') {
          // Do click actions when the fxos-tv-dialog is closed
          this.element.classList.remove('visible');
          if ((this._clickedIndex || this._clickedIndex === 0) &&
              this.buttonSettings[this._clickedIndex].onClick) {
            this.buttonSettings[this._clickedIndex].onClick(
              this.buttonSettings[this._clickedIndex]);
            this._clickedIndex = null;
          } else if (this.onCancel) {
            // ESC key enter
            this.onCancel();
          }
          this.isOpened = false;
          this.stopKeyNavigation();
          this.element.classList.remove('modal-dialog-opened');
          this.fireEvent('modal-dialog-closed');
        }
        break;
      case this.fxosTvBubble:
        this.element.classList.add('modal-dialog-opened');
        this.startKeyNavigation();
        this.focus();
        this.fireEvent('modal-dialog-opened');
        break;
    }
  };

  FxosTvModalDialog.prototype = proto;
  exports.FxosTvModalDialog = FxosTvModalDialog;

})(window);

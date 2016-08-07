'use strict';
var Base = require('../base');

/**
 * Abstraction around settings battery panel
 * @constructor
 * @param {Marionette.Client} client for operations.
 */
function BatteryPanel(client) {

  // Call the Base constructor to initiate base class.
  Base.call(this, client, null, BatteryPanel.Selectors);

}

module.exports = BatteryPanel;

BatteryPanel.Selectors = {
  'powerSaveModeEnabledCheckbox': '#battery gaia-switch',
  'threshold': 'select[name="powersave.threshold"]',
  'option': 'option'
};

BatteryPanel.prototype = {

  __proto__: Base.prototype,

  get isPowerSavingEnabled() {
    return this.findElement('powerSaveModeEnabledCheckbox')
      .scriptWith(function(el) {
        return el.wrappedJSObject.checked;
      });
  },

  get isLastOptionSelected() {
    var options = this.findElements('option');
    return options[options.length - 1].getAttribute('checked');
  },

  changeTurnOnPeriod: function() {
    this.waitForElement('threshold').tap();
    this.client.waitFor(function() {
      return this.isLastOptionSelected;
    }.bind(this));
  },

  enablePowerSaveMode: function() {
    this.waitForElement('powerSaveModeEnabledCheckbox').click();
    this.client.waitFor(function() {
      return this.isPowerSavingEnabled;
    }.bind(this));
  },

  disablePowerSaveMode: function() {
    this.waitForElement('powerSaveModeEnabledCheckbox').click();
    this.client.waitFor(function() {
      return !this.isPowerSavingEnabled;
    }.bind(this));
  }

};

'use strict';

marionette('Closing statusbar via home button >', function() {

  var assert = require('assert');

  var client = marionette.client({
    profile: {
      prefs: {
        'devtools.debugger.forbid-certified-apps': false
      }
    },
    desiredCapabilities: { raisesAccessibilityExceptions: false }
  });

  var system,
      verticalHomeApp = 'app://verticalhome.gaiamobile.org',
      actions;

  setup(function() {
    system = client.loader.getAppClass('system');
    system.waitForFullyLoaded();
    actions = client.loader.getActions();
    client.switchToFrame();
  });

  function getScrollTop() {
    return client.executeScript(function() {
      return window.scrollY;
    });
  }

  function waitForHome() {
    system.waitForLaunch(verticalHomeApp);
    client.apps.switchToApp(verticalHomeApp);
  }

  test('Home screen keeps scroll position', function() {
    var height = client.executeScript(function() {
      return document.body.clientHeight;
    });

    // scroll vertical home screen
    var body = client.findElement('body');
    actions.flick(body, 0, height / 2, 0, 0)
           .perform();

    waitForHome();
    var lastScrollTop = getScrollTop();

    // pull down utility tray
    client.switchToFrame();
    actions.press(system.topPanel)
           .moveByOffset(0, height / 2)
           .release()
           .perform();

    // click home button
    system.tapHome();
    waitForHome();
    assert.ok(getScrollTop() === lastScrollTop);
  });
});

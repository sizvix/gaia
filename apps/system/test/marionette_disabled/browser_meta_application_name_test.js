'use strict';

var assert = require('assert');
var Server = require('../../../../shared/test/integration/server');
var Rocketbar = require('./lib/rocketbar');

marionette('Browser - Site loading background', function() {

  var client = marionette.client({
    desiredCapabilities: { raisesAccessibilityExceptions: false }
  });

  var home, rocketbar, search, server, system;

  suiteSetup(function(done) {
    Server.create(__dirname + '/fixtures/', function(err, _server) {
      server = _server;
      done();
    });
  });

  suiteTeardown(function() {
    server.stop();
  });

  setup(function() {
    home = client.loader.getAppClass('homescreen');
    rocketbar = new Rocketbar(client);
    search = client.loader.getAppClass('search');
    system = client.loader.getAppClass('system');
    system.waitForFullyLoaded();

    // Need to wait for the homescreen to be ready as this test takes a
    // screenshot. Without the homescreen, we may take a screenshot of the
    // system boot screen.
    client.apps.launch(home.URL);
    client.switchToFrame();
  });

  test('application-name meta tag changes rocketbar value', function() {
    var expected = 'gaia rocks';
    var url = server.url('meta_application_name.html');

    // Use the home-screen search box to open up the system browser
    rocketbar.homescreenFocus();
    rocketbar.enterText(url, true);

    var frame = client.helper.waitForElement(
      'div[transition-state="opened"] iframe[src="' + url + '"]');
    client.switchToFrame(frame);
    client.helper.waitForElement('body');

    client.switchToFrame();
    assert.ok(system.appUrlbar.text().indexOf(expected) !== -1);
  });
});

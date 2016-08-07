/* global assert */
'use strict';
suite('#gaiaProfile', function() {
  var subject = require('../lib/gaiaprofile');
  var linux = __dirname + '/fixtures/b2g-linux';
  var mac = __dirname + '/fixtures/b2g-mac';

  test('mac', function(done) {
    subject(mac, function(err, path) {
      if (err) return done(err);
      assert.equal(path, mac + '/Contents/Resources/gaia/profile');
      done();
    });
  });

  test('linux', function(done) {
    subject(linux, function(err, path) {
      if (err) return done(err);
      assert.equal(path, linux + '/gaia/profile');
      done();
    });
  });
});

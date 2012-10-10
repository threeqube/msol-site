var env = require('../lib/environment');
var persona = require('../lib/persona');
var util = require('util');

exports.login = function(req, res){
  if (req.method === 'GET')
    return res.render("login.html");
  var assertion = req.body.assertion;
  persona.verify(assertion, function (err, email) {
    if (err)
      return res.send(util.inspect(err));
    if (!userIsAuthorized(email))
      return res.send(403, 'not authorized')
    req.session.user = email;
    return res.redirect('/admin');
  });
};

exports.logout = function (req, res) {
  req.session.destroy(function () {
    return res.redirect('/login');
  });
};

var middleware = exports.middleware = {};
middleware.requireAuth = function requireAuth(options) {
  var whitelist = options.whitelist || [];
  return function (req, res, next) {
    var path = req.path;
    var user = req.session.user;
    if (whitelist.indexOf(path) > -1)
      return next();
    if (!user || !userIsAuthorized(user))
      return res.redirect(options.redirectTo);
    return next();
  };
};

function userIsAuthorized(email) {
  var admins = env.get('admins');
  var authorized = false;
  admins.forEach(function (admin) {
    if (authorized) return;
    var adminRe = new RegExp(admin.replace('*', '.+?'));
    if (adminRe.test(email))
      return authorized = true;
  });
  return authorized;
}
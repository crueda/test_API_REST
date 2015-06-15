var jwt = require('jwt-simple');
var UserModel = require('../models/users');

module.exports = function(req, res, next) {

  // When performing a cross domain request, you will recieve
  // a preflighted request first. This is to check if our the app
  // is safe.

  // We skip the token outh for [OPTIONS] requests.
  //if(req.method == 'OPTIONS') next();

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
  var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];

  if (token || key) {
    try {
      var decoded = jwt.decode(token, require('../config/secret.js')());

      if (decoded.exp <= Date.now()) {
        res.status(400);
        res.json({
          "status": 400,
          "msg": "Token Expired"
        });
        return;
      }

      // Authorize the user to see if s/he can access our resources
      UserModel.getUser(id,function(error, data)
      {
          //si existe el area enviamos el json
          if (typeof data !== 'undefined' && data.length > 0)
          {
              res.json(200,{"msg":data})
          }
          //en otro caso mostramos un error
          else
          {
              res.json(404,{"msg":"notExist"});
          }
      });

      //var dbUser = validateUser(key); // The key would be the logged in user's username
      var dbUser = { // spoofing a userobject from the DB.
        name: 'sumo',
        role: 'admin',
        username: 'sumo'
      };

      if (dbUser) {


        if ((req.url.indexOf('admin') >= 0 && dbUser.role == 'admin') || (req.url.indexOf('admin') < 0 && req.url.indexOf('/kyrosapi/') >= 0)) {
          next(); // To move to next middleware
        } else {
          res.status(403);
          res.json({
            "status": 403,
            "msg": "Not Authorized"
          });
          return;
        }
      } else {
        // No user with this name exists, respond back with a 401
        res.status(401);
        res.json({
          "status": 401,
          "msg": "Invalid User"
        });
        return;
      }

    } catch (err) {
      res.status(500);
      res.json({
        "status": 500,
        "msg": "Oops something went wrong",
        "error": err
      });
    }
  } else {
    res.status(401);
    res.json({
      "status": 401,
      "msg": "Invalid Token or Key"
    });
    return;
  }
};

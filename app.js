var express = require('express')
  , http = require('http')
  , path = require('path')
  , util = require('util');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.logger('dev'));
  app.enable('verbose errors');
});

app.use(function(req, res, next){
  console.log('sending 200');
  res.send(200);
});

/////////////////////////////////////////////////////////////////////////
var config = require('./couch/config.js');
var connection = new(require('cradle').setup(config.couch.cradle.options).Connection);

// Initialise the document db
Object.keys(config.couch.db).forEach(function(name){
  var db = connection.database(name);
  db.exists(function (err, exists) {
    if (err) {
      console.log('CouchDB error', err);
    }
    if (!exists) {
      console.log('CouchDB creating `%s` as it does not exists.', db.name);
      db.create();
      var designs = config.couch.db[name].designs;
      Object.keys(designs).forEach(function(key){
        console.log('CouchDB creating `_design/%s` in `%s` as it does not exists.', key, db.name);
        db.save('_design/' + key, designs[key], function(err, res){ 
          if (err) {
            console.log('CouchDB error', err);
          }
        });
      });
    }
  });  
});

function record(req, res){ 
  var db = connection.database('requests');
  var request = {
    method: req.method, 
    url: req.url, 
    httpVersion: req.httpVersion,
    headers: req.headers,
    body: undefined,
    timestamp: new Date
  };
  req.on('data', function (chunk) {
    request.body = request.body?request.body+chunk:chunk;
  });
  req.on('end', function() {
    db.save(request, function (err, res) {
      if (err) {
        console.log('CouchDB error', err);
      }
    });
    // whack it in elasticsearch or have some CouchDB watcher
    // TODO:
  });
}


/////////////////////////////////////////////////////////////////////////



var server = http.createServer();
server.on('request', record);
server.on('request', app);
server.listen(app.get('port'), function(){
    console.log('started http://localhost:%s in %s mode', app.get('port'), app.get('env'));
});

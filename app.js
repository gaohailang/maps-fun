var express = require('express');
var Mustache = require('Mustache');
var fs = require('fs');
var x = require('lodash');
var request = require('request');

var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}));
// parse application/json
app.use(bodyParser.json());

app.get('/api/panoramas', function(req, res) {
    // http://www.panoramio.com/map/get_panoramas.php?set=public&from=0&to=20&minx=-180&miny=-90&maxx=180&maxy=90&size=medium&mapfilter=true
    console.log(buildPanoramasQs(req.query));
    request.get('http://www.panoramio.com/map/get_panoramas.php', {
        qs: buildPanoramasQs(req.query)
    }, function(err, _res, body) {
        console.log(_res);
        console.log(body);
        res.end(body);
    });

    function buildPanoramasQs(_qs) {
        // minx=-180&miny=-90&maxx=180&maxy=90
        return {
            order: '',
            set: 'public', // indoor,
            from: 0,
            to: 99,
            size: 'medium',
            minx: (+_qs.lng) - 0.1,
            maxx: (+_qs.lng) + 0.1,
            miny: (+_qs.lat) - 0.1,
            maxy: (+_qs.lat) + 0.1
        };
    }
});

app.use(express.static(__dirname + '/public'));
server.listen(5000, '0.0.0.0');
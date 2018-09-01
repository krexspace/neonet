var express = require('express');
var path = require('path');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var log4js = require('log4js');
var fs = require('fs');
var q = require('q');
var favicon = require('serve-favicon');
var config = require('./server-config');
var request = require('request');

// internal modules

var app = express();
const logger = log4js.getLogger();
log4js.configure({
    appenders: { 'out': { type: 'stdout' } },
    categories: { default: { appenders: ['out'], level: 'info' } }
});

// enable SSL
const privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

const credentials = {key: privateKey, cert: certificate};

function setupServer() {
    app.use(bodyParser.json());
    //app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
    //app.use(cookieParser());

    app.use(express.static(path.join(__dirname, 'bower_components')));
    app.use(express.static(path.join(__dirname, 'public/')));

    // --------------------------------------------------------
    // URL Mapping
    // --------------------------------------------------------
    app.post('/thea_api', function (req, res) {
        logger.info('Received request:', req.body);
        // Call the python command bus
        request({
            url: 'https://localhost:3737/kbus', //URL to hit
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body), //Set the body as a string,
            strictSSL: false,
        }, function (error, response, body) {
            if (error) {
                logger.error(error);
                res.send(error);
            } else {
                res.send(body);
                logger.info('[python_conn] http_status:', response.statusCode);
            }
        });
    });

    // resources port. Like image upload
    app.post('/resport', function (req, res) {
        logger.info('Received upload request:');
        let base64String = req.body.imgBase64; // Not a real image
        // Remove header
        let base64Image = base64String.split(';base64,').pop();
        let fname = 'public/stagearea/' + new Date().getTime() + '_image001.' + req.body.img_ext;
        fs.writeFile(fname, base64Image, {encoding: 'base64'}, function(err) {
            if(err) {
                console.log('Error creating file at :', fname);
            } else {
                console.log('File created:', fname);
            }
        });
    });


    // ---------------------------------------------------------
    // Test URL mapping
    // ---------------------------------------------------------
    app.get('/ping', function (req, res) {
        res.send('I am up and running!');
        //console.log("Request body " + JSON.stringify(req.body));
        //console.log("Request headers " + JSON.stringify(req.headers));
    });
}

function abort(err) {
    console.log(err.message);
    process.exit(1);
}

setupServer();

//module.exports = app;

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(process.env.PORT || 3553, function () {
    logger.info(`  
    o8o.               ..,o8889689ooo888o"88888888oooc..
  .88888             .o888896888".88888888o'?888888888889ooo....
  a888P          ..c6888969""..,"o888888888o.?8888888888"".ooo8888oo.
  088P        ..atc88889"".,oo8o.86888888888o 88988889",o888888888888.
  888t  ...coo688889"'.ooo88o88b.'86988988889 8688888'o8888896989^888o
   888888888888"..ooo888968888888  "9o688888' "888988 8888868888'o88888
    ""G8889""'ooo888888888888889 .d8o9889""'   "8688o."88888988"o888888o .
             o8888'""""""""""'   o8688"          88868. 888888.68988888"o8o.
             88888o.              "8888ooo.        '8888. 88888.8898888o"888o.
             "888888'               "888888'          '""8o"8888.8869888oo8888o .
        . :.:::::::::::.: .     . :.::::::::.: .   . : ::.:."8888 "888888888888o
                                                          :..8888,. "88888888888.
                                                          .:o888.o8o.  "866o9888o
                                                           :888.o8888.  "88."89".
                                                          . 89  888888    "88":.
                      neonet                              :.     '8888o
                                                           .       "8888..
                                                                     888888o.
                                                                      "888889,
                                                               . : :.:::::::.: :.
   `);
    logger.info('NEONET Server listening on port ' + httpsServer.address().port);

});
var express = require('express');
var router = express.Router();
var UxoModel = require('../models/uxo');

// Fichero de propiedades
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./api.properties');

// Definición del log
var fs = require('fs');
var log = require('tracer').console({
    transport : function(data) {
        //console.log(data.output);
        fs.open(properties.get('main.log.file'), 'a', 0666, function(e, id) {
            fs.write(id, data.output+"\n", null, 'utf8', function() {
                fs.close(id, function() {
                });
            });
        });
    }
});

router.get('/AISMessage/Status', function(req, res)
{
    log.info ("Procesando GET de AISMessage/Status");

    // TODO. comprobar token
    res.json(200,{"status":"ON", "upTime":"999999"})

});



module.exports = router;

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

var mysql = require('mysql'),

// Crear la conexion a la base de datos
connection = mysql.createConnection(
    {
      host: properties.get('bbdd.mysql.ip') ,
      user: properties.get('bbdd.mysql.user') ,
      password: properties.get('bbdd.mysql.passwd') ,
      database: properties.get('bbdd.mysql.name')
    }
);

// Crear un objeto para ir almacenando todo lo necesario
var uxoModel = {};

// Obtener todos las uxos
uxoModel.getUxos = function(callback)
{
    if (connection)
    {
        var sql = 'SELECT POI_ID as id, DESCRIPTION as description, WEIGHT as weight, LATITUDE as latitude, LONGITUDE as longitude FROM POI where CATEGORY_ID=' + properties.get('kyros.uxo.category.id') + ' ORDER BY id';

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, rows)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                callback(null, rows);
            }
        });
    }
    else
    {
      callback(null, null);
    }
}

// Obtener un uxo por su id
uxoModel.getUxo = function(id,callback)
{
    if (connection)
    {
        var sql = 'SELECT POI_ID as id, DESCRIPTION as description, WEIGHT as weight, LATITUDE as latitude, LONGITUDE as longitude FROM POI WHERE POI_ID = ' + connection.escape(id);

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, row)
        {
            if(error)
            {
                callback(error, null);
            }
            else
            {
                callback(null, row);
            }
        });
    }
    else
    {
      callback(null, null);
    }
}

// Actualizar un uxo
uxoModel.updateUxo = function(uxoData, callback)
{
    if(connection)
    {
        var sql = 'UPDATE POI SET DESCRIPTION = ' + connection.escape(uxoData.description) + ',' +
        'WEIGHT = ' + connection.escape(uxoData.weight) + ',' +
        'LATITUDE = ' + connection.escape(uxoData.latitude) + ',' +
        'LONGITUDE = ' + connection.escape(uxoData.longitude) + ' ' +
        'WHERE POI_ID = ' + uxoData.id;

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(error, null);
            }
            else
            {
                callback(null,{"message":"success"});
            }
        });
    }
    else
    {
      callback(null, null);
    }

}

//añadir una nuevo uxo
uxoModel.insertUxo = function(uxoData,callback)
{
    if (connection)
    {
        var sql = 'INSERT INTO POI SET DESCRIPTION = ' + connection.escape(uxoData.description) + ',' +
        'CATEGORY_ID = ' + properties.get('kyros.uxo.category.id') + ',' +
        'WEIGHT = ' + connection.escape(uxoData.weight) + ',' +
        'LATITUDE = ' + connection.escape(uxoData.latitude) + ',' +
        'LONGITUDE = ' + connection.escape(uxoData.longitude);

        log.debug ("Query: "+sql);

        connection.query(sql, function(error, result)
        {
            if(error)
            {
               callback(null, null);
            }
            else
            {
                var uxoId = result.insertId;

                // Crear una zona de exclusion

                //Fecha inicial el momento actual
                var milliseconds_init = (new Date).getTime();

                //Fecha inicial final: inicial + 1 año
                var milliseconds_end = (new Date).getTime() + 31556900000;

                var sql = 'INSERT INTO AREA SET DESCRIPTION = ' + 'uxo_' + uxoId + ',' +
                'DATE_INIT = ' + milliseconds_init + ',' +
                'DATE_END = ' + milliseconds_end + ',' +
                'HOUR_INIT = ' + '0' + ',' +
                'HOUR_END = ' + '86400' + ',' +
                'TYPE_AREA = ' + 'F' + ',' +
                'RADIUS = ' + properties.get('kyros.uxo.radius') + ',' +
                'USER_NAME = \'sumoAPI_uxo\'';

                log.debug ("Query: "+sql);

                connection.query(sql, function(error, result)
                {
                  if(error)
                  {
                     callback(error, null);
                  }
                  else
                  {
                    //devolvemos el id del uxo insertada
                    callback(null,{"insertId" : uxoId});
                  }
                });
            }
        });
    }
    else
    {
      callback(null, null);
    }
}

// Eliminar un uxo pasando la id a eliminar
uxoModel.deleteUxo = function(id, callback)
{
    if(connection) {
        var sqlExists = 'SELECT * FROM POI WHERE POI_ID = ' + connection.escape(id);

        log.debug ("Query: "+sqlExists);

        connection.query(sqlExists, function(err, row)
        {
            //si existe la id del uxo a eliminar
            if(row) {
                var sqlPoi = 'DELETE FROM POI WHERE POI_ID = ' + connection.escape(id);

                log.debug ("Query: "+sqlPoi);

                connection.query(sqlPoi, function(error, result)
                {
                    if(error)
                    {
                      callback(error, null);
                    }
                    else
                    {
                        // Borrar la zona de exclusion asociada
                        var area_description = "uxo_" + id;
                        console.log (area_description);

                        var sqlArea = "DELETE FROM AREA WHERE DESCRIPTION = '" + area_description + "'";

                        log.debug ("Query: "+sqlArea);

                        connection.query(sqlArea, function(error, result)
                        {
                            if(error)
                            {
                              callback(error, null);
                            }
                            else
                            {
                                callback(null,{"message":"deleted"});
                            }
                        });
                    }
                });
            }
            else
            {
                callback(null,{"message":"notExist"});
            }
        });
    }
    else
    {
      callback(null, null);
    }
}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = uxoModel;

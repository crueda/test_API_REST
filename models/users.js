var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./sso.properties');

// Definición del log
var fs = require('fs');
var Log = require('log');
var log = new Log('debug', fs.createWriteStream(properties.get('main.log.file')));

//llamamos al paquete mysql que hemos instalado
var mysql = require('mysql'),
//creamos la conexion a nuestra base de datos con los datos de acceso de cada uno
connection = mysql.createConnection(
    {
        host: properties.get('bbdd.mysql.ip') ,
        user: properties.get('bbdd.mysql.user') ,
        password: properties.get('bbdd.mysql.passwd') ,
        database: properties.get('bbdd.mysql.name')
    }
);

//creamos un objeto para ir almacenando todo lo que necesitemos
var userModel = {};

//obtenemos un usuario por su username
userModel.getUser = function(userData,callback)
{

    if (connection)
    {
        var sql = 'SELECT USERNAME as username, PASSWORD as password, ROLE as role FROM USER WHERE USERNAME = ' + connection.escape(userData.username);
        log.debug ("Query:" + sql);
        connection.query(sql, function(error, row)
        {
            if(error)
            {
                callback(error, null);
                //throw error;
            }
            else
            {
                callback(null, row);
            }
        });
    }
    else {
      callback(null, null);
      //throw error;
    }


}

//exportamos el objeto para tenerlo disponible en la zona de rutas
module.exports = userModel;

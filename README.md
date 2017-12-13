# Segregación escolar público-privada en Euskadi

Este proyecto de visualización está siendo desarrollado para la ILP (iniciativa legislativa popular) http://ilpeskolainklusiboa.eus/

Se aceptan colaboraciones, sugerencias, pull requests... 

Puedes visitarlo en http://lab.montera34.com/segregacionescolar/

## Datos

Para estudiar la desigualdad entre las redes pública y privado-concertada de centros educativos en Euskadi hemos partido de los datos contenidos en el informe [La educación en Euskadi 2013-2015](http://www.consejoescolardeeuskadi.hezkuntza.net/c/document_library/get_file?uuid=ea15c830-b320-4199-8a35-424f3060533e&groupId=17937) del Consejo Escolar de Euskadi. Hemos tomado los indicadores por zonas escolares de alumnado extranjero, alumnado becario de material escolar y de comedor para que nos ayuden a entender las diferencias entre las redes.

Para utilizar los datos hemos tenido que pasar a formato reutilizable las tablas contenidas en PDF. Puedes descargar el archivo [2014-15-variables-escolares-euskadi.csv](https://github.com/montera34/segregacion/blob/master/data/output/2014-15-variables-escolares-euskadi.csv).

Para construir los mapas hemos tenido que crear los contornos de las zonas escolares, que no estaban disponibles en ninguna de las bases de datos abiertas en Euskadi. Puedes descargar los archivos:

* [Contornos zonas escolares Euskadi con valores asociados. Geojson](https://github.com/montera34/segregacion/blob/master/data/output/limites-zonas-escolares-euskadi-con-variables-2014-15.geojson).
* [Contornos zonas escolares Euskadi con valores asociados SIMPLIFICADOS.Topojson](https://github.com/montera34/segregacion/blob/master/data/output/limites-zonas-escolares-euskadi-con-variables-2014-15.geojson).

De este modo este informe cumple una doble función: analizar los datos de desigualdad y liberlarlos para que otras personas puedan usarlos.

exports.init = function (SARAH){
  status(SARAH.ConfigManager.getConfig());
}

exports.action = function(data, callback, config){
	console.log('##### Home Center 2 #####');

var config = config.modules.homecenter2;	

	switch (data.request)
	{
	case 'set':
	get_rooms( set, data, callback, config );
	break;
	case 'get':
	get_rooms( get, data, callback, config );
	break;
	case 'launch':
	get_rooms( set, data, callback, config );
	break;
	case 'updatedevices':
	get_rooms(update, data, callback, config );
	break;
	case 'updaterooms':
	get_rooms(update, data, callback, config );
	break;
	default:
	output(callback, "Une erreur s'est produite: ");
	}
}

var get_rooms = function ( action, data, callback, config ) {
	console.log("GET_ROOMS");
	var http = require('http');
	var options = {
	  hostname: config.ip,
	  port: 80,
	  path: '/api/rooms',
	  auth: config.login + ':' + config.password
	};
	
	var request = data.request;
	http.get(options, function(res) {
			
			var buffer = '';
			res.on('data', function (chunk) {
					buffer += chunk;
				});
			
			res.on('end', function(){
					var jsonrooms = JSON.parse(buffer);
					get_modules(jsonrooms, action, data, callback, config);
				});
		}).on('error', function(e) {
			output(callback, "Une erreur s'est produite: " + e.message);
		});
		
}

var get_modules = function ( jsonrooms, action, data, callback, config ) {
	console.log("GET_MODULES");
	var http = require('http');
	var options = {
	  hostname: config.ip,
	  port: 80,
	  path: '/api/devices',
	  auth: config.login + ':' + config.password
	};
	
	var request = data.request;
	http.get(options, function(res) {
			
			var buffer = '';
			res.on('data', function (chunk) {
					buffer += chunk;
				});
			
			res.on('end', function(){
					var json = JSON.parse(buffer);
					get_scenes(jsonrooms, json, action, data, callback, config);
				});
		}).on('error', function(e) {
			output(callback, "Une erreur s'est produite: " + e.message);
		});
		
}

var get_scenes = function ( jsonrooms, json, action, data, callback, config ) {
	var http = require('http');
	var options = {
	  hostname: config.ip,
	  port: 80,
	  path: '/api/scenes',
	  auth: config.login + ':' + config.password
	};

	var request = data.request;
	http.get(options, function(res) {
			var buffer = '';
			res.on('data', function (chunk) {
					buffer += chunk;
				});
			
			res.on('end', function(){
					json = json.concat(JSON.parse(buffer));
					action(jsonrooms, json, data, callback, config);
				});
		}).on('error', function(e) {
			output(callback, "Une erreur s'est produite: " + e.message);
		});
}

var get = function (jsonrooms, json, data, callback, config) {
	console.log("***** GET *****");
	var text = data.module;
	var text2 = data.room;
	var value = data.value;
	
	for ( var i = 0; i < jsonrooms.length; i++ ) {
	var rooms = jsonrooms[i];
	var tokens = rooms.name.split(' ');
	var found = true;
	for ( var j = 0; found && j < tokens.length; j++ ) {
			found = new RegExp(tokens[j],'i').test(text2);
		}

		console.log ( "GET - Found room (ID: " + rooms.id + ") " + rooms.name + ": " + found );
		if ( found ) {
			for ( var i = 0; i < json.length; i++ ) {
				var module = json[i];
				var tokens = module.name.split(' ');
				var found = true;
				if (rooms.id == module.roomID){
				for ( var j = 0; found && j < tokens.length; j++ ) {
					found = new RegExp(tokens[j],'i').test(text);
				}

			console.log ( "GET - Found module (ID: " + module.id + ") " + module.name + ": " + found );
			if ( found ) {
				return sayType(module, callback);
			}
		}
		}
		}
	}

	
	console.log('rien trouvé');
	return output( callback, 'je ne sais pas');
}

var set = function (jsonrooms, json, data, callback, config ) {
	console.log("***** SET *****");
	var text = data.module;
	var text2 = data.room;
	var value = data.value;
	
for ( var i = 0; i < jsonrooms.length; i++ ) {
	var rooms = jsonrooms[i];
	var tokens = rooms.name.split(' ');
	var found = true;
	for ( var j = 0; found && j < tokens.length; j++ ) {
			found = new RegExp(tokens[j],'i').test(text2);
		}

		console.log ( "SET - Found room (ID: " + rooms.id + ") " + rooms.name + ": " + found );
		if ( found ) {	
			for ( var i = 0; i < json.length; i++ ) {
				var module = json[i];
				var tokens = module.name.split(' ');
				var found = true;
				if (rooms.id == module.roomID){
				for ( var j = 0; found && j < tokens.length; j++ ) {
					found = new RegExp(tokens[j],'i').test(text);
				}

			console.log ( "SET - Found (ID: " + module.id + ") " + module.name + ": " + found );
			if ( found ) {
				if ( data.request == "set") {
					console.log('module action');
					var http = require('http');
					var options = {
					hostname: config.ip,
					port: 80,
					path: '/api/callAction?deviceID='+module.id+"&name="+get_value(module,value),
					auth: config.login + ':' + config.password
					};
					console.log (options.path);
				} else {
				console.log('run scene');
					var http = require('http');
					var options = {
					hostname: config.ip,
					port: 80,
					path: '/api/sceneControl?id='+module.id+"&14&action=start",
					auth: config.login + ':' + config.password
					};
			}

			
			http.get(options, function(res) {
					var buffer = '';
					res.on('data', function (chunk) {
							buffer += chunk;
						});
					
					res.on('end', function(){
						setTimeout((function() {				
						if ( data.request == "set") {
						get_rooms( get, data, callback, config );
						} else {
						output(callback, "fait");
						}
						}), 500);
					});
				}).on('error', function(e) {
					output(callback, "Une erreur s'est produite: " + e.message);
				});
			
			return 
		}
	}
	}
	}
	}

	console.log('rien trouvé');
	return output( callback, 'vous pouvez répéter la question');
}
			
var get_value = function ( module, value ) {
	console.log("get_value() TYPE: " + module.type);
	switch ( module.type ) {
		case 'com.fibaro.binarySwitch':
		case 'com.fibaro.FGWP101':
			return (value == 'false'? "turnOff": "turnOn");
			break;
		case 'com.fibaro.multilevelSwitch':
		if ( value == 'true' || value == 'false') {
			return 'setValue&arg1=' + (value == 'false'? 0: 99);
		} else {
			return 'setValue&arg1=' + value;
			break;
		}
		case 'com.fibaro.FGR221':
		case 'com.fibaro.FGRM222":
		if ( value == 'true' || value == 'false') {
			return 'setValue&arg1=' + (value == 'false'? 0: 99);
		} else {
			return 'setValue&arg1=' + value;
			break;
		}
	}
}

var sayType = function ( module, callback ) {
	console.log("sayType() TYPE: " + module.type);
	switch ( module.type ) {
		case 'com.fibaro.temperatureSensor':
			output (callback, 'la ' + module.name + ' est de ' + module.properties.value + get_unit(module));
			break;
		case 'com.fibaro.binarySwitch':
		case 'com.fibaro.FGWP101':
			var string = module.name + " est " + (module.properties.value == 'false'? ' éteint': ' allumé');
			if (module.properties.valueSensor && module.properties.valueSensor !="") 
				string += ' et la consommation est de ' + returnString(module.properties.valueSensor,".",",") + get_unit(module);
			output (callback, string);
			break;
		case 'com.fibaro.multilevelSwitch':
			output (callback, module.properties.value == '0'? 'c\'est éteint': 'c\'est allumé à ' + module.properties.value + 'pour cent');
			break;
		case 'com.fibaro.humiditySensor':
			output (callback, 'le taux d\'humidité est de ' + module.properties.value + get_unit(module));
			break;
		case 'com.fibaro.lightSensor':
			output (callback, 'la ' + module.name + ' est de ' + module.properties.value + get_unit(module));
			break;
		case 'virtual_device':
			output (callback, 'test');
			break;
		case 'com.fibaro.motionSensor':
			output (callback, (module.properties.value == '0'? ' pas de mouvements sur ': ' detection présence sur') + module.name );
			break;
		case 'com.fibaro.seismometer':
			output (callback, 'le valeur du ' + module.name + ' est de ' + module.properties.value + get_unit(module));
			break;
		default:
		saybaseType(module, callback);
	}
}

var saybaseType = function ( module, callback ) {
	console.log("saybaseType() TYPE: " + module.baseType);
	switch ( module.baseType ) {
		case 'com.fibaro.doorWindowSensor':
			output (callback, 'la ' + module.name + (module.properties.value == '0'? ' est fermé': ' est ouvert '));
			break;
		case 'com.fibaro.FGR221':
			output (callback, module.name + (module.properties.value == '0'? ' est fermé': ' est ouvert '));
			break;
		case 'com.fibaro.smokeSensor':
			output (callback, module.name + (module.properties.value == '0'? ' est fermé': ' est ouvert '));
			break;	
		case 'com.fibaro.floodSensor':
			output (callback, module.name + (module.properties.value == '0'? ' est fermé': ' est ouvert '));
			break;	
		default:
		output(callback, "Je ne peux pas exécuter cette action");
	}
}

var get_unit = function ( module ) {
var unit = module.properties.unit;
if (unit == "")
unit = module.properties.unitSensor
	switch ( unit ) {
		case 'W':
			return ' watt';
		case '%':
			return ' pour cent';
		case 'C':
			return ' degrés';
		case 'F':
			return ' degrés';
		case 'Lx':
			return ' Lux';
		default:
			return ' ';
	}
}

var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}

var update = function(jsonrooms, json, data, callback, config){
	console.log("***** UPDATE  *****");

	var fs   = require('fs');
	var file = __dirname + '/homecenter2.xml';
	var xml  = fs.readFileSync(file,'utf8');
  
	var replace  = '§ -->\n';
	replace += '  <one-of>\n';
					
		for ( var i = 0; i < json.length; i++ ) {
			var module = json[i];
			var tokens = module.name.split(' ');
			replace += '    <item>'+module.name+'<tag>out.action.module="'+module.name+'"</tag></item>\n';
			console.log('ajout de : ' + module.name);
						
		}
	replace += '  </one-of>\n';
	replace += '<!-- §';
	
		var replace2  = '@ -->\n';
	replace2 += '  <one-of>\n';
					
		for ( var i = 0; i < jsonrooms.length; i++ ) {
			var module = jsonrooms[i];
			var tokens = module.name.split(' ');
			replace2 += '    <item>'+module.name+'<tag>out.action.room="'+module.name+'"</tag></item>\n';
			console.log('ajout de : ' + module.name);
						
		}
	replace2 += '  </one-of>\n';
	replace2 += '<!-- @	';
						
	var regexp = new RegExp('§[^§]+§','gm');
	var regexp2 = new RegExp('@[^@]+@','gm');
	var xml    = xml.replace(regexp,replace);
	xml    = xml.replace(regexp2,replace2);
	
	fs.writeFileSync(file, xml, 'utf8');
	fs.writeFileSync(file, xml, 'utf8');
	
	var file = __dirname + '/portlet.html';
	var xml  = fs.readFileSync(file,'utf8');
  
	var replace  = '§ -->\n';
	replace += '<BR>nombre de modules = <b>'+json.length+'</b></BR>\n';
	replace += 'nombre de pieces = <b>'+jsonrooms.length+'</b></BR>\n';
	replace += '<!-- §';
						
	var regexp = new RegExp('§[^§]+§','gm');
	var xml    = xml.replace(regexp,replace);
	fs.writeFileSync(file, xml, 'utf8');
	fs.writeFileSync(file, xml, 'utf8');
		
  callback({ 'tts' : 'j\'ai trouvé ' + json.length + ' modules et ' + jsonrooms.length + ' pieces'});
  console.log('j\'ai trouvé ' + json.length + ' modules et ' + jsonrooms.length + ' pieces');

}

var returnString = function (data, stringtoreplace, word) {
var str = data;
str = str.replace(stringtoreplace,word);
//console.log('return: ' + str);
return str;
}

var status = function (config) {	
	var config = config.modules.homecenter2;
	var http = require('http');
	var options = {
	  hostname: config.ip,
	  port: 80,
	  path: '/api/devices',
	  auth: config.login + ':' + config.password
	};

	http.get(options, function(res) {
			res.on('data', function (chunk) {
				});
			
			res.on('end', function(){
			
						console.log("alive");
			status = 'alive';
				});
		}).on('error', function(e) {
		console.log("dead");
				status = 'dead';
		});
	return status;	
}

exports.status  = status;

exports.action = function(data, callback, config){
	console.log('##### Home Center 2 #####');

var config = config.modules.homecenter2;

	switch (data.request)
	{
	case 'set':
	get_modules( set, data, callback, config );
	break;
	case 'get':
	get_modules( get, data, callback, config );
	break;
	case 'launch':
	get_modules( set, data, callback, config );
	break;
	case 'update':
	get_modules(update, data, callback, config );
	break;
	default:
	output(callback, "Une erreur s'est produite: ");
	}
}

var get_modules = function ( action, data, callback, config ) {
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
					get_scenes(json, action, data, callback, config);
				});
		}).on('error', function(e) {
			output(callback, "Une erreur s'est produite: " + e.message);
		});
		
}

var get_scenes = function ( json, action, data, callback, config ) {
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
					action(json, data, callback, config);
				});
		}).on('error', function(e) {
			output(callback, "Une erreur s'est produite: " + e.message);
		});
}

var get = function ( json, data, callback, config) {
	console.log("***** GET *****");
	var text = data.module;

	for ( var i = 0; i < json.length; i++ ) {
		var module = json[i];
		var tokens = module.name.split(' ');
		var found = true;
		for ( var j = 0; found && j < tokens.length; j++ ) {
			found = new RegExp(tokens[j],'i').test(text);
		}

		console.log ( "Found (" + i + ") " + module.name + ": " + found );
		if ( found ) {
			return say(module, callback);
		}
	}
	
	console.log('rien trouvé');
	return output( callback, 'je ne sais pas');
}

var set = function ( json, data, callback, config ) {
	console.log("***** SET *****");
	var text = data.module;
	var value = data.value;
	
	for ( var i = 0; i < json.length; i++ ) {
		var module = json[i];

		var tokens = module.name.split(' ');
		var found = true;
		for ( var j = 0; found && j < tokens.length; j++ ) {
			found = new RegExp(tokens[j],'i').test(text);
		}

		console.log ( "Found (" + i + ") " + module.name + ": " + found );
		if ( found ) {
			if ( data.request == "set") {
						console.log('module action');
					var http = require('http');
					var options = {
					hostname: config.ip,
					port: 80,
					path: '/api/callAction?deviceID='+module.id+"&name=setValue&arg1="+get_value(module,value),
					auth: config.login + ':' + config.password
					};
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
						get_modules( get, data, callback, config );
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

	console.log('rien trouvé');
	return output( callback, 'vous pouvez répéter la question');
}
			
var get_value = function ( module, value ) {
	switch ( module.type ) {
		case 'binary_light':
			return (value == 'false'? 0: 1);
			break;
		case 'dimmable_light':
		if ( value == 'true' || value == 'false') {
		return (value == 'false'? 0: 99);
		} else {
			return value;
			break;
		}
	}
}

var say = function ( module, callback ) {
	switch ( module.type ) {
		case 'temperature_sensor':
			output (callback, 'la température est de ' + module.properties.value + get_unit(module));
			break;
		case 'binary_light':
			output (callback, "c'est " + (module.properties.value == '0'? ' éteint': ' allumé'));
			break;
		case 'dimmable_light':
			output (callback, module.properties.value == '0'? 'c\'est éteint': 'c\'est allumé à ' + module.properties.value + 'pourcent');
			break;
		case 'humidity_sensor':
			output (callback, 'le taux d\'humidité est de ' + module.properties.value + get_unit(module));
			break;
		case 'multi_level_sensor':
			output (callback, 'la valeur est de ' + module.properties.value + get_unit(module));
			break;
		case 'door_sensor':
			output (callback, module.properties.value == '0'? 'c\'est fermé': 'c\'est ouvert ');
			break;
		case 'virtual_device':
			output (callback, 'test');
			break;
		default:
		output(callback, "Je ne peux pas exécuter cette action");
	}
}

var get_unit = function ( module ) {
	switch ( module.properties.unit ) {
		case 'W':
			return ' watt';
		case '%':
			return ' pourcent';
		case 'C':
			return ' degrés';
		case 'F':
			return ' degrés';
		default:
			return ' ';
	}
}

var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}

var update = function(json, data, callback, config){
	console.log("***** UPDATE  *****");

	if (!data.directory){ 
	console.log('il n\'y a pas de dossier spécifié');
	return false; 
	}

	var fs   = require('fs');
	var file = data.directory + '/../plugins/homecenter2/homecenter2.xml';
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
						
	var regexp = new RegExp('§[^§]+§','gm');
	var xml    = xml.replace(regexp,replace);
	fs.writeFileSync(file, xml, 'utf8');
	fs.writeFileSync(file, xml, 'utf8');
		
  callback({ 'tts' : 'mise a jour de la base terminée'});

}

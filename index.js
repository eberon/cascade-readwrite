'use strict';

var http = require('http');
var url = require('url');
var util = require('util');
var path = require('path');
var soap = require('soap-cascade');
var Promise = require('promise');
var map = require('./operations-asset-map.json');

//var config = require('./client-config.js');


var cascadeClient = function(instance, username, password) {

	var _instance = instance;
	var soapArgs = {
		authentication: {
			'username': username,
			'password': password
		}
	};

    function read(remotePath, type, siteId, siteName) {

		soapArgs.identifier = {
			type: type,
			path: {path: remotePath, siteName: siteName},
			site: siteId
		};

		var soap_client = {};

		return new Promise(function(fulfill, reject) {
			soap.createClient(_instance, function(err, client) {
				soap_client = client;

				soap_client.read(soapArgs, function (err, response) {
					if(err) {
						reject(err);
					} else {
						if(type == "file") {
							fulfill(new Buffer(response.readReturn.asset[type][map[type].contentField], 'base64'));	
						} else {
							fulfill(response.readReturn.asset[map[type].return_type][map[type].contentField]);
						}
					}
				});
			});
		});
	}

    function write(remotePath, type, content, siteId, siteName) {

    	console.log(arguments);

    	soapArgs.asset = {};

		soapArgs.asset[map[type].return_type] = {
			name: path.basename(remotePath, path.extname(remotePath)),
			path: remotePath,
			parentFolderPath: path.dirname(remotePath),
			siteId: siteId,
			siteName: siteName,
		};

		if(type == 'file') {
			soapArgs.asset[type][map[type].contentField] = new Buffer(content).toString('base64');	
		} else {
			soapArgs.asset[map[type].return_type][map[type].contentField] = content;	
		}

		var soap_client = {};

		return new Promise(function(fulfill, reject) {
			soap.createClient(_instance, function(err, client) {
				soap_client = client;

				soap_client.edit(soapArgs, function (err, response) {
					if(err) {
						reject(err)
					} else if(response.editReturn.success != 'true') {
						reject(response.editReturn.message);
					}
					fulfill(response.editReturn.success)
				});
			});
		});
	}

	return {
    	read: read,
    	write: write
    };
}

module.exports = cascadeClient;

exports.cascadeClient = cascadeClient;


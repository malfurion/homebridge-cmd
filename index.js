var Service, Characteristic;
var exec = require("child_process").exec;

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-warema", "WAREMA_SHADE", WaremaShadeAccessory);
}


function WaremaShadeAccessory(log, config) {
	this.log = log;

	// url info
	this.open_cmd   = config["open_cmd"];
	this.close_cmd  = config["close_cmd"];
	this.stop_cmd   = config["stop_cmd"];
	this.secs       = config["secs"];
	this.currentState = 100;
	this.name = config["name"];
}

WaremaShadeAccessory.prototype = {

	cmdRequest: function(cmd, callback) {
		exec(cmd,function(error, stdout, stderr) {
				callback(error, stdout, stderr)
			})
	},
	
	stopCmd: function() {
		cmd = this.stop_cmd;
		this.cmdRequest(cmd, function(error, stdout, stderr) {
			if (error) {
				this.log('CMD function failed: %s', stderr);
			} else {
				this.log('CMD function succeeded!');
			}
		}.bind(this));
	}

	setState: function(isOpen, callback) {
		var cmd;
		
		if (isOpen < this.currentState) {
			cmd = this.close_cmd;
			this.log("Closing Window Covering");
			this.currentState = isOpen
			if (isOpen != 0) {
				timeouttime = (this.secs * (this.currentState - isOpen)) / 100;
				this.log(timeouttime);
				setTimeout(stopCmd, timeouttime).bind(this);
			}
		} else {
			cmd = this.open_cmd;
			this.log("Opening Window Covering");
			this.currentState = isOpen
			if (isOpen != 100) {
				timeouttime = (this.secs * (isOpen - this.currentState)) / 100;
				this.log(timeouttime);
				setTimeout(stopCmd, timeouttime).bind(this);
			}
		}

		this.cmdRequest(cmd, function(error, stdout, stderr) {
			if (error) {
				this.log('CMD function failed: %s', stderr);
				callback(error);
			} else {
				this.log('CMD function succeeded!');
				callback();
			}
		}.bind(this));
	},
	
	getState: function(callback) {
		callback(null, this.currentState);
	},
	
	getPosState: function(callback) {
		callback(null, Characteristic.PositionState.STOPPED)
	},

	identify: function(callback) {
		this.log("Identify requested!");
		callback(); // success
	},

	getServices: function() {

		// you can OPTIONALLY create an information service if you wish to override
		// the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "cmd window covering Manufacturer")
			.setCharacteristic(Characteristic.Model, "cmd window covering Model")
			.setCharacteristic(Characteristic.SerialNumber, "cmd window covering Serial Number");

		var windowCoveringService = new Service.WindowCovering(this.name);

		windowCoveringService
			.getCharacteristic(Characteristic.CurrentPosition)
			.on('get', this.getState.bind(this));
			
		windowCoveringService
			.getCharacteristic(Characteristic.PositionState)
			.on('get', this.getPosState.bind(this));
			
		windowCoveringService
			.getCharacteristic(Characteristic.TargetPosition)
			.on('get', this.getState.bind(this));
		
		windowCoveringService
			.getCharacteristic(Characteristic.TargetPosition)
			.on('set', this.setState.bind(this));

		return [windowCoveringService];
	}
};

var Service, Characteristic;
var exec = require("child_process").exec;

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-cmd-windowcovering", "CMD_WINDOWCOVERING", CmdWindowCoveringAccessory);
}


function CmdWindowCoveringAccessory(log, config) {
	this.log = log;

	// url info
	this.open_cmd   = config["open_cmd"];
	this.close_cmd  = config["close_cmd"];
	this.currentState = "opened";
	this.name = config["name"];
}

CmdWindowCoveringAccessory.prototype = {

	cmdRequest: function(cmd, callback) {
		exec(cmd,function(error, stdout, stderr) {
				callback(error, stdout, stderr)
			})
	},

	setState: function(isOpen, callback) {
		var cmd;

		if (isOpen) {
			cmd = this.close_cmd;
			this.log("Closing Window Covering");
			this.currentState = "closed"
		} else {
			cmd = this.open_cmd;
			this.log("Opening Window Covering");
			this.currentState = "opened"
		}

		this.cmdRequest(cmd, function(error, stdout, stderr) {
			if (error) {
				this.log('CMD function failed: %s', stderr);
				callback(error);
			} else {
				this.log('CMD function succeeded!');
				callback();
				this.log(stdout);
			}
		}.bind(this));
	},
	
	getState: function(callback) {
		if (this.currentState == "opened") {
			callback(true);
		} else {
			callback(false);
		}
	},
	
	getPosState: function(callback) {
		callback(Characteristic.PositionState.STOPPED);
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
			.setCharacteristic(Characteristic.Manufacturer, "cmd Manufacturer")
			.setCharacteristic(Characteristic.Model, "cmd Model")
			.setCharacteristic(Characteristic.SerialNumber, "cmd Serial Number");

		var windowCoveringService = new Service.WindowCovering(this.name);

		windowCoveringService
			.getCharacteristic(Characteristic.CurrentPosition)
			.on('set', this.getState.bind(this));
		
		windowCoveringService
			.getCharacteristic(Characteristic.TargetPosition)
			.on('get', this.setState.bind(this));
			
		windowCoveringService
			.getCharacteristic(Characteristic.PositionState)
			.on('getpos', this.getPosState.bind(this));

		return [windowCoveringService];
	}
};

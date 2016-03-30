var cv = require('opencv');
var path = require('path');

var options = {
	debug : true,
	state : {
		pause : false
	},
	fps : 10,
	fps_interval : null,
	camera_width : 680,
	camera_height : 540,
	detect : {
		scale : 1.1,
		min_width : 100,
		min_height : 100
	},
	highlight : {
		color : [0, 255, 0],
		thickness : 2
	}
};
var app = {
	camera : null,
	window : null
}
var methods = {
	
	init_camera : function () {
		var camera, window;
		try {
			camera = new cv.VideoCapture(0);
			window = new cv.NamedWindow('Video', 0);
		} catch (e) {
			if (options.debug) console.log('init_camera: could not start camera.', e);
			return false;
		}
		
		if (options.camera_width !== null) {
			camera.setWidth(options.camera_width);
		}
		if (options.camera_width !== null) {
			camera.setHeight(options.camera_height);
		}
		
		if (options.debug) console.log('init_camera: ', camera); 
		
		app.camera = camera;
		app.window = window;
		//app.stream = camera.toStream();
		
		return true;
	},
	read_camera : function (callback) {
		if (app.camera === null) {
			if (options.debug) console.log('read_camera: camera was not initialized.');
			if (typeof callback === 'function') callback(false);
			return;
		}
		//app.stream.on('data', function (im) {
		
		app.camera.read(function (error, im) {	
			if (error) {
				if (options.debug) console.log('read_camera: error while reading camera');
				if (typeof callback === 'function') callback(false);
				return;
			}
			
			if (im.width() < 1 || im.height() < 1) {
				if (options.debug) console.log('read_camera: image has no dimensions');
				if (typeof callback === 'function') callback(false);
				return;
			}
			
			im.detectObject(cv.FACE_CASCADE_2, { scale : options.detect.scale, min : [options.detect.min_width, options.detect.min_height] }, function (error, faces) {
				if (error) {
					if (options.debug) console.log('read_camera: error while detecting objects');
					if (typeof callback === 'function') callback(false);
					return;
				}
				
				//im.convertGrayscale();
				
				im.rectangle([0, 0], [options.detect.min_width, options.detect.min_height], [255, 0, 0], 2);
				
				//if (options.debug) console.log('read_camera: detected #', faces.length);
				
				var face;
				for (var i = 0; i < faces.length; i++) {
					face = faces[i];
					im.rectangle([face.x, face.y], [face.width, face.height], options.highlight.color, options.highlight.thickness);
				}
				
				app.window.show(im);
				//app.window.blockingWaitKey(0, 60000);
				
				if (typeof callback === 'function') callback(true);
			});
		});
		//app.stream.read();
	},
	loop : function () {
		if (!options.fps_interval) {
			if (options.debug) console.log('loop: interval not set');
			return;
		}
		// main loop
		options.loop_timer = setInterval(function () {
			if (options.state.pause) {
				if (options.debug) console.log('loop: paused');
				return;
			}
			
			// read camera until it fails
			methods.read_camera(function (data) {
				if (!data) methods.end_loop();
			});
			
		}, options.fps_to_interval);
	},
	end_loop : function () {
		if (options.loop_timer === null) {
			if (options.debug) console.log('end_loop: timer not set');
			return;
		}
		clearInterval(options.loop_timer);
		options.loop_timer = null;
	},
	recursive_loop : function () {
		methods.read_camera(function (results) {
			if (!results || options.state.pause) {
				return;
			}
			
			methods.recursive_loop();
		});
	}
};

// setup values
options.fps_interval = 1000 / options.fps;
// init camera
if (!methods.init_camera()) {
	return;
}
// run main loop
//methods.loop();
// kill loop
//setTimeout(methods.end_loop, 60000);


methods.recursive_loop();
setTimeout(function () {
	options.state.pause = true;
}, 60000);


//methods.read_camera();







//console.log(cv.FACE_CASCADE);//path.resolve(__dirname));
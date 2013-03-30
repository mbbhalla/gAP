var http = require('http');
var fs = require('fs')   

try {
	var s = http.createServer(function(query, res) {
	var whichfile = '';			
	
	if(query.headers['user-agent'].match(/Android/) || query.headers['user-agent'].match(/iPhone/i) || query.url.match(/fMobile/)) {
		/* M */
		var seed = query.url.split('seed=')[1];
		whichfile = '/mobile.html';
	} else {
		whichfile = '/desktop.html';
	}

    fs.readFile(
        __dirname + whichfile, "utf8",
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading ' + whichfile);
            }

			/* M */
			if(whichfile == '/mobile.html') {
				data = data.replace('<<seed>>', seed);
			}	
            res.writeHead(200);
			res.end(data);
        }   
    );  
});
} catch(e) {
	res.writeHead(500);
	return res.end('Exception ' + e.message);
}

s.listen(9090);

var io = require('socket.io').listen(s);

var desktopsocket = {};
var mappingDesktopSocketWithSeed = {};
var mappingMobileSocketWithSeed = {};

var mobile = io
	.of('/mobile')
	.on('connection', function(socket) {
		console.log('someone on mobile connected with ' + socket.id);

		/* M */
		var seed1 = null;
		socket.on('seed', function(seed) {
			console.log('MOBILE HANDLER : got seed ' + seed['seed']);	
			seed1 = seed['seed'];
			mappingMobileSocketWithSeed[socket.id] = seed1;
		});

		socket.on('MOTIONDATA', function(motion) {
			if(desktopsocket[seed1] != null) {
				desktopsocket[seed1].emit('MOTIONDATA', motion);
			} else {
				console.log('desktopsocket['+ seed1 +'] is null');
			}
		});

		socket.on('disconnect', function() {
			desktopsocket[mappingMobileSocketWithSeed[socket.id]] = null;	
			mappingMobileSocketWithSeed[socket.id] = null;	
			console.log('mobile disconnected');
		});
	});


var desktop = io
	.of('/desktop')
	.on('connection', function(socket) {

		/* M */			
		socket.on('seed', function(seed) {
			console.log('DESKTOP HANDLER : got seed ' + seed['seed']);	
			desktopsocket[seed['seed']] = socket;
			mappingDesktopSocketWithSeed[socket.id] = seed['seed'];
		});

		socket.on('disconnect', function() {
			desktopsocket[mappingDesktopSocketWithSeed[socket.id]] = null;
			mappingDesktopSocketWithSeed[socket.id] = null;
			console.log('desktop disconnected');
		});

		console.log('some1 on desktop connected with ' + socket.id);
	});









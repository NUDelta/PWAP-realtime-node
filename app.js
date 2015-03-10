var http = require('http'),
    fs = require('fs'),
    MongoClient = require('mongodb').MongoClient,
    format = require('util').format
    // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/index.html');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

var new_state_count = 0;
var insert_count = 0;
var mongo_db = null;
var collection = null;
MongoClient.connect('mongodb://phouse:house@ds041851.mongolab.com:41851/pwap', function(err, db) {
	if(err) throw err;
	mongo_db = db;
	collection = mongo_db.collection('test_insert');
	console.log('Mongoclient successfully connected!');
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// Send current time to all connected clients
function sendTime() {
    io.sockets.emit('time', { time: new Date().toJSON() });
    console.log("Emitting time event")
}

// Send current time every 10 secs
setInterval(sendTime, 10000);

// Emit welcome message on connection
io.sockets.on('connection', function(socket) {
	console.log("Client has connected");
    socket.emit('welcome', { message: 'Welcome!' });
    console.log("Emitting welcome event");

    socket.on('newState', function(data) {
    	console.log(data['state']);
    	console.log("new_state received");
    	collection.insert({state:data['state'], rects:data['rects'], mockup:data['mockup_key'], collabtype:data['collab_type'], timestamp:new Date().toJSON() }, function(err, docs) {
    		if(err) throw err;
    		console.log(docs);
            console.log('currently not broadcasting to everyone');
			//socket.broadcast.emit('updated_state', { new_state: data['state'], new_rects: data['rects'] });
			//console.log('updated_state emitted');
    	});
	});
});

app.listen(process.env.PORT || 5000);
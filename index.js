var express = require('express')
  , http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

var firebase = require("firebase");
var config = {
    apiKey: "AIzaSyD_4SRzKsSMzyGJmQlGgyonz3ZOVtd8Ezg",
    authDomain: "node-js-9339b.firebaseapp.com",
    databaseURL: "https://node-js-9339b.firebaseio.com",
    projectId: "node-js-9339b",
    storageBucket: "node-js-9339b.appspot.com"
};

firebase.initializeApp(config);

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

io.on('connection', function(socket) {
	console.log('a user connected');

	socket.on('start firebase', function(){
		// when something new is added to firebase
		// when we start a new connection we want the server to only have 1 listener for firebase
		firebase.database().ref('rooms/' + '123' + '/text').off();
		firebase.database().ref('rooms/' + '123' + '/text').on('child_added', function(snapshot) {
			io.emit('chat message', snapshot.val().msg);
		});
	});

	socket.on('disconnect', function(){
    	console.log('user disconnected');
    	// TODO: add user disconnected message
    	firebase.database().ref('rooms/' + '123' + '/text').off();
  	});

  	socket.on('chat message', function(msg){
  		// Set the data for the room we are in
  		// TODO: just using one room right now need to add more
  		// TODO: add users
		firebase.database().ref('rooms/' + '123' + '/text').push({
			msg: msg,
			user: 'tyler'
		});
	});
});

app.get('/', function(request, response) {
  	response.render('pages/index');
});

app.get('/project02', function(req, res) {
	res.render('pages/project02');
});

app.get('/prove09', function(request, response) {
  	response.render('pages/prove09');
});

app.get('/room', function(req, res) {
	
});

app.get('/mail', function(request, response) {
	var weight = request.query.weight;
	var type = request.query.type;

	var cost = 0;

	if (type == "Letters (Stamped)") {
		if (weight > 3.5) {
			response.render('pages/prove09');
		}

		if (weight <= 1)
			cost = 0.49;
		else if (weight <= 2)
			cost = 0.70;
		else if (weight <= 3)
			cost = 0.91;
		else
			cost = 1.12; 
	}
	else if (type == "Letters (Metered)") {
		if (weight > 3.5) {
			response.render('pages/prove09');
		}

		if (weight <= 1)
			cost = 0.46;
		else if (weight <= 2)
			cost = 0.67;
		else if (weight <= 3)
			cost = 0.88;
		else
			cost = 1.09;
	}
	else if (type == "Large Envelopes (Flats)"){
		if (weight > 13) {
			response.render('pages/prove09');
		}

		if (weight <= 1)
			cost = 0.98;
		else if (weight <= 2)
			cost = 1.19;
		else if (weight <= 3)
			cost = 1.40;
		else if (weight <= 4)
			cost = 1.61;
		else if (weight <= 5)
			cost = 1.82;
		else if (weight <= 6)
			cost = 2.03;
		else if (weight <= 7)
			cost = 2.24;
		else if (weight <= 8)
			cost = 2.45;
		else if (weight <= 9)
			cost = 2.66;
		else if (weight <= 10)
			cost = 2.87;
		else if (weight <= 11)
			cost = 3.08;
		else if (weight <= 12)
			cost = 3.29;
		else
			cost = 3.50;
	} 
	else if (type == "Parcels"){
		if (weight > 13) {
			response.render('pages/prove09');
		}

	
		if (weight <= 4)
			cost = 3;
		else if (weight <= 5)
			cost = 3.16;
		else if (weight <= 6)
			cost = 3.32;
		else if (weight <= 7)
			cost = 3.48;
		else if (weight <= 8)
			cost = 3.64;
		else if (weight <= 9)
			cost = 3.80;
		else if (weight <= 10)
			cost = 3.96;
		else if (weight <= 11)
			cost = 4.19;
		else if (weight <= 12)
			cost = 4.36;
		else
			cost = 4.53;
	}
	else {
		response.render('pages/prove09');
	}

	response.render('pages/mail', {
		weight : weight,
		type   : type,
		cost   : cost
	});
});
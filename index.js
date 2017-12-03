// session help from https://codeforgeek.com/2014/09/manage-session-using-node-js-express-4/

var express    = require('express')
  , http       = require('http');
var session    = require('express-session');
var bodyParser = require('body-parser');
var app        = express();
var server     = http.createServer(app);
var io         = require('socket.io').listen(server);

server.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

// Firebase
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

// for saving user information between pages
app.use(session({ 
	secret: 'rand129sk0-12ks24', 
	cookie: { 
		maxAge: 60000 
	},
	resave: true,
    saveUninitialized: true
}));

// for getting POST data
app.use(bodyParser.urlencoded({
    extended: true
}));


// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Socket.IO
var listeners = [];

io.on('connection', function(socket) {
	console.log('a user connected');

	socket.on('start firebase', function(roomId) {
		// when something new is added to firebase
		// when we start a new connection we want the server to only have 1 listener for firebase
		if (listeners.indexOf(roomId) == -1) {
			listeners[listeners.length] = roomId;
			firebase.database().ref('rooms/' + roomId + '/text').on('child_added', function(snapshot) {
				io.emit(roomId + ' chat message', snapshot.val().msg, snapshot.val().user);
			});
		} else {
			firebase.database().ref('rooms/' + roomId + '/text').once('value').then(function(snapshot) {

				var messages = '{';
				var numMsgs = 0;

				snapshot.forEach(function(childSnapshot) {
					messages += '"' + numMsgs + '": { "user": "' + childSnapshot.val().user + '", "msg": "' + childSnapshot.val().msg + '"}, ';
					numMsgs++;
				});

				messages = messages.substring(0, messages.length - 2);
			 	
			 	messages += '}';

			 	io.emit(roomId + ' check', messages);
			});
		}
	});

	socket.on('disconnect', function(){
    	console.log('user disconnected');
    	// TODO: add user disconnected message
  	});

  	socket.on('chat message', function(roomId, msg, user){
  		// Set the data for the room we are in
		firebase.database().ref('rooms/' + roomId + '/text').push({
			msg: msg,
			user: user
		});
	});
});

/************************************************************
 * Views
 *
 ************************************************************/
app.get('/', function(request, response) {
  	response.render('pages/index');
});

app.get('/project02', function(request, response) {
  	response.redirect('/login');
});

app.get('/room/:roomId', function(req, res) {
	var sessData = req.session;

	if (sessData.username) {
		res.render('pages/room', {
			roomId: req.params.roomId,
			username: sessData.username
		});
	} else {
		res.redirect('/login');
	}
});

// Users Login page
app.get('/login', function(req, res) {
	sessData = req.session;

	if (sessData.username) {
		res.redirect('/user_rooms');
	} else {
		res.render('pages/login');
	}
});

// page for creating a new user
app.get('/create_user', function(req, res) {
	sessData = req.session;

	if (sessData.username) {
		res.redirect('/user_rooms');
	} else {
		res.render('pages/create_user');
	}
});

// displays all rooms that a user has joined
app.get('/user_rooms', function(req, res) {
	sessData = req.session;

	if (sessData.username) {
		res.render('pages/user_rooms', { 
			username: sessData.username, 
			rooms: sessData.rooms 
		});
	} else {
		res.redirect('/login');
	}
});

/************************************************************
 * Commands
 *
 ************************************************************/

// POST that logs users in
// redirects to /user_rooms on success, and /login on fail
// TODO: add errors
app.post('/cmd_login', function(req, res) {
	sessData = req.session;

	firebase.database().ref('users/' + req.body.username).once('value').then(function(snapshot) {
		if (snapshot.val() != null) {
			if (snapshot.val().password == req.body.password) {
				var rooms = [];

				if (snapshot.val().rooms != null) {
					snapshot.val().rooms.forEach(function (room) {
						rooms.push(room);
					});
				}

				sessData.rooms = rooms;
				sessData.username = req.body.username;

				res.redirect('/user_rooms');
			} else {
				res.redirect('/login');
			}
		} else {
			res.redirect('/login');
		}
	});
});

// logs a user out
// redirects to /login
app.get('/cmd_logout', function(req, res) {
	req.session.destroy(function(err) {
		if(err) {
			console.log(err);
		} else {
		  	res.redirect('/login');
		}
	});
});

// POST for creating a new user
// redirects to /user_rooms on success, and /login on fail
// TODO: add errors
app.post('/cmd_create_user', function(req, res) {
	sessData = req.session;
	
	if (sessData.username) {
		res.redirect('/user_rooms');
	} else {
		firebase.database().ref('users/' + req.body.username).once('value').then(function(snapshot) {

			if (snapshot.val() == null) {
				firebase.database().ref('users/' + req.body.username).set({
					password: req.body.password
				});
				sessData.username = req.body.username;
				res.redirect('/user_rooms');
			} else {
				res.redirect('/create_user');
			}
		});
	}
});

// POST create a new room for the user that is 
app.post('/cmd_create_room', function(req, res) {
	sessData = req.session;

	if (sessData.username) {
		var d = new Date();
		var newRoom = randString();

		firebase.database().ref('rooms/' + newRoom + '/text').push({
				msg: sessData.username + ' started room ' + d.getMonth() + '/' + d.getDay() + '/' + d.getYear(),
				user: sessData.username
		});

		firebase.database().ref('users/' + sessData.username + '/rooms').orderByKey().limitToLast(1).once('value').then(function(snapshot) {
			json = {};
			found = false;
			snapshot.forEach(function(data) {
				found = true;
				json[parseInt(data.key) + 1] = newRoom;
			});

			if (found == false) {
				json[1] = newRoom;
			}
			
			firebase.database().ref('users/' + sessData.username + '/rooms').update(json);
		});
		
		
		res.redirect('/room/' + newRoom);
	} else {
		res.redirect('/login');
	}
});

// POST create a new room for the user that is 
app.post('/cmd_user_join', function(req, res) {
	sessData = req.session;

});

/************************************************************
 * AJAX calls
 * Ajax stopped working for some reason, i was getting Unresolved Promise errors
 * i looked up Promises and after spending a couple hours trying to solve it i 
 * decided to just use Socket.io to send the message as the ajax call is erroneous
 ************************************************************/

// POST used as an AJAX call from /room/:roomId to get all chat messages for that room
app.post('/messages/:roomId', function(req, res) {
	var roomId = req.params.roomId;

	// return new Promise(function (resolve, reject) {
		firebase.database().ref('rooms/' + roomId + '/text').once('value').then(function(snapshot) {

			var messages = '{';
			var numMsgs = 0;

			snapshot.forEach(function(childSnapshot) {
				messages += '"' + numMsgs + '": { user: "' + childSnapshot.val().user + '", msg: "' + childSnapshot.val().msg + '"}, ';
				numMsgs++;
			});

			messages = messages.substring(0, messages.length - 2);
		 	
		 	messages += '}';

		 	res.send(messages);
		 	// return resolve;
		});//, function(error) {
		  // The callback failed.
		  //console.error(error);
		  //return reject;
		//});
	// });
});

/************************************************************
 * Functions
 *
 ************************************************************/
 // Function from stackoverflow https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
 var randString = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

/************************************************************
 * Other Assignments
 *
 ************************************************************/

app.get('/prove09', function(request, response) {
	response.render('pages/prove09');
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
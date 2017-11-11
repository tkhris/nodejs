var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  	response.render('pages/index');
});

app.get('/prove09', function(request, response) {
  	response.render('pages/prove09');
});

app.get('/mail/:weight:type', function(request, response) {
	var weight1 = { weight : weight, Content : "content " +weight };
	var type1 = { type : type, Content : "content " +type };
  	console.log("weight:", weight1);
  	console.log("type:", type1);
});

app.listen(app.get('port'), function() {
  	console.log('Node app is running on port', app.get('port'));
});

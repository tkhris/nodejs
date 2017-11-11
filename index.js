var express = require('express');
var app = express();
var form = require('express-form'),
var field = form.field;

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

app.get('/mail', 
	form(
	    field("weight").trim().required(),
	    field("type").trim().required(),
	),
function(request, response) {
  console.log("weight:", request.form.weight);
  console.log("type:", request.form.type);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

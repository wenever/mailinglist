var express = require('express');
var app = express();
var port = process.env["PORT"];
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//logging middleware
app.use(function(req, res, next){
	console.log("Request at ", req.path);
	next();
})

app.get("/", function (request, response) {
	response.send("<h1>Hello World!</h1>");
});

app.listen(port);
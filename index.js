var express = require('express');
var app = express();
var pg = require("pg");
var port = process.env["PORT"];
var bodyParser = require('body-parser');
var conString = process.env["DATABASE_URL"];
var db; 

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

pg.connect(conString, function(err, client) {
	db = client;
})

//logging middleware
app.use(function(req, res, next){
	console.log("Request at ", req.path);
	next();
})

app.get("/", function (request, response) {
});

app.get("/users", function(request, response) {
	db.query("SELECT email FROM users", function (err, results) {
		if (err){
			response.status(500).send(err);
		} else {
			console.log(db);
			response.send(results.rows);
		}
	});
});

//Respond to POST requests
app.post("/submit", function (request, response, next) {
	console.log(request.body);
	var emailAddress = request.body.email;
	if (isValidEmailAddress(emailAddress)){
			db.query("INSERT INTO users (email, last_email_sent) VALUES ($1, $2)", 
				[emailAddress, null], function(err, result) {
					if (err){
						res.status(500).sent(err);
					}
					else {
						res.send(result);
					}

			});
	}
	response.end("Invalid email address!");
});

function isValidEmailAddress(email){
	var regex = /^[\w+.]+@[a-z0-9\-.]+\.[a-z]{2,6}+$/;
 	return regex.test(email);
}

app.listen(port);
var express = require('express');
var app = express();
var pg = require("pg");
var port = process.env["PORT"];
var bodyParser = require('body-parser');
var conString = process.env["DATABASE_URL"];
var ejs = require('ejs');
var mailer = require("./mailer.js");

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill("MANDRILL_API");
var db;

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/static'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var cron = require('cron');
var cronJob = cron.job("0 */1 * * * *", function(){
    mailer(db);
    console.info('cron job completed');
}); 
cronJob.start();

pg.connect(conString, function(err, client) {
	  db = client;
	  if (err) {
	    console.log(err);
	  } else {
	  	mailer(client);
	  }
})

//logging middleware
app.use(function(req, res, next){
	console.log("Request at ", req.path);
	next();
})

app.get("/", function (request, response) {
});

app.get("/users", function(request, response) {
	db.query("SELECT * FROM users", function (err, results) {
		if (err){
			response.status(500).send(err);
		} else {
			console.log(results.rows);
			response.render("userlist", 
				{"users": results.rows}, function(err, html){
					if (err){
						console.log(err);
					}
				console.log(html);
				response.send(html);
			});
		}
	});
});

//Respond to POST requests
app.post("/submit", function (request, response, next) {
	console.log(request.body);
	var emailAddress = request.body.email;
	if (isValidEmailAddress(emailAddress)){
			db.query("INSERT INTO users (email, last_email_sent, sequence) VALUES ($1, null, 'Q1')", 
				[emailAddress], function(err, result) {
					if (err){
						response.status(500).send(err);
					}
					else {
						console.log(result);
						response.send("inserted " + emailAddress);
					}

			});
	}
	else {
		response.end("Invalid email address!");
	}
});

function isValidEmailAddress(email){
	return true;
}

app.listen(port);
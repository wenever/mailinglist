
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('MANDRILL_API');
var fs = require('fs');
var db;


function sendQueuedMail(database){
	db = database;
	console.log('sendQueuedMail ' + db);
	db.query("SELECT * FROM users WHERE sequence like 'Q%';", function(err, result) {
		if (err){
			console.log(err);
		} else {
			sendUserMail(result.rows);
		}
	});
	queueMail();
}

//flip s to q when proper intervals happen
function queueMail(){
	console.log("looking for queue mail");
	db.query("SELECT email FROM users WHERE sequence = 'S1' and last_email_sent <= now() - interval '1 day';", 
		function(err, result) {
			var emailArray = [];

			if (err){
				console.log(err);
			} 
			else {
				for(var i = 0; i<result.rows.length; i++) {
					db.query("UPDATE users SET sequence =  'Q2' where email = ($1)", [result.rows[i].email] , 
						function (err, result) {
							if (err) {
								console.log(err);
							}
							console.log("updated");
						});
				}
			}
	});
	db.query("SELECT email FROM users WHERE sequence = 'S2' and last_email_sent <= now() - interval '7 day';", 
		function(err, result) {
			console.log("looking for 7 day " + result.rows.length);
			if (err){
				console.log(err);
			} else {
				for (var i = 0; i<result.rows.length; i++) {
					db.query("UPDATE users SET sequence =  'Q3' where email = ($1)", [result.rows[i].email], 
						function (err, result) {
							if (err) {
								console.log(err);
							}
						});
				}
			}
	});

}

function sendUserMail(users) {
	for (var i = 0; i<users.length; i++){
		var sequence = users[i].sequence;
		var emailNum = sequence[1];

		messageBodyFromSequence(emailNum, function (body){
			var emailArr = [{"email" : users[i].email}];
			console.log("email array: " + emailArr);
			var message = {
				"text" : body,
				"subject" : "email number " + sequence,
				"from_email": "wen@awesome.com",
				"from_name" : "me",
				"to": emailArr
			}

			mandrill_client.messages.send({"message": message, "async": true }, function(result) {
	   	 console.log(result);
				}, function(e) {
	    	// Mandrill returns the error as an object with name and message keys
	    		console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
				});

			updateUsersLastSent(users[i].email, emailNum);

		});
	}	
}

function messageBodyFromSequence(sequence, callback){
	//mandrill_client.messages.send({"message": message, "async": true }, function(result) {
	//  console.log(result);
	var filename = "./mail_templates/email_" + sequence + ".html";
	var messageBody;
	fs.readFile(filename, "utf8", function (err, data) {
		if (err) throw err;
		messageBody = data;
	});

	callback(messageBody);
}

function updateUsersLastSent(email, sequence) {
		db.query("UPDATE users set last_email_sent = now(), sequence = ($1) where email = ($2)", ['S' + sequence, email] ,  function(err, result) {
				if (err){
					console.log(err);
				}
				else{
					console.log("updated " + email + " last sent");
				}
		});
}

module.exports = sendQueuedMail;

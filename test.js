var express = require('express'),
	app = express();

app.get('/test', function(req, res){

	console.log('output!');
	console.log(' ');

	res.send({
		hello: 'test'
	});

});

app.listen(8130);
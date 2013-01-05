var express = require('express'),
		app = express();

var mongo = require('mongoskin');
//	   db = mongo.db('nodejitsu:7bacb9c956687861cc55beac26ea27ce@linus.mongohq.com:10076/nodejitsudb8203195396/which_dev', { safe : false });

//	db.bind('test');
//	db.bind('option');

  var md5 = require('MD5'),
  numeral = require('numeral'),
 gaussian = require('gaussian'),
	    _ = require('underscore')._,
 Backbone = require('backbone');

Test = Backbone.Model.extend({

	idAttribute: "_id",

	initialize: function(){

	},

	get: function (attr, opts) {
		if (typeof this[attr] == 'function')
		{
			return this[attr](opts);
		}

		return Backbone.Model.prototype.get.call(this, attr);
	},

	choose: function (session) {

		var percentage = Math.floor(Math.random() * 101),
			bestOption = this.bestOption(),
			nextBest = this.nextBest(bestOption),
			choice = null,
			totalViews = this.totalViews(),
			gapNeeded = this.gapNeeded(totalViews);

		if (bestOption.pScore && nextBest.pScore && (bestOption.pScore - nextBest.pScore) > gapNeeded) {
			choice = bestOption;
			console.log('decided best option at '+totalViews);
		} else {
			if (this.get('useBest') && percentage > this.get('useBest')) {
				choice = this.random();
			} else {
				choice = this.bestOption();
			}
		}

		return {
			session: session,
			choice: choice.slug
		};

	},

	bestOption: function () {

		var options = this.get('options'),
			maxPScore = 0;

		for (var i = 0; i < options.length; i++) {
			var pScore = new Option(options[i]).pScore(this);
			if (pScore > maxPScore) {
				maxPScore = pScore;
				var bestOption = i;
			}
		}

		if (typeof(bestOption) == 'undefined') {
			return this.random(true);
		}

		return options[bestOption];

	},

	nextBest: function (option) {

		var options = this.without(option.slug),
			maxPScore = 0,
			bestOption = 0;

		for (var i = 0; i < options.length; i++) {
			var pScore = new Option(options[i]).pScore(this);
			if (pScore > maxPScore) {
				maxPScore = pScore;
				bestOption = i;
			}
		}

		return options[bestOption];

	},

	random: function (force) {

		if (!force) {
			var best = this.bestOption(),
				options = this.without(best.slug);
		} else {
			var options = this.get('options');
		}

		var index = Math.floor(Math.random() * options.length)

		return options[index];

	},

	option: function (slug) {

		var options = this.get('options');

		for (var i = 0; i < options.length; i++) {

			if (options[i].slug == slug) {
				return new Option(options[i]);
			}
		}

		return false;
	},

	without: function (slug) {

		var response = [],
			options = this.get('options');

		return _.reject(options, function(option){
			if (option.slug == slug) {
				return option;
			}
		});

	},

	update: function (option) {

		var slug = option.get('slug'),
			options = this.get('options');

		for (var i = 0; i < options.length; i++) {
			if (options[i].slug == slug) {
				options[i] = option.attributes;
			}
		}

		return this;

	},

	totalViews: function () {

		var total = 0,
			options = this.get('options');

		for (var i = 0; i < options.length; i++) {
			total += options[i].views;
		}

		return total;

	},

	gapNeeded: function (views) {

		console.log(100 - (1 * Math.floor(views/100)));

		return 100 - (1 * Math.floor(views/100));

	},

	confidence: function() {

	}

});

Option = Backbone.Model.extend({

	idAttribute: "_id",

	initialize: function() {

	},

	reward: function() {

		this.set('success', this.get('success') + 1);

	},

	viewed: function () {

		this.set('views', this.get('views') + 1);

	},

	rate: function (format) {

		var rate = 0;

		if (this.get('views') != 0) {
			rate = this.get('success') / this.get('views');
		}

		if (format) {
			return numeral(rate).format('0.000%');
		}

		return rate;

	},

	error: function (format) {

		var error = 0;

		if (this.get('views') != 0) {

			var rate = this.rate(),
				views = this.get('views');

			error = Math.sqrt((rate*(1-rate))/views);

		}

		if (format) {
			return numeral(error).format('0.000%');
		}

		return error;

	},

	zScore: function (test) {

		if (!test) {
			return false;
		}

		var sum = 0,
			alternatives = test.without(this.get('slug'));

		for (var i = 0; i < alternatives.length; i++) {
			option = new Option(alternatives[i]);
			var _zScore = (this.rate() - option.rate()) / Math.sqrt(Math.pow(this.error(), 2) + Math.pow(option.error(), 2));
			sum += _zScore;
		}

		return sum * 100;

	},

	pScore: function (test) {

		var zScore = this.zScore(test);

		var cumnormdist = function (z)
		{
			z = z / 100;

			var b1 =  0.319381530,
				b2 = -0.356563782,
				b3 =  1.781477937,
				b4 = -1.821255978,
				b5 =  1.330274429,
				p  =  0.2316419,
				c  =  0.39894228;

			if (z >= 0.0) {
				t = 1.0 / ( 1.0 + p * z );
				return (1.0 - c * Math.exp( -z * z / 2.0 ) * t *
					( t * ( t * ( t * ( t * b5 + b4 ) + b3 ) + b2 ) + b1 )) * 100;
			} else {
				t = 1.0 / ( 1.0 - p * z );
				return ( c * Math.exp( -z * z / 2.0 ) * t *
					( t *( t * ( t * ( t * b5 + b4 ) + b3 ) + b2 ) + b1 )) * 100;
			}
		}

		return cumnormdist(zScore);

	}

});

var allowCrossDomain = function(req, res, next) {

	var splitted = req.headers['referer'].split('/'),
		referer = splitted[0] + '//' + splitted[2];

	console.log(referer);

	res.header('Access-Control-Allow-Origin', referer);
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Session');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.send(200);
	}
	else {
		next();
	}

};

app.configure(function () {
	//app.use(allowCrossDomain);
	app.use(express.static(__dirname + '/public'));
});

app.all('*', function (req, res, next) {

	var auth = req.headers['authorization'];

	console.log(auth);

	return next();

	if (!auth) {

		res.status(403);
		res.send({
			'message' : 'Unauthorized!'
		});

		return false;

	}

	var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

	var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
	var plain_auth = buf.toString();        // read it back out as a string

	//console.log("Decoded Authorization ", plain_auth);

	var creds = plain_auth.split(':');      // split on a ':'
	var username = creds[0];
	var password = creds[1];

	// do authorization here

	/*
	db.collection('user').findOne({ email: username, token: password }, function (item) {
		//console.log(item);
	});
	*/

	return next();

	if (username == 'auth') {
		return next();
	} else {
		res.status(403);
		res.send({
			'message' : 'Unauthorized!'
		});
	}

});

app.get('/awesome', function (req, res) {
	
	res.send({
		'running-here' : 'yuppers'
	});
	
});

app.get('/drop', function (req, res) {

	db.test.drop(function (err) {

		db.collection('options').drop(function (err) {

			res.send({
				test: 'test'
			});

		});

	});

});

app.get('/create', function (req, res) {

	var test = new Test({
		slug: 'test-agent-1',
		useBest: 90,
		options: [
			{
				slug: 'a',
				views: 0,
				success: 0,
				pScore: null
			},
			{
				slug: 'b',
				views: 0,
				success: 0,
				pScore: null
			},
			{
				slug: 'c',
				views: 0,
				success: 0,
				pScore: null
			}
		]
	});

	db.collection('test').insert(test.toJSON(), function () {

		db.collection('test').ensureIndex([['slug', 1]], true, function (err, replies) {

			res.send({
				created: true
			});

		});

	});

	/*

	db.collection('test').ensureIndex([['slug', 1]], true, function (err, replies) {

		res.send({
			created: true
		});

	});

	*/

});

app.get('/:slug/decide', function (req, res) {

	console.log(req.params.slug);

	res.send({

	});

	db.test.findOne({ slug: req.params.slug }, function (err, item) {

		var test = new Test(item),
			rand = Math.floor(Math.random() * 1001),
			time = new Date().getMilliseconds(),
			session = md5.digest_s(item._id+time+rand),
			choice = test.choose(session);

		db.collection('options').insert({
			test: item.id,
			choice: choice.slug,
			session: session
		}, function () {

			db.test.update({ slug: req.params.slug, 'options.slug' : choice.slug }, { $inc: { 'options.$.views' : 1 }}, function (err) {

				res.send(choice);

			});

		});

	});

});

app.get('/:slug/reward/:session', function (req, res) {

	db.collection('options').findOne({ session: req.params.session }, function (err, item) {

		var slug = item.choice;

		db.test.findOne({ id: item.test }, function (err, item) {

			var test = new Test(item);

			var option = test.option(slug);

			db.test.update({ slug: req.params.slug, 'options.slug' : slug }, {
				$inc: { 'options.$.success' : 1 },
				$set: { 'options.$.pScore' : option.pScore(test) }
			}, function (err) {

				db.collection('options').update({
					session: req.params.session
				}, {
					$set: { reward: 1 }
				}, function () {

					res.send({
						'rewarded': true,
					});

				})

			});

		});


	});

});

app.get('/:slug/decide/:options', function (req, res) {

	res.send({
		'slug' : req.params.slug,
		'options' : req.params.options
	});

});

app.listen(8126);
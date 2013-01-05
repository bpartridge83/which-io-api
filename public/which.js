var which = (function () {

	var _v = 1,
		_d = 'http://127.0.0.1:8126'
	_url = function (opts) {

		var url = _d + '/' + opts.key + '/' + opts.method;

		if (opts.val) {
			url += '/' + opts.val;
		}

		return url;

	}

	this.auth = function (account, token) {
		this.account = account;
		this.token = token;
	}

	_cookie = {

		has: function () {

			var cookie = this.get();

			return (cookie != null && cookie != "");

		},

		set: function (val) {

			var date = new Date();

			date.setTime(date.getTime()+(365*24*60*60*1000));

			var expires = "; expires="+date.toGMTString();

			window.document.cookie = "test="+val+expires+"; path=/";

		},

		get: function () {

			var nameEQ = "test=";

			var ca = document.cookie.split(';');

			for (var i = 0; i < ca.length; i++) {

				var c = ca[i];

				while (c.charAt(0) == ' ') {
					c = c.substring(1, c.length);
				}

				if (c.indexOf(nameEQ) == 0) {
					return c.substring(nameEQ.length,c.length);
				}

			}

			return null;

		}

	}

	/**
	 * @constructor
	 */
	var Request = function (config) {

		var xhr = null,
			opts = {
				url: '',
				method: 'GET',
				success: function (data) {

				},
				failure: function (data) {

				}
			}

		for (var attrname in config) {
			opts[attrname] = config[attrname];
		}

		if (typeof XMLHttpRequest !== 'undefined') {

			xhr = new XMLHttpRequest();

		} else {

			var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];

			for (var i = 0, len = versions.length; i < len; i++) {
				try {
					xhr = new ActiveXObject(versions[i]);
					break;
				} catch(e) {}
			}

		}

		var onreadystatechange = function () {

			if (xhr.readyState < 4) {
				return;
			}

			if (xhr.status !== 200) {
				return;
			}

			// all is well
			if (xhr.readyState === 4) {

				if (xhr.status == 200) {
					opts.success(xhr.responseText);
				} else {
					opts.failure(xhr.responseText);
				}

			}
		}

		xhr.withCredentials = true;

		xhr.onreadystatechange = onreadystatechange;

		console.log(opts.account);
		console.log(opts.token);

		xhr.open(opts.method, opts.url, true, opts.account, opts.token);

		if (_cookie.has()) {
			xhr.setRequestHeader("X-Session", _cookie.get());
		}

		this.send = function () {
			xhr.send();
		}

		return this;

	}

	this.decide = function (key) {

		_cookie.set('testing5555');

		var request = new Request({
			url : _url({
				key: key,
				method: 'decide',
				val: null
			}),
			account: this.account,
			token: this.token
		});

		return request.send();

	}

	this.reward = function (key, val) {

		var request = new Request({
			method: 'POST',
			url : _url({
				key: key,
				method: 'reward',
				val: val
			}),
			account: this.account,
			token: this.token
		});

		return request.send();

	}

	return this;

})();
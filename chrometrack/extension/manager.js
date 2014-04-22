
$(document).ready(function () {


	if (!chrome.cookies) {
		chrome.cookies = chrome.experimental.cookies;
	}

	function Timer() {
		this.start_ = new Date();
		this.elapsed = function() {
			return (new Date()) - this.start_;
		}

		this.reset = function() {
			this.start_ = new Date();
		}
	}

	function cookieMatch(c1, c2) {
		return (c1.name == c2.name) && (c1.domain == c2.domain) &&
	(c1.hostOnly = c2.hostOnly) && (c1.path == c2.path) &&
	(c1.secure == c2.secure) && (c1.httpOnly == c2.httpOnly) &&
	(c1.session == c2.session) && (c1.storeId == c2.storeId);
	}

	function sortedKeys(array) {
		var keys = [];
		for (var i in array) {
			keys.push(i);
		}
		keys.sort();
		return keys;

	}

	function select(selector) {
		return document.querySelector(selector);
	}

	//class
	function CookieCache() {
		this.cookies_ = {};

		this.reset = function() {
			this.cookies_ = {};
		}

		this.add = function(cookie) {
			var domain = cookie.domain;
			if (!this.cookies_[domain]) {
				this.cookies_[domain] = [];
			}
			this.cookies_[domain].push(cookie);
		}

		this.remove = function(cookie) {
			var domain = cookie.domain;
			if (this.cookies_[domain]) {
				var i = 0;
				while (i < this.cookies_[domain].length) {
					if (cookieMatch(this.cookies_[domain][i], cookie)) {
						this.cookies_[domain].splice(i, 1);
					} else {
						i++;
					}
				}
				if (this.cookies_[domain].length == 0) {
					delete this.cookies_[domain];
				}
			}
		}
		this.getDomains = function(filter) {
			var result = [];
			sortedKeys(this.cookies_).forEach(function(domain) {
				if (!filter || domain.indexOf(filter) != -1) {
					result.push(domain);
				}
			});
			return result;
		}

		this.getCookies = function(domain) {
			return this.cookies_[domain];
		}
	}

	var cache = new CookieCache();

	function removeAllForFilter() {
		var filter = select("#filter").value;
		var timer = new Timer();
		cache.getDomains(filter).forEach(function(domain) {
			removeCookiesForDomain(domain);
		});
	}

	function removeAll() {
		var all_cookies = [];
		cache.getDomains().forEach(function(domain) {
			cache.getCookies(domain).forEach(function(cookie) {
				all_cookies.push(cookie);
			});
		});
		cache.reset();
		var count = all_cookies.length;
		var timer = new Timer();
		for (var i = 0; i < count; i++) {
			removeCookie(all_cookies[i]);
		}
		timer.reset();
		chrome.cookies.getAll({}, function(cookies) {
			for (var i in cookies) {
				cache.add(cookies[i]);
				removeCookie(cookies[i]);
			}
		});
	}

	function removeCookie(cookie) {
		var url = "http" + (cookie.secure? "s" : "") + "://" + cookie.domain + cookie.path;
		chrome.cookies.remove({"url": url, "name" : cookie.name});

	}

	function removeCookiesForDomain(domain) {
		var timer = new Timer();
		cache.getCookies(domain).forEach(function(cookie) {
			removeCookie(cookie);
		});
	}

	function resetTable() {
		var table = select("#cookies");
		while (table.rows.length > 1) {
			table.deleteRow(table.rows.length - 1);
		}
	}

	var reload_scheduled = false;

	function scheduleReloadCookieTable() {
		if (!reload_scheduled) {
			reload_scheduled=true;
			setTimeout(reloadCookieTable, 250);
		}
	}

	function reloadCookieTable() {
		reload_scheduled = false;
		var filter = select("#filter").value;
		var domains = cache.getDomains(filter);
		select("#filter_count").innerText  =domains.length;
		select("#total_count").innerText = cache.getDomains.length;

		select("#delete_all_button").innerHTML = "";
		if (domains.length) {
			var button = document.createElement("button");
			button.onClick = removeAllForFilter;
			button.innerText = "delete all "+domains.length;
			select("#delete_all_button").appendChild(button);
		}

		resetTable();
		var table = select("#cookies");

		domains.forEach(function(domain) {
			//console.log("Adding cookie for domain: "+domain);
			var cookies = cache.getCookies(domain);
			var row = table.insertRow(-1);
			row.insertCell(-1).innerText = domain;
			var cell = row.insertCell(-1);
			cell.innerText = cookies.length;
			cell.setAttribute("class", "cookie_count");

			var button = document.createElement("button");
			button.innerText = "delete";
			button.onclick = (function(dom) {
				return function() {
					removeCookiesForDomain(dom);
				}
			}(domain));
			var cell = row.insertCell(-1);
			//console.log("added cell:"+cell);
			cell.appendChild(button);
			cell.setAttribute("class", "button");
		});
	}

	function focusFilter() {
		select("#filter").focus();
	}

	function resetFilter() {
		var filter = select("#filter");
		filter.focus();
		if (filter.value.length > 0) {
			filter.value = "";
			reloadCookieTable();
		}
	}

	var ESCAPE_KEY = 27;
	window.onkeydown = function(event) {
		if (event.keyCode == ESCAPE_KEY) {
			resetFilter();
		}
	}



	function listener(info) {
		cache.remove(info.cookie);
		if (!info.removed) {
			cache.add(info.cookie);
		}
		scheduleReloadCookieTable();
	}

	function startListening() {
		chrome.cookies.onChanged.addListener(listener);
	}

	function stopListening() {
		chrome.cookies.onChanged.removeListener(listener);
	}

	function onload() {
		focusFilter();
		var timer = new Timer();
		chrome.cookies.getAll({}, function(cookies) {
			startListening();
			start = new Date();
			for (var i in cookies) {
				cache.add(cookies[i]);
			}
			timer.reset();
			reloadCookieTable();
		});
	}

	document.addEventListener('DOMContentLoaded', function() {
		//onload();
		document.body.addEventListener('click', focusFilter);
		document.querySelector('#remove_button').addEventListener('click', removeAll);
		document.querySelector('#filter_div input').addEventListener('input', reloadCookieTable);
		document.querySelector('#filter_div button').addEventListener('click', resetFilter);
	});

	console.debug("All setup");

	/*
	   $.getJSON("http://localhost:3000/collectionapi/cookies", function(json) {
	   console.debug("Received JSON: "+json);
	   $('#cookieslist').text(JSON.stringify(json));
	   });

*/

	var jqueryCookiesListen = function(info) {
		console.debug("In JQUERY Cookies Listen: "+info.cookie);
		postCookie(info.cookie);
	}

	var postCookie = function(cookie) {
		cookie._id = cookie.domain+"::"+cookie.path+"::"+cookie.name;
		console.debug("Posting Cookie: "+cookie._id);
		var myurl = "http://localhost:3000/collectionapi/cookies";
		var json = JSON.stringify(cookie);
		console.debug(">> Posting Cookie: "+json);
		numCookiesUploaded++;
		$.ajax({
			type: "POST",
			url: myurl,
			contentType: "application/json",
			dataType: "json",
			data: json
		});

	}


	var buildAndPostRequestContext = function(request) {
		console.log("Request Full:"+JSON.stringify(request));
		request.parsedURL = url.parse(request.url);
		chrome.tabs.get(request.tabId, function(tab) {
			request.parentURL = url.parse(tab.url);
			request.title = tab.title;
			request.incognito = tab.incognito;
			console.log("Request in call back:"+JSON.stringify(request));
			postRequest(request);
		});
		return request;
	}

	var postRequest= function(request) {
		//cookie._id = cookie.domain+"::"+cookie.path+"::"+cookie.name;
		var myurl = "http://localhost:3000/collectionapi/requests";
		if (request.url == myurl) return;
		var json = JSON.stringify(request);
		console.debug(">> Posting Request: "+json);
		numRequestsMade++;
		$.ajax({
			type: "POST",
			url: myurl,
			contentType: "application/json",
			dataType: "json",
			data: json
		});

	}

	var numRequestsMade = 0;

	chrome.webRequest.onBeforeRequest.addListener(
			function(info) {
				console.log("Request: "+info.type+": "+info.url);
				if ($("#track-requests").prop('checked')) {
					buildAndPostRequestContext(info);
					$("#num-requests").text(numRequestsMade);
				}

			}, { //filters
				urls: ['http://*/*', 'https://*/*'],
		types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest",  "other"]
		}
	);

	var numCookiesUploaded = 0;

	$("#upload-old-cookies").click(function() {
		$("#upload-old-cookies").prop('disabled', true).val("wait...");
		console.log("Uploading Old Cookies...");
		chrome.cookies.getAll({}, function(cookies) {
			for (var i in cookies) {
				postCookie(cookies[i]);
			}
		});
		$("#num-cookies").text(numCookiesUploaded);
		$("#upload-old-cookies").prop('disabled', true).val("Upload Old Cookies[Single Use Button]");
	});

	chrome.cookies.onChanged.addListener(
			function(info) {
				console.log("Cookie Changed: "+info);
				if ($("#track-cookies").prop("checked")) {
					console.log(">> Uploading Cookie");
					postCookie(info.cookie);
					$("#num-cookies").text(numCookiesUploaded);
				}
			}
			);

});


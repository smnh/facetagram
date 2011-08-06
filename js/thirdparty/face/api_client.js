/*!
 * Face.com Rest API JavaScript Library v1.0.2 (alpha) 
 * http://face.com/
 *
 * Copyright 2010, 
 * Written By Lior Ben-Kereth
 *  
 * v1.0.2 - Add group function. Add detector type param to detection
 * Date: Sun May 06 14:20:18 2010 +0300
 */
function Face_ClientAPI(_apiKey, _apiSecret)
{
	var apiKey = null;
	var apiSecret = null;
	var format = 'json';
	var SUPPORTED_FORMATS = {json: true};

	var EXCEPTION_ARGUMENT_MISSING		= 'Face_ClientAPI Exception: Argument {0} for function {1} is missing';
	var EXCEPTION_ARGUMENT_INVALID		= 'Face_ClientAPI Exception: Argument {0} for function {1} is invalid';
	var EXCEPTION_ARGUMENT_OVER_LIMIT	= 'Face_ClientAPI Exception: Argument {0} for function {1} contains more elements than allowed (got {2}, max is {3})';
	var EXCEPTION_INIT					= 'Face_ClientAPI Exception: Face_ClientAPI not initialized- call init method with your API key';
	var EXCEPTION_FORMAT_NOT_SUPPORTED	= 'Face_ClientAPI Exception: Format not supported ({0})';
		
	var REST_URL = "http://api.face.com/";
	
	if (_apiKey != undefined)
		init(_apiKey, _apiSecret);
	
	// -------------------------------
	// Public Functions
	// -------------------------------
	this.faces_detect = faces_detect;
	this.faces_recognize = faces_recognize;
	this.faces_train = faces_train;
	this.faces_status = faces_status;
	
	this.tags_save = tags_save;
	this.tags_add = tags_add;
	this.tags_remove = tags_remove;
	this.tags_get = tags_get;
	
	this.facebook_get = facebook_get;
	
	this.account_authenticate = account_authenticate;
	this.account_limits = account_limits;
	
	this.init = init;
	this.getApiKey = getApiKey;
	// -------------------------------
	
	function account_authenticate(password, callback)
	{
		var method = "account/authenticate";
		validateInput(password, 'string', 'password', method);
		validateInput(callback, 'function', 'callback', method);
			
		makeRequest(method, {password: password}, callback);
		
		return true;
	}
	
	function account_limits(password, callback)
	{
		var method = "account/limits";		
			
		makeRequest(method, null, callback);
		
		return true;
	}
	
	function faces_detect(urls, callback, options)
	{
		var method = "faces/detect";
		validateInput(urls, 'url', 'url', method);
		validateInput(callback, 'function', 'callback', method);
		
		var params = { urls: urls };
		
		if (typeof options != 'undefined')
		{
			if (!empty(options.detector))	params.detector = options.detector;
		}

		makeRequest(method, params, callback);
		
		return true;
	}

	function faces_recognize(urls, options, callback)
	{
		var method = "faces/recognize";
		validateInput(urls, 'url', 'url', method);
		validateInput(callback, 'function', 'callback', method);
		
		var params = { urls: urls };
		
		if (!empty(options.uids))			params.uids = options.uids;		
		if (!empty(options.namespace))		params.namespace = options.namespace;		
		if (!empty(options.owners_ids))		params.namespace = options.owners_ids;
		if (!empty(options.user_auth))		params.user_auth = options.user_auth;
		if (!empty(options.callback_url))	params.callback_url = options.callback_url;
		if (!empty(options.detector))		params.callback_url = options.detector;
		
		makeRequest(method, params, callback);
		
		return true;
	}
	
	function faces_group(urls, options, callback)
	{
		var method = "faces/group";
		validateInput(urls, 'url', 'url', method);
		validateInput(callback, 'function', 'callback', method);
		
		var params = { urls: urls };
		
		if (!empty(options.uids))			params.uids = options.uids;		
		if (!empty(options.namespace))		params.namespace = options.namespace;		
		if (!empty(options.owners_ids))		params.namespace = options.owners_ids;
		if (!empty(options.user_auth))		params.user_auth = options.user_auth;
		if (!empty(options.callback_url))	params.callback_url = options.callback_url;
		if (!empty(options.detector))		params.callback_url = options.detector;
		
		makeRequest(method, params, callback);
		
		return true;
	}
	
	function faces_train(options, callback)
	{
		var method = "faces/train";
		validateInput(options.uids, 'string', 'uids', method);		
		
		var params = {};
		
		if (!empty(options.uids))			params.uids = options.uids;					
		if (!empty(options.namespace))		params.namespace = options.namespace;
		if (!empty(options.user_auth))		params.user_auth = options.user_auth;
		if (!empty(options.callback_url))	params.callback_url = options.callback_url;
		
		makeRequest(method, params, callback);
		
		return true;		
	}
	
	function faces_status(options, callback)
	{
		var method = "faces/status";
		validateInput(options.uids, 'string', 'uids', method);		
		
		var params = {};
		
		if (!empty(options.uids))			params.uids = options.uids;
		if (!empty(options.namespace))		params.namespace = options.namespace;
		if (!empty(options.user_auth))		params.user_auth = options.user_auth;				
		
		makeRequest(method, params, callback);
		
		return true;		
	}

	function tags_get(options, callback)
	{
		var method = "tags/get";
		validateInput(callback, 'function', 'callback', method);
		
		var params = {};			
		
		if (!empty(options.urls))				params.urls = options.urls;
		if (!empty(options.pids))				params.pids = options.pids;
		if (!empty(options.owner_ids))			params.owner_ids = options.owner_ids;
		if (!empty(options.uids))				params.uids = options.uids;		
		if (!empty(options.together))			params.together = options.together;
		if (!empty(options.filter))				params.filter = options.filter;
		if (!empty(options.order))				params.order = options.order;
		if (!empty(options.limit))				params.order = options.limit;		
		if (!empty(options.namespace))			params.namespace = options.namespace;		
		if (!empty(options.user_auth))			params.user_auth = options.user_auth;
		if (!empty(options.callback_url))		params.callback_url = options.callback_url;
		
		makeRequest(method, params, callback);
		
		return true;
	}
	
	function tags_save(options, callback)
	{
		var method = "tags/save";
		validateInput(options.tids, 'string', 'tids', method);
		
		var params = { tids: options.tids };
		
		if(!empty(options.uid))				params.uid = options.uid;
		if(!empty(options.label))			params.label = options.label;
		
		if(!empty(options.user_auth))		params.user_auth = options.user_auth;
		if(!empty(options.password))		params.password = options.password;		
		
		if ((typeof params.uid == undefined || params.uid == '') && (typeof params.label == undefined || params.label == ''))
			throw EXCEPTION_ARGUMENT_MISSING.replace('{0}', 'uid or label').replace('{1}', method);
		
		makeRequest(method, params, callback);
	}
	
	function tags_add(url, options, callback)
	{	
		var method = "tags/add";
		validateInput(url, 'url', 'url', method);
		validateInput(options.x, 'number', 'x', method);
		validateInput(options.y, 'number', 'y', method);
		validateInput(options.width, 'number', 'width', method);
		validateInput(options.height, 'number', 'height', method);

		var params = {
						url: url,
						x: options.x,
						y: options.y,
						width: options.width,
						height: options.height
					};

		if(!empty(options.uid))				params.uid = options.uid;
		if(!empty(options.pid))				params.pid = options.pid;
		if(!empty(options.label))			params.label = options.label;
		if(!empty(options.owner_id))		params.owner_id = options.owner_id;
		if(!empty(options.tagger_id))		params.tagger_id = options.tagger_id;		

		if(!empty(options.user_auth))		params.user_auth = options.user_auth;		

		if(!empty(options.password))		params.password = options.password;
		
		if ((typeof params.uid == undefined || params.uid == '') && (typeof params.label == undefined || params.label == ''))
			throw EXCEPTION_ARGUMENT_MISSING.replace('{0}', 'uid or label').replace('{1}', method);

		makeRequest(method, params, callback);
	}
	
	function tags_remove(options, callback)
	{
		var method = "tags/remove";
		validateInput(options.tids, 'string', 'tids', method);

		var params = { tids: options.tids };
		
		if (!empty(options.tagger_id))			params.tagger_id = options.tagger_id;		
		if(!empty(options.password))			params.password = options.password;
		if (!empty(options.user_auth))			params.user_auth = options.user_auth;
		
		makeRequest(method, params, callback);
	}
	
	function facebook_get(options, callback)
	{
		var method = "facebook/get";
		validateInput(callback, 'function', 'callback', method);
		
		var params = {};			
		
		if (!empty(options.uids))				params.uids = options.uids;		
		if (!empty(options.limit))				params.limit = options.limit;
		if (!empty(options.together))			params.together = options.together;
		if (!empty(options.filter))				params.filter = options.filter;
		if (!empty(options.order))				params.order = options.order;			
		if (!empty(options.user_auth))			params.user_auth = options.user_auth;	
		
		makeRequest(method, params, callback);
		
		return true;
	}
	
	function init(_apiKey, _apiSecret)
	{
		validateInput(_apiKey, 'string', 'apiKey', 'init');
		apiKey = _apiKey;
        apiSecret = _apiSecret;
	}
	
	function getApiKey()
	{
		return apiKey;
	}
	// -------------------------------
	
	
	// -------------------------------
	// Private Functions
	// -------------------------------
	function makeRequest(method, params, callback)
	{
		if (!apiKey) throw EXCEPTION_INIT;
		
		var sUrl = REST_URL + method + "." + format + "?api_key=" + encodeURIComponent(apiKey) + "&api_secret=" + encodeURIComponent(apiSecret) + "&attributes=all";
		
		if (params != null)
		{
			for (param in params)
				sUrl += "&" + param + "=" + encodeURIComponent(params[param]);
		}
		
		var iRequest = Math.round(Math.random()*10000000);
		
		var sCallback = "jsonp" + iRequest;
		window[sCallback] = function(data){
								document.getElementById("fapir" + iRequest).parentNode.removeChild(document.getElementById("fapir" + iRequest));
								if (typeof callback == "function")
								{
									if (params.urls != undefined)
										callback(params.urls, data);
									else
										callback(data);
								}
							};
		sUrl += "&callback=" + sCallback + "&" + new Date().getTime().toString();        
		
	    var script = document.createElement("script");        
	    script.setAttribute("src", sUrl);
	    script.setAttribute("type","text/javascript");                
	    script.setAttribute("id","fapir"+iRequest);
	    document.body.appendChild(script);
	}
	
	function validateInput(input, type, sInputName, sMethodName)
	{
		var b = true;
		
		if (empty(input))
		{
			throw EXCEPTION_ARGUMENT_MISSING.replace('{0}', sInputName).replace('{1}', sMethodName);
		}
		else
		{
			switch(type)
			{
				case 'string':
					b = !(input.length <= 0)
					break;
				case 'number':
					b = !(input*1 != input || input < 0);
					break;
				case 'url':
					b = !(input.length <= 0);
					break
				case 'function':
					b = !(typeof input != 'function');
					break;
			}
		}
		
		if (!b)
			throw EXCEPTION_ARGUMENT_INVALID.replace('{0}', sInputName).replace('{1}', sMethodName);
		
		return b;
	}
	

	function validateNumberOfParams(input, max, sInputName, sMethodName)
	{
		var num = input.split(",").length;
		if (num > max)
			throw EXCEPTION_ARGUMENT_OVER_LIMIT.replace('{0}', sInputName).replace('{1}', sMethodName).replace('{2}', num).replace('{3}', max);
		return true;
	}
	
	
	function defined(s){ return (typeof s != "undefined" && s != undefined); }
	function empty(s) { return (!defined(s) || s == null || s == ''); }
}

var FaceClientAPI = new Face_ClientAPI();
var faceApiKey = "a0df475a5d288710d95dbbd90e8a730a";
var faceApiSecret = "5a5fa3c3a275f510ad36f683f0d3cddf";

facetagram = window.facetagram || {};

facetagram.Image = function(instagram, face)
{
    var _genderConfidence = 40,
        _faceConfidence = 50,
        _moodConfidence = 30;
    
    return {
        data: {instagram: instagram, face: face},
        hasFace: _hasFace,
        hasFemale: _hasFemale,
        hasMale: _hasMale,
        hasGroup: _hasGroup,
        hasSuprised: _hasSuprised,
        hasAngry: _hasAngry,
        hasHappy: _hasHappy,
        hasSad: _hasSad,
        hasNeutral: _hasNeutral,
        hasGlasses: _hasGlasses,
        getThumbnail: _getThumbnail,
		getLowResImage: _getLowResImage,
        getImage: _getImage,
		id: instagram.id
    };

    function _hasFace()
    {
        return _hasAttribute("face", "true", _faceConfidence);
    };

    function _hasFemale()
    {
        return _hasAttribute("gender", "female", _genderConfidence);
    };

    function _hasMale()
    {
        return _hasAttribute("gender", "male", _genderConfidence);
    };

    function _hasSuprised()
    {
        return _hasAttribute("mood", "suprised", _moodConfidence);
    };

    function _hasAngry()
    {
        return _hasAttribute("mood", "angry", _moodConfidence);
    };

    function _hasHappy()
    {
        return _hasAttribute("mood", "happy", _moodConfidence);
    };

    function _hasSad()
    {
        return _hasAttribute("mood", "sad", _moodConfidence);
    };

    function _hasNeutral()
    {
        return _hasAttribute("mood", "neutral", _moodConfidence);
    };

    function _hasGlasses()
    {
        return _hasAttribute("glasses", "true", _moodConfidence);
    };

    function _hasAttribute(attribute, value, confidence)
    {
        var attr, i=0,
        tags = face.tags,
        len = tags.length;
        
        for (; i<len ; i++)
        {
            attr = tags[i].attributes[attribute];
            if (attr && attr.value === value && attr.confidence >= confidence)
                return true;
        }
        return false;
    };

    function _hasGroup()
    {
        if (_hasFace())
            return face.tags.length > 1;
        return false;
    };

    function _getThumbnail()
    {
        return instagram.images.thumbnail;
    };
	
	function _getLowResImage()
	{
		return instagram.images.low_resolution;
	};
	
    function _getImage()
    {
        return instagram.images.standard_resolution;
    };
}

var InstagramApi = (function(apiKey){
    
    var _location, 
        _minDistance = 500,
        _maxDistance = 5000,
        _distance = _minDistance,
        locations = "https://api.instagram.com/v1/locations/search?callback=?",
        location_images = "https://api.instagram.com/v1/locations/{0}/media/recent/?callback=?";
    
    return {
        get: _get,
        setLocation: _setLocation,
        setDistance: _setDistance,
        setMaxDistance: _setMaxDistance
    };
    
    function _setLocation(location)
    {
        _location = location;
    };

    function _setDistance(distance)
    {
        if (!isNaN(distance))
            distance = Math.max(Math.min(distance, _maxDistance),_minDistance);
    };

    function _setMaxDistance()
    {
        _setDistance(_maxDistance);
    };

    function _get(callback, scope)
    {
        _makeRequest(locations, 
            {lat: _location.coords.latitude, lng : _location.coords.longitude, distance: _distance},
            function(data){
                getLocationImages(data.data, 0, callback, scope);
            }
        );
        return;

        function getLocationImages(locationData, index, callback, scope)
        {
            index = index || 0;
            if (index < locationData.length)
            {
                (function(locationId){
                    
                    var ts = Math.round(new Date().getTime() / 1000);
                    ts=ts-(((86400)*1000));
                    _makeRequest(location_images.replace("{0}", locationId), {min_timestamp : ts}, 
                        function(data){
                            callback.call(scope, data.data);
                            getLocationImages(locationData, ++index, callback, scope);
                        });

                })(locationData[index].id);
            }
        };
    };

    function _makeRequest(url, options, callback, scope)
    {
        options = options || {};
        options['client_id'] = apiKey;
        $.getJSON(url, options, function(data) {callback.call(scope, data);});
    }
    
})("8de4638ef797472989d88b1133f9203a");


FaceClientAPI.init(faceApiKey, faceApiSecret);

facetagram.api = (function(){
    
    return {get: _get};
    
    function _get(location, callback, scope) 
    {
        InstagramApi.setMaxDistance();
        InstagramApi.setLocation(location);
        InstagramApi.get(function(images){
            _process(images, callback, scope);
        });
    };

    function _process(images, _callback, _scope)
    {
        var urls = [];
        var map = {};
        if (images && images.length)
        {
			for (i = 0; i < images.length; i++)
            {
				urls.push(images[i].images.standard_resolution.url);
                map[images[i].images.standard_resolution.url] = images[i];
            }
            
            _makeFaceRequest(urls, map, _callback, _scope)
            return;

            function _makeFaceRequest(urls, map, callback, scope)
            {
                if (urls.length)
                {
                    var partial;
                    if (urls.length >= 20)
                        partial = urls.splice(0,20);
                    else
                    {
                        partial = urls;
                        urls = [];
                    }
                    (function(partial){
                    
                        FaceClientAPI.faces_detect(partial, function(url, data){
                            if (data.status == "success")
                            {
                                var images = [];
                                for (var i=0,len=data.photos.length ; i<len ; i++)
                                    images.push(new facetagram.Image(map[data.photos[i].url], data.photos[i]));

                                callback.call(scope, images);
                            }
                            _makeFaceRequest(urls, map, callback, scope);
                        });

                    })(partial);
                }
            };

        }
    };

})();


facetagram.ImageRepository = (function(){
    
    var _locations = [{coords:{latitude:32.066157, longitude:34.777821}}, //tel-aviv
        {coords:{latitude:32.8155556, longitude:34.9891667}}, //haifa
        {coords:{latitude:32.068423, longitude:34.824787}}, //ramat gan
        {coords:{latitude:32.0431, longitude:34.7722}}];//, //holon
//        {coords:{latitude:37.775, longitude:-122.4183333}}, //san francisco
//        {coords:{latitude:34.0522222, longitude:-118.2427778}}, //los angeles
//        {coords:{latitude:40.7141667, longitude:-74.0063889}}, //new york
//        {coords:{latitude:48.856614, longitude:2.352222}}, //paris
//        {coords:{latitude:22.396428, longitude:114.109497}}, //hong kong
//        {coords:{latitude:35.689488, longitude:139.691706}}, //tokio
//        {coords:{latitude:55.755786, longitude:37.617633}}, //moscow
//        {coords:{latitude:51.500152, longitude:-0.126236}} //london
//    ];
    
    var _images = [];
	var _downloadedImages = {};
    var _listeners = [];
    var _initialized = false;

    _startPolling();

    return {
        
        getImages: _getImages,
        subscribe: _subscribe,
        unsubscribe: _unsubscribe
    };

    function _getImages()
    {
        return _images;
    };

    function _subscribe(listener, scope)
    {
        if (typeof (listener) === 'function')
            _listeners.push({ listener: listener, scope: scope });
    };

    function _unsubscribe(listener, scope)
    {
        for (var i=0,len=_listeners.length ; i<len ; i++)
        {
            if (_listeners[i].listener === listener && _listeners[i].scope === scope)
            {
                _listeners.splice(i,1);
                return;
            }
        }
    };

    function _startPolling()
    {
        InstagramApi.setMaxDistance();
        facetagram.locationHelper.get(function(location){
            
            if (!_initialized)
            {
                _initialized = true;

                if (location)
                    _locations = [location].concat(_locations);

                _makeRequest();
            }
        });
    };
	
	function _addImages(images)
	{
		
		for (var i=images.length-1 ; i>=0 ; i--)
		{
			var id = images[i].id;
			if (_downloadedImages[id])
				images[i].splice(i,1);
			else
				_downloadedImages[id] = 1;
		}
		
		_images = _images.concat(images);
	};
	
    function _makeRequest(index)
    {
        index = index || 0;
        if (index < _locations.length)
        {
            (function(index){
                    
                facetagram.api.get(_locations[index], function(images){
                    _addImages(images);
                    _notify();
                    _makeRequest(++index);
                });

            })(index);
        }
    };

    function _notify()
    {
        var listener;
        for (var i=0,len=_listeners.length ; i<len ; i++)
        {
            listener = _listeners[i];
            listener.listener.call(listener.scope, _getImages());
        }
    };

})();
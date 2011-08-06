var instagramApiKey = "8de4638ef797472989d88b1133f9203a";
var faceApiKey = "a0df475a5d288710d95dbbd90e8a730a";
var faceApiSecret = "5a5fa3c3a275f510ad36f683f0d3cddf";

facetagram = window.facetagram || {};

facetagram.Image = function(instagram, face)
{
    var _genderConfidence = 40,
        _faceConfidence = 50;
    
    return {
        data: {instagram: instagram, face: face},
        hasFace: _hasFace,
        hasFemale: _hasFemale,
        hasMale: _hasMale,
        getThumbnail: _getThumbnail
    };

    function _hasFace()
    {
        var faceAttributes, i=0,
            tags = face.tags,
            len = tags.length;
        
        for (; i<len ; i++)
        {
            faceAttributes = tags[i].attributes.face;
            if (faceAttributes.value === "true" && faceAttributes.confidence >= _faceConfidence)
                return true;
        }

        return false;
    };

    function _hasFemale()
    {
        return _hasGender("female");
    };

    function _hasMale()
    {
        return _hasGender("male");
    };

    function _hasGender(gender)
    {
        if (_hasFace())
        {
            var genderAttributes, i=0,
            tags = face.tags,
            len = tags.length;
        
            for (; i<len ; i++)
            {
                genderAttributes = tags[i].attributes.gender;
                if (genderAttributes && genderAttributes.value === gender && genderAttributes.confidence >= _genderConfidence)
                    return true;
            }
        }
        return false;
    };

    function _getThumbnail()
    {
        return instagram.images.thumbnail;
    }
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
                    _makeRequest(location_images.replace("{0}", locationId), /*{min_timestamp : -ts*100}*/null, 
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
            
            _makeFaceRequest(urls, map, _callback, _scope, []);
            return;

            function _makeFaceRequest(urls, map, callback, scope, images)
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
                                for (var i=0,len=data.photos.length ; i<len ; i++)
                                    images.push(new facetagram.Image(map[data.photos[i].url], data.photos[i]));
                            }
                            _makeFaceRequest(urls, map, callback, scope, images);
                        });

                    })(partial);
                }
                else
                    callback.call(scope, images);
            };

        }
    };

})();


facetagram.ImageRepository = (function(){
    
    var _locations = [{coords:{latitude:32.066157, longitude:34.777821}}, //tel-aviv
        {coords:{latitude:32.8155556, longitude:34.9891667}}, //haifa
        {coords:{latitude:32.068423, longitude:34.824787}}, //ramat gan
        {coords:{latitude:32.0431, longitude:34.7722}}, //holon
        {coords:{latitude:37.775, longitude:-122.4183333}}, //san francisco
        {coords:{latitude:34.0522222, longitude:-118.2427778}}, //los angeles
        {coords:{latitude:40.7141667, longitude:-74.0063889}} //new york
    ];
    
    var _images = [];
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

    function _makeRequest(index)
    {
        index = index || 0;
        if (index < _locations.length)
        {
            (function(index){
                    
                facetagram.api.get(_locations[index], function(images){
                    _images = _images.concat(images);
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
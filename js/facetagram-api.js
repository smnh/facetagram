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
        setDistance: _setDistance
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

    function _get(callback, scope)
    {
//        var ts = Math.round(new Date().getTime() / 1000);
//        ts=ts-(((86400)*1000));
//        _makeRequest("https://api.instagram.com/v1/media/search?callback=?", {lat: _location.coords.latitude, lng : _location.coords.longitude, distance: _distance, min_timestamp : ts},
//        function(data)
//        {
//            callback.call(scope, data.data);
//        });
//        
//        return;
        _makeRequest(locations, 
            {lat: _location.coords.latitude, lng : _location.coords.longitude, distance: _distance},
            function(data){
                for (var i=0,len=data.data.length ; i<len ; i++)
                {
                    var ts = Math.round(new Date().getTime() / 1000);
                    ts=ts-(((86400)*1000));
                    _makeRequest(location_images.replace("{0}", data.data[i].id), {min_timestamp : ts}, 
                        function(data){
                            callback.call(scope, data.data);
                        }
                    );
                }
            }
        );
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
    
    function _get(callback, scope) 
    {
	    facetagram.locationHelper.get(function(position){
            InstagramApi.setLocation(position);
            InstagramApi.setDistance(5000);
            InstagramApi.get(function(images){
                _process(images, callback, scope);
            });
        });
    }

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
            FaceClientAPI.faces_detect(urls, function(url, data){
                
                if (data.status == "success")
                {
                    var processedData = [];
                    for (var i=0,len=data.photos.length ; i<len ; i++)
                        processedData.push(new facetagram.Image(map[data.photos[i].url], data.photos[i]));
                    
                    _callback.call(_scope, processedData);
                }
                
            });
        }
    };

})();



facetagram.ImagesRepository = (function(){
    
    return {get: _get};
    
    function _get(callback, scope) 
    {
	    facetagram.locationHelper.get(function(position){
            InstagramApi.setLocation(position);
            InstagramApi.setDistance(5000);
            InstagramApi.get(function(images){
                _process(images, callback, scope);
            });
        });
    }

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
            FaceClientAPI.faces_detect(urls, function(url, data){
                
                if (data.status == "success")
                {
                    var processedData = [];
                    for (var i=0,len=data.photos.length ; i<len ; i++)
                        processedData.push(new facetagram.Image(map[data.photos[i].url], data.photos[i]));
                    
                    _callback.call(_scope, processedData);
                }
                
            });
        }
    };

})();
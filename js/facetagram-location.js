facetagram = window.facetagram || {};
		
facetagram.locationHelper = (function(){
            
    var _location, 
        _listeners = [], 
        _states = {UNKNOWN:1, LOADING:2, FAILURE: 3, SUCCESS: 4}, 
        _state = _states.UNKNOWN;

    return {
        STATES: _states,
        get: _get,
        isSupported: _isSupported
    };

    function _isSupported()
    {
        return _state;
    };

    function _get(callback, scope)
    {
        switch (_state)
        {
            case _states.SUCCESS:
            case _states.UNKNOWN:
            case _states.LOADING:
                _addListener(callback, scope);
                _load();
                _callListeners();
                return _location;

            case _states.FAILURE:
                alert("Not supported");
                return;

        }
    };

    function _addListener(callback, scope)
    {
        if (typeof (callback) === 'function')
            _listeners.push({callback:callback, scope:scope});
    };

    function _load()
    {
        if (_state === _states.UNKNOWN)
        {
            _state = _states.LOADING;
            if (navigator.geolocation)
                navigator.geolocation.getCurrentPosition(_success,_error,{timeout:10000});
            else if (geo_position_js.init())
                geo_position_js.getCurrentPosition(_success, _error,{timeout:10000});
        }        
    };

    function _callListeners()
    {
        var listener;
        if (_state === _states.SUCCESS)
        {
            while (listener = _listeners.shift())
                listener.callback.call(listener.scope, _location);
        }
    };

    function _error()
    {
        _state = _states.FAILURE;
    };

    function _success(pos)
    {
        _state = _states.SUCCESS;
        _location = pos;
        _callListeners();
    };

})();
facetagram = window.facetagram || {};

(function(ns) {
	
	var isIphone = navigator.appVersion.match(/iphone/gi) ? true : false,
		isIpad = navigator.appVersion.match(/ipad/gi) ? true : false,
		isAndroid = navigator.appVersion.match(/android/gi) ? true : false,
		isTouch = isIphone || isIpad || isAndroid,
		loadingIndicatorDiv = '<div class="loadingIndicator"><span class="bar bar_1"></span><span class="bar bar_2"></span><span class="bar bar_3"></span><span class="bar bar_4"></span><span class="bar bar_5"></span><span class="bar bar_6"></span><span class="bar bar_7"></span><span class="bar bar_8"></span><span class="bar bar_9"></span><span class="bar bar_10"></span><span class="bar bar_11"></span><span class="bar bar_12"></span></div>';
	
	ns.utils = {
		isTouch: isTouch,
		START_EVENT: isTouch ? 'touchstart' : 'mousedown',
		MOVE_EVENT: isTouch ? 'touchmove' : 'mousemove',
		END_EVENT: isTouch ? 'touchend' : 'mouseup',
		loadingIndicatorDiv: loadingIndicatorDiv,
		
		/**
		 * Wrapper for jQuery in Array which returns true if value in array,
		 * otherwise returns false.
		 * @param {value} value
		 * @param {Array} array
		 * @return boolean
		 */
		inArray: function(value, array) {
			return -1 !== $.inArray(value, array)
		}
	};
	
})(facetagram);

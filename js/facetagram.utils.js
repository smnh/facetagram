/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console */

facetagram = window.facetagram || {};

(function(ns) {
	
	var isIphone = navigator.appVersion.match(/iphone/gi) ? true : false,
		isIpad = navigator.appVersion.match(/ipad/gi) ? true : false,
		isAndroid = navigator.appVersion.match(/android/gi) ? true : false,
		isTouch = isIphone || isIpad || isAndroid,
		loadingIndicatorDiv = '<div class="loadingIndicator"><span class="bar bar_1"></span><span class="bar bar_2"></span><span class="bar bar_3"></span><span class="bar bar_4"></span><span class="bar bar_5"></span><span class="bar bar_6"></span><span class="bar bar_7"></span><span class="bar bar_8"></span><span class="bar bar_9"></span><span class="bar bar_10"></span><span class="bar bar_11"></span><span class="bar bar_12"></span></div>';
	
	ns.utils = {
		isTouch:      isTouch,
		START_EVENT:  isTouch ? 'touchstart' : 'mousedown',
		MOVE_EVENT:	  isTouch ? 'touchmove' : 'mousemove',
		END_EVENT:    isTouch ? 'touchend' : 'mouseup',
		
		loadingIndicatorDiv: loadingIndicatorDiv,
		
		/**
		 * Wrapper for jQuery in Array which returns true if value in array,
		 * otherwise returns false.
		 * @param {value} value
		 * @param {Array} array
		 * @return boolean
		 */
		inArray: function(value, array) {
			return -1 !== $.inArray(value, array);
		},
		
		emptyElement: function(element) {
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
		},
		
		/**
		 * Prototypal Inheritance
		 * http://javascript.crockford.com/prototypal.html
		 * 
		 * The object function untangles JavaScript's constructor pattern,
		 * achieving true prototypal inheritance. It takes an old object as a
		 * parameter and returns an empty new object that inherits from the old
		 * one. If we attempt to obtain a member from the new object, and it
		 * lacks that key, then the old object will supply the member.
		 */
		object: function(o) {
			function F(){}
			F.prototype = o;
			return new F();
		},
		
		/**
		 * inheritPrototype
		 * Helper for Parasitic Combination Inheritance to inherit methods using
		 * a hybrid form of prototype chaining.
		 * From "Professional JavaScript for Web Developers" by Nicholas C. Zakas
		 * Page 181.
		 * 
		 * Usage:
		 * function SuperType(value) {
		 *     this.superProperty = value;
		 * }
		 * SuperType.prototype = {
		 *     superMethod: function() {
		 *         return this.superProperty;
		 *     }
		 * }
		 * function SubType(superValue, subValue) {
		 *     SuperType.call(this, superValue);
		 *     this.subProperty = subValue;
		 * }
		 * inheritPrototype(SubType, SuperType, {
		 *     subMethod: function() {
		 *         return this.subProperty;
		 *     }
		 * });
		 * 
		 * @param subType {Function}
		 * @param superType {Function}
		 */
		inheritPrototype: function(subType, superType, subMethods){
			var prototype, methodName;
			
			// create object with prototype pointing to super's prototype
			prototype = ns.utils.object(superType.prototype);
			prototype.constructor = subType;
			
			for (methodName in subMethods) {
				if (subMethods.hasOwnProperty(methodName)) {
					prototype[methodName] = subMethods[methodName];
				}
			}
			
			subType.prototype = prototype;
		}
	};
	
})(facetagram);

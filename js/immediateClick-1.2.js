/*jslint devel: true, sloppy: true, nomen: true, browser: true, forin: true, unparam: true */
/*global console: false, iScroll: false */

/**
 * ImmediateClick, v1.1
 * 
 * Copyright (c) 2009 3D3R Software Studio
 * 
 * @author Simon Hanukaev
 * 
 * Binds "Fast Click" event handler and "Delayed Select" to an element and
 * eliminated click delay presented by Safari on iOS.
 * 
 * Usage:
 * bindImmediateClick(element, callback, options)
 * or
 * jQuery.bindImmediateClick(callback, options)
 * 
 * If the mouse/touch moved threshold distance while being pressed, then the
 * callback won't fire. If the element located in iScroll container then move
 * threshold distance taken from iScroll "move" property.
 * 
 * While being pressed, "pressed" class is added to the element. However, inside
 * iScroll container, the class is not added immediately but after a short delay
 * to enable user to scroll the page without selecting the underlying element.
 * 
 * Custom Mouse Events (fired when triggerEvents set to "true"):
 * - "pressed"
 *       If the element isn't located inside an iScroll container then this
 *       event fired immediately after user touches the element.
 *       If the element located inside of an iScroll container then this event
 *       fired after short delay of 100ms, with two exceptions:
 *       1. If within this delay user scrolls, then this event won't be fired.
 *       2. If within this delay user releases his finger without scrolling,
 *          then this event will be fired immediately after finger release.
 *       Note: If setPressedClassAutomatically set to true, then pressedClass
 *             class will be added to element disregards to triggerEvents flag.
 * - "moved"
 *       This event is fired if user moves his finger while the element is being
 *       pressed.
 *       Note: If setPressedClassAutomatically set to true, then pressedClass
 *             class will be removed from the element disregards to
 *             triggerEvents flag.
 * - "released"
 *       This event is fired immediately after user releases the element, as
 *       long as he moved his finger while being pressed. On the other hand,
 *       if user releases his finger without moving it while being pressed,
 *       then this event fired only after current panel's pageTransitionEnd
 *       event is fired or it is vired immediately if
 *       removePressedClassOnRelease set to "true".
 *       Note: If setPressedClassAutomatically set to true, then pressedClass
 *             class will be removed from the element disregards to
 *             triggerEvents flag.
 * - "immediateClick"
 *       This event is fired immediately after user releases the element without
 *       moving his finger while being pressed. You can also use callback
 *       function to execute code after this event.
 *       
 * 
 * @param {Object} element DOM element
 * @param {Object} callback Function to be executed when the element is clicked.
 *       When this function is invoked, "this" keyword points to the element,
 *       and it's single parameter is maually created "click" event.
 * @param {Object} options
 * - setPressedClassAutomatically {Boolean}
 *       If true, pressedClass class will be added automatically when needed.
 *       (default: true)
 * - removePressedClassOnRelease {Boolean}
 *       Removes pressedClass class from the element when finger released.
 *       (default true)
 * - pressedClass {String}
 *       Sets CSS class to be used when the element is in pressed state.
 *       (default: "pressed")
 * - onMove {Function}
 *       Callback function which is executed when the element dragged (i.e.:
 *       finger moved while the element being pressed). If this function
 *       returns "false" then the element is changed to "moved" state which
 *       removes pressedClass class and won't execute main callback
 *       function when it is released. (detault: null)
 * - triggerEvents {Boolean}
 *       If true, custom mouse events will be fired while element's states being
 *       changed. (default false)
 */

(function () {
	
	var isTouch,
		START_EVENT,
		MOVE_EVENT,
		END_EVENT,
		debug = false,
		console;
	
	function localizeConsole() {
		var dumpFunc = function() {}, testRef,
			methods = ["log", "debug", "error", "info", "warn", "dir"],
			console = {};
		
		function reference(refType) {
			var i, methodName, referenceTypes;
				
			referenceTypes = {
				"bind": function(methodName) { return window.console[methodName].bind(window.console); },
				"direct": function(methodName) { return window.console[methodName]; },
				"apply": function(methodName) { return function() { window.console[methodName].apply(window.console, arguments); }; },
				"empty": function(methodName) { return dumpFunc; }
			};
			
			for (i = 0; i < methods.length; i++) {
				methodName = methods[i];
				if (window.console && window.console[methodName]) {
					console[methodName] = referenceTypes[refType](methodName);
				} else {
					console[methodName] = dumpFunc;
				}
			}
		}
		
		if (debug && window.console) {
			if (Function.prototype.bind) {
				reference("bind");
			} else {
				try {
					testRef = window.console.log;
					testRef("Test direct reference to console methods");
					reference("direct");
				} catch(e) {
					window.console.debug("Can't set direct reference to console methods");
					reference("apply");
				}
			}
		} else {
			reference("empty");
		}
		
		return console;
	}
	
	console = localizeConsole();
	
	isTouch = window.ontouchstart !== undefined ? true : false;
	START_EVENT = isTouch ? 'touchstart' : 'mousedown';
	MOVE_EVENT = isTouch ? 'touchmove' : 'mousemove';
	END_EVENT = isTouch ? 'touchend' : 'mouseup';
	
	function hasClass(element, className) {
		return (new RegExp("\\b" + className + "\\b")).test(element.className);	
	}

	function addClass(element, className) {
		if (!hasClass(element, className)) {
			element.className += (element.className ? ' ' : '') + className;
		}
	}

	function removeClass(element, className) {
		element.className = element.className.replace(new RegExp("^\\s*\\b" + className + "\\b\\s*|\\s*\\b" + className + "\\b\\s*$|\\s*\\b" + className + "\\b", "g"), "");
	}
	
	function createMouseEvent(eventType, event) {
		var newEvent = document.createEvent('MouseEvents'),
			_event = isTouch ? event.changedTouches[0] : event;
		
		newEvent.initMouseEvent(eventType, true, true, event.view, 1,
				_event.screenX, _event.screenY, _event.clientX, _event.clientY,
				event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
				0, null);
		
		return newEvent;
	}
	
	function ImmediateClick(element, callback, options) {
		
		var prop;
		
		this.options =  {
			"setPressedClassAutomatically": true,
			"removePressedClassOnRelease": true,
			"pressedClass": "pressed",
			"onMove": null,
			"triggerEvents": false
		};
		
		if (options) {
			for (prop in options) {
				if (options.hasOwnProperty(prop) && this.options[prop] !== undefined) {
					this.options[prop] = options[prop];
				}
			}
		}
		
		this.element = element;
		this.callback = callback;
		
		this.scroller = this.findIScroll();
		this.withDelay = false;
		this.moved = false;
		this.absDistX = 0;
		this.absDistY = 0;
		this.prevPageX = null;
		this.prevPageY = null;
		this.startEventTargetSelectTimeout = null;
		
		this.element.addEventListener(START_EVENT, this, false);
		this.element.addEventListener("click", this, false);
	}
	
	ImmediateClick.prototype.findIScroll = function() {
		var parentNode = this.element.parentNode;
		while (parentNode) {
			if (parentNode.immediateClickIScroll) {
				return parentNode.immediateClickIScroll;
			}
			parentNode = parentNode.parentNode;
		}
		return null;
	};
	
	ImmediateClick.prototype.press = function(event) {
		var newEvent, target;
		if (this.options.setPressedClassAutomatically) {
			addClass(this.element, this.options.pressedClass);
		}
		if (this.options.triggerEvents) {
			newEvent = createMouseEvent("pressed", event);
			target = isTouch ? event.changedTouches[0].target : event.target;
			target.dispatchEvent(newEvent);
		}
	};
	
	ImmediateClick.prototype.removePressedClass = function() {
		if (this.options.setPressedClassAutomatically) {
			removeClass(this.element, this.options.pressedClass);
		}
	};
	
	ImmediateClick.prototype.release = function(event) {
		var newEvent, target;
		this.removePressedClass();
		if (this.options.triggerEvents) {
			newEvent = createMouseEvent("released", event);
			target = isTouch ? event.changedTouches[0].target : event.target;
			target.dispatchEvent(newEvent);
		}
	};
	
	ImmediateClick.prototype.handleEvent = function(event) {
		switch (event.type) {
			case START_EVENT:
				this.startEvent(event);
				break;
			case MOVE_EVENT:
				this.moveEvent(event);
				break;
			case END_EVENT:
			case "mouseout":
				this.endEvent(event);
				break;
			case "click":
				this.clickEvent(event);
				break;
		}
	};
	
	ImmediateClick.prototype.moveEvent = function(event) {
		var newEvent, target, pageX, pageY;
		if (this.withDelay) {
			// moved is an iScroll property which indicates if an iscroll moved
			// or not, and if it is not moved, iscroll initiates click event on
			// the target element.
			if (this.scroller.moved) {
				this.moved = true;
			}
		} else {
			pageX = isTouch ? event.changedTouches[0].pageX : event.pageX,
			pageY = isTouch ? event.changedTouches[0].pageY : event.pageY;
			
			this.absDistX += Math.abs(pageX - this.prevPageX);
			this.absDistY += Math.abs(pageY - this.prevPageY);
			this.prevPageX = pageX;
			this.prevPageY = pageY;
			
			if (this.absDistX + this.absDistY > 5) {
				this.moved = true;
			}
		}
		
		if (this.moved || (this.options.onMove && this.options.onMove(event))) {
			this.moved = true;
			this.element.removeEventListener(MOVE_EVENT, this, false);
			//this.element.removeEventListener(END_EVENT, this, false);
			//this.element.removeEventListener("mouseout", this, false);
			window.clearTimeout(this.startEventTargetSelectTimeout);
			this.startEventTargetSelectTimeout = null;
			this.removePressedClass();
			if (this.options.triggerEvents) {
				newEvent = createMouseEvent("moved", event);
				target = isTouch ? event.changedTouches[0].target : event.target;
				target.dispatchEvent(newEvent);
			}
		}
	};
	
	ImmediateClick.prototype.endEvent = function(event) {
		console.debug("ImmediateClick endEvent");
		
		var target, newEvent;
		
		if (event.type === "mouseout" && event.target !== this.element) {
			return;
		}
		
		this.element.removeEventListener(MOVE_EVENT, this, false);
		this.element.removeEventListener(END_EVENT, this, false);
		this.element.removeEventListener("mouseout", this, false);
		window.clearTimeout(this.startEventTargetSelectTimeout);
		
		target = isTouch ? event.changedTouches[0].target : event.target;
		
		// Scroller is a parent of this.element, hence its touchMove event will
		// always be triggered after touchMove event of this.element and
		// therefore if there were only one touchMove event in which iScroll
		// moved, it will not be registered here, so we will check iScroll.move
		// state also here.
		if (this.withDelay && this.scroller.moved) {
			this.moved = true;
			if (this.options.triggerEvents) {
				newEvent = createMouseEvent("moved", event);
				target.dispatchEvent(newEvent);
			}
		}
		
		if (!this.moved && event.type !== "mouseout") {
			console.debug("ImmediateClick not moved");
			
			// Add pressed class in case timeout isn't passed yet.
			if (this.startEventTargetSelectTimeout !== null) {
				this.press(event);
			}
			
			if (this.options.removePressedClassOnRelease) {
				this.release(event);
			}
			
			if (this.options.triggerEvents) {
				newEvent = createMouseEvent("immediateClick", event);
				target.dispatchEvent(newEvent);
			}
			
			while (target.nodeType !== 1) {
				target = target.parentNode;
			}
			
			newEvent = createMouseEvent("click", event);
			newEvent._fake = true; // To propagate in iScroll
			newEvent._immediateClick = true;
			
			window.setTimeout(function() {
				target.dispatchEvent(newEvent);
			}, 0);
		} else {
			console.debug("ImmediateClick moved");
			this.release(event);
		}
	};
	
	ImmediateClick.prototype.startEvent = function(event) {
		console.debug("ImmediateClick startEvent");
		var that = this;
		
		if (!this.scroller) {
			this.scroller = this.findIScroll();
		}
		// If current element is located in iScroll, and iScroll isn't locked for user drag.
		// Note: scroller object updated on refreshIScroll
		this.withDelay = this.scroller && (this.scroller.scrollX || this.scroller.scrollY);
		
		this.moved = false;
		this.startEventTargetSelectTimeout = null;
		
		this.element.addEventListener(MOVE_EVENT, this, false);
		this.element.addEventListener(END_EVENT, this, false);
		this.element.addEventListener("mouseout", this, false);
		
		if (this.withDelay) {
			console.debug("ImmediateClick with delay");
			
			// Select element after 100 ms if mouse didn't moved
			this.startEventTargetSelectTimeout = window.setTimeout(function() {
				that.startEventTargetSelectTimeout = null;
				that.press(event);
			}, 100);
		} else {
			console.debug("ImmediateClick without delay");
			this.absDistX = 0;
			this.absDistY = 0;
			this.prevPageX = isTouch ? event.changedTouches[0].pageX : event.pageX;
			this.prevPageY = isTouch ? event.changedTouches[0].pageY : event.pageY;
			this.press(event);
		}
	};
	
	ImmediateClick.prototype.clickEvent = function(event) {
		// Click event fires twice - once for the original browser's
		// click event, and once for custom generated event with _timedSelectClick
		// property. We will prevent the original event and we will
		// pass fake event to callback only if it has _timedSelectClick
		// or _immediateClick properties
		// If we are inside iscroll, then iscroll will also fire click event if iscroll
		// wasn't scrolled.
		if (event._immediateClick) {
			console.debug("ImmediateClick clickEvent");
			this.callback.apply(this.element, arguments);
		} else {
			console.debug("Original clickEvent");
			event.preventDefault();
			event.stopPropagation();
			return false;
		}
	};
	
	ImmediateClick.prototype.unbind = function() {
		this.element.removeEventListener(START_EVENT, this, false);
		this.element.removeEventListener("click", this, false);
	};
	
	window.bindImmediateClick = function(element, callback, options) {
		element.immediateClick = new ImmediateClick(element, callback, options);
	};
	
	window.unbindImmediateClick = function(element) {
		if (element.immediateClick) {
			element.immediateClick.unbind();
			delete element.immediateClick;
		}
	};
	
	if (window.jQuery) {
		jQuery.fn.bindImmediateClick = function(callback, options) {
			return this.each(function() {
				jQuery(this).data("immediateClick", new ImmediateClick(this, callback, options));
			});
		};
		
		jQuery.fn.unbindImmediateClick = function() {
			return this.each(function() {
				var immediateClick = jQuery(this).data("immediateClick");
				if (immediateClick) {
					immediateClick.unbind();
					jQuery(this).removeData("immediateClick");
				}
			});
		};
	}
}());
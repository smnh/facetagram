
facetagram = window.facetagram || {};

var Snapper;

(function(ns){
	
	var isTouch, has3d, vendor,
		useTransitions = true,
		ANIMATION_TIME = 200,
		START_EVENT, MOVE_EVENT, END_EVENT,
		TRAN_OPEN, TRAN_CLOSE,
		TRANSFORM,
		TRANSFORM_CSS,
		TRANSITION_END_EVENT,
		TRANSITION_DURATION,
		TRANSITION_DURATION_CSS,
		TRANSITION_TIMING_FUNCTION_CSS,
		TRANSITION_PROPERTY_CSS;
	
	isTouch = window.ontouchstart !== undefined ? true : false;
	has3d = window.WebKitCSSMatrix !== undefined && (new WebKitCSSMatrix()).m11 !== undefined;
	vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' : (/firefox/i).test(navigator.userAgent) ? 'Moz' : '';
	
	START_EVENT = isTouch ? 'touchstart' : 'mousedown';
	MOVE_EVENT = isTouch ? 'touchmove' : 'mousemove';
	END_EVENT = isTouch ? 'touchend' : 'mouseup';
	TRAN_OPEN = 'translate' + (has3d ? '3d(' : '(');
	TRAN_CLOSE = has3d ? ',0)' : ')';
	
	if (vendor === "webkit") {
		TRANSITION_END_EVENT = 'webkitTransitionEnd';
		TRANSITION_DURATION = 'webkitTransitionDuration';
		TRANSITION_DURATION_CSS = '-webkit-transition-duration';
		TRANSITION_TIMING_FUNCTION_CSS = '-webkit-transition-timining-function';
		TRANSITION_PROPERTY_CSS = '-webkit-transition-property';
		TRANSFORM = 'webkitTransform';
		TRANSFORM_CSS = '-webkit-transform';
	} else if (vendor === "Moz") {
		TRANSITION_END_EVENT = 'transitionend';
		TRANSITION_DURATION = 'MozTransitionDuration';
		TRANSITION_DURATION_CSS = '-moz-transition-duration';
		TRANSITION_TIMING_FUNCTION_CSS = '-moz-transition-timining-function';
		TRANSITION_PROPERTY_CSS = '-moz-transition-property';
		TRANSFORM = 'MozTransform';
		TRANSFORM_CSS = '-moz-transform';
	}
	
	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.oRequestAnimationFrame
			|| window.msRequestAnimationFrame
			|| function(callback, element) {
				// 17 is 1000ms / 60Hz
				return window.setTimeout(callback, 17);
			};
	}());
	
	window.cancelRequestAnimFrame = (function () {
		return window.cancelRequestAnimationFrame
			|| window.webkitCancelRequestAnimationFrame
			|| window.mozCancelRequestAnimationFrame
			|| window.oCancelRequestAnimationFrame
			|| window.msCancelRequestAnimationFrame
			|| clearTimeout;
	}());
	
	/**
	 * Checks if element has class.
	 *
	 * @param {Element} element Element on which to test class
	 * @param {String} className
	 */
	function hasClass(element, className) {
		return (new RegExp("\\b" + className + "\\b")).test(element.className);
	}
	
	/**
	 * Adds class or classes to element
	 * 
	 * @param {Element} element Element to which class will be added
	 * @param {String} className Class or multiple classes separated by spaces
	 */
	function addClass(element, className) {
		var classesArray = className.split(/\s+/), i;
		for (i = 0; i < classesArray.length; i++) {
			if (!hasClass(element, classesArray[i] )) {
				element.className += (element.className ? ' ' : '') + classesArray[i];
			}
		}
	}
	
	/**
	 * Removes class or classes from element
	 * 
	 * @param {Element} element Element from which class will be removed
	 * @param {String} className Class or multiple classes separated by spaces
	 */
	function removeClass(element, className) {
		var classesArray = className.split(/\s+/), i;
		for (i = 0; i < classesArray.length; i++) {
			element.className = element.className.replace(new RegExp("^\\s*\\b" + classesArray[i] + "\\b\\s*|\\s*\\b" + classesArray[i] + "\\b\\s*$|\\s*\\b" + classesArray[i] + "\\b", "g"), "");
		}
	}
	
	Snapper = function(element, options) {
		var div, i;
		
		this.options = {
			initPageIndex: 0,
			mode: Snapper.modes.CALLBACKS,
			totalPages: null,
			hasPageIndex: null,
			generatePage: null,
			onPageAnimationEnd: null
		};
		
		for (i in options) {
			if (this.options[i] !== undefined) {
				this.options[i] = options[i];
			}
		}
		
		this.totalPages = this.options.totalPages;
		this.mode = this.options.mode;
		this.destroyed = false;
		
		if (this.mode === Snapper.modes.CALLBACKS) {
			if (this.options.hasPageIndex === null) {
				console.error("Snapper: hasPageIndex method must be specified in CALLBACKS mode");
				return false;
			}
		} else if (this.mode === Snapper.modes.RANGE) {
			if (this.totalPages === null) {
				console.error("Snapper: totalPages must be specified in RANGE mode");
				return false;
			}
		}
		
		if (this.options.onPageAnimationEnd === null) {
			console.error("Snapper: onPageAnimationEnd must be specified");
			return false;
		}
		
		if (this.options.generatePage === null) {
			console.error("Snapper: generatePage must be specified");
			return false;
		}
		
		this.wrapper = element;
		this.wrapper.style.overflow = 'hidden';
		this.wrapper.style.position = 'relative';
		this.wrapper.style.width = '100%';
		this.wrapper.style.height = '100%';
		
		this.width = this.wrapper.offsetWidth;
		
		this.slider = document.createElement('div');
		this.slider.className = "slider";
		this.slider.style.cssText = 'position:relative;top:0;height:100%;width:100%;' +
				TRANSITION_DURATION_CSS + ':0;' + TRANSFORM_CSS + ':' + TRAN_OPEN + '0,0' + TRAN_CLOSE + ';' +
				TRANSITION_TIMING_FUNCTION_CSS + ':ease-in-out;' + TRANSITION_PROPERTY_CSS + ':' + TRANSFORM_CSS;
		
		this.animating = false;
		this.renderQueue = [];
		this.getPageElementQueue = [];
		this.pageOrder = ["prev", "current", "next"];
		this.pages = {
			prev: {},
			current: {},
			next: {}
		};
		
		for (i = 0; i < 3; i++) {
			this.pages[this.pageOrder[i]] = {
				posIndex: i - 1,
				pageIndex: this.options.initPageIndex + (i - 1),
				element: document.createElement('div'),
				hasPrevPage: this.mode === Snapper.modes.INFINITE,
				hasNextPage: this.mode === Snapper.modes.INFINITE,
				onPageAnimationEndCalled: false
			};
			this.pages[this.pageOrder[i]].element.style.cssText = TRANSFORM_CSS + ':translateZ(0);position:absolute;top:0;height:100%;width:100%;';
			this.pages[this.pageOrder[i]].element.style.left = (this.pages[this.pageOrder[i]].posIndex * 100) + '%';
			this.slider.appendChild(this.pages[this.pageOrder[i]].element);
		}
		
		this.checkAdjacentPages();
		
		this.wrapper.appendChild(this.slider);
		
		this.state = "PAGE_SHOWN";
		this.touchIdentifier = null;
		this.prevStartTime = null;
		this.prevPagePos = null;
		this.prevPagePosY = null;
		this.startTime = null;
		this.startTimePagePos = null;
		this.startTimePagePosY = null;
		this.displace = 0;
		this.speed = 0;
		this.browsingStarted = false;
		this.position = 0;
		this.moved = false;
		this.absDistX = 0;
		this.absDistY = 0;
		
		this.wrapper.addEventListener(START_EVENT, this, false);
	};
	
	Snapper.modes = {
		CALLBACKS: 0,
		RANGE: 1,
		INFINITE: 2
	};
	
	Snapper.prototype = {
		constructor: Snapper,
		
		resetPage: function() {
			
		},
		
		checkAdjacentPages: function() {
			console.debug("Snapper.checkAdjacentPages()");
			if (this.mode === Snapper.modes.CALLBACKS) {
				this.pages.current.hasPrevPage = this.options.hasPageIndex(this.pages.prev.pageIndex);
				this.pages.current.hasNextPage = this.options.hasPageIndex(this.pages.next.pageIndex);
			} else if (this.mode === Snapper.modes.RANGE) {
				this.pages.current.hasPrevPage = this.pages.prev.pageIndex >= 0;
				this.pages.current.hasNextPage = this.pages.next.pageIndex < this.totalPages;
			}
			
			if (!this.pages.current.hasPrevPage) {
				this.pages.prev.element.style.display = "none";
			} else {
				this.pages.prev.element.style.display = "";
			}
			if (!this.pages.current.hasNextPage) {
				this.pages.next.element.style.display = "none";
			} else {
				this.pages.next.element.style.display = "";
			}
		},
		
		start: function() {
			this.options.generatePage(this.pages.current.pageIndex, this.pages.current.element);
			if (this.pages.current.hasPrevPage) {
				this.options.generatePage(this.pages.prev.pageIndex, this.pages.prev.element);
			}
			if (this.pages.current.hasNextPage) {
				this.options.generatePage(this.pages.next.pageIndex, this.pages.next.element);
			}
			this.onPageAnimationEnd();
		},
		
		onPageAnimationEnd: function() {
			console.debug("Snapper.onPageAnimationEnd()");
			
			var renderParams, getPageElementParams, i;
			
			while (this.renderQueue.length) {
				renderParams = this.renderQueue.shift();
				this.renderPage(renderParams.index, renderParams.content, renderParams.callback);
			}
			
			while (this.getPageElementQueue.length) {
				getPageElementParams = this.getPageElementQueue.shift();
				this.getPageElement(getPageElementParams.index, getPageElementParams.callback);
			}
			
			if (!this.pages.current.onPageAnimationEndCalled) {
				this.options.onPageAnimationEnd(this.pages.current.pageIndex);
				this.pages.current.onPageAnimationEndCalled = true;
			}
			if (this.pages.current.hasPrevPage && !this.pages.prev.onPageAnimationEndCalled) {
				this.options.onPageAnimationEnd(this.pages.prev.pageIndex);
				this.pages.prev.onPageAnimationEndCalled = true;
			}
			if (this.pages.current.hasNextPage && !this.pages.next.onPageAnimationEndCalled) {
				this.options.onPageAnimationEnd(this.pages.next.pageIndex);
				this.pages.next.onPageAnimationEndCalled = true;
			}
		},
		
		getPageElement: function(index, callback) {
			console.debug("Snapper.getPageElement(index=" + index + ")");
			
			var i;
			
			if (this.browsingStarted) {
				console.debug("browsingStarted, pushing to queue...");
				this.getPageElementQueue.push({
					index: index,
					callback: callback
				});
				return;
			}
			
			for (i in this.pages) {
				if (this.pages[i].pageIndex === index) {
					callback(this.pages[i].element);
					return;
				}
			}
			
			console.info("Page " + index + " has left the building...");
		},
		
		renderPage: function(index, content, callback) {
			console.debug("Snapper.renderPage()");
			
			var i;
			
			if (this.browsingStarted) {
				this.renderQueue.push({
					index: index,
					content: content,
					callback: callback
				});
				return;
			}
			
			for (i in this.pages) {
				if (this.pages[i].pageIndex === index) {
					ns.utils.emptyElement(this.pages[i].element);
					this.pages[i].element.appendChild(content);
					if (callback) {
						callback(this.pages[i].element);
					}
					return;
				}
			}
			
			console.info("Page " + index + " has left the building...");
		},
		
		destroy: function() {
			this.destroyed = true;
			
			this.wrapper.removeEventListener(START_EVENT, this, false);
		},
		
		getDisplacement: function() {
			console.debug("Snapper.getDisplacement()");
			
			var position, matrixMatch,
				matrixRegExp = /matrix\((?:[^,]+,){4}\s*(-?[\d\.]+)[^,]*,\s*(-?[\d\.]+)[^\)]*\)/;
			
			matrixMatch = document.defaultView.getComputedStyle(this.slider, null).getPropertyValue(TRANSFORM_CSS).match(matrixRegExp);
			position = matrixMatch ? Number(matrixMatch[1]) : 0;
			
			displace = position + this.pages.current.posIndex * this.width;
			
			console.debug("displace = " + displace);
			
			return displace;
		},
		
		setTransform: function(x) {
			this.slider.style[TRANSFORM] = TRAN_OPEN + x + "px,0px" + TRAN_CLOSE;
		},
		
		setPosition: function(displace, dir) {
			//console.debug("Snapper.setPosition(displace=" + displace + ", dir=" + dir + ")");
			
			if (dir === "next" && !this.pages.current.hasNextPage ||
				dir === "prev" && !this.pages.current.hasPrevPage) {
				displace = displace / 2;
			}
			
			this.position = -this.pages.current.posIndex * this.width + displace;
			
			this.setTransform(this.position);
		},
		
		resetPosition: function() {
			console.debug("Snapper.resetPosition()");
			this.position = -this.pages.current.posIndex * this.width;
			this.setTransform(this.position);
		},
		
		resetTransition: function() {
			console.debug("Snapper.resetTransition()");
			this.slider.removeEventListener(TRANSITION_END_EVENT, this, false);
			this.slider.style[TRANSITION_DURATION] = "0";
		},
		
		startTransition: function() {
			console.debug("Snapper.startTransition()");
			var self = this;
			this.slider.addEventListener(TRANSITION_END_EVENT, this, false);
			window.setTimeout(function() {
				self.resetPosition();
				self.slider.style[TRANSITION_DURATION] = ANIMATION_TIME + "ms";
			}, 0);
		},
		
		startAnimation: function() {
			console.debug("Snapper.startAnimation()");
			var self = this,
				startTime = (new Date()).getTime(),
				totalTime = ANIMATION_TIME,
				startPosition = this.position,
				endPosition = -this.pages.current.posIndex * this.width,
				startDisplace = startPosition - endPosition;
			
			this.animating = true;
			
			(function animate() {
				var now = (new Date()).getTime(),
					progress,
					displace,
					easeInOut;
				
				if (!self.animating) {
					return;
				}
				
				if (now >= startTime + totalTime) {
					self.animating = false;
					self.resetPosition();
					self.handlers[self.state].TRANSITION_END_EVENT.apply(self, [event]);
					return;
				}
				
				progress = (now - startTime) / totalTime;
				easeInOut = (3 - 2 * progress) * Math.pow(progress, 2);
				displace = Math.round(startDisplace * (1 - easeInOut));
				
				self.setPosition(displace);
				
				requestAnimFrame(animate);
			}());
		},
		
		animate: function() {
			console.debug("Snapper.animate()");
			
			if (useTransitions) {
				this.startTransition();
			} else {
				this.startAnimation();
			}
		},
		
		next: function() {
			console.debug("Snapper.next()");
			console.debug("going to page with index " + this.pages.next.pageIndex);
			
			var temp, self = this;
			
			ns.utils.emptyElement(this.pages.prev.element);
			
			this.pages.prev.posIndex += 3;
			this.pages.prev.pageIndex += 3;
			this.pages.prev.element.style.left = (this.pages.prev.posIndex * 100) + '%';
			this.pages.prev.onPageAnimationEndCalled = false;
			
			temp = this.pages.prev;
			this.pages.prev = this.pages.current;
			this.pages.current = this.pages.next;
			this.pages.next = temp;
			
			this.checkAdjacentPages();
			if (this.pages.current.hasNextPage) {
				this.options.generatePage(this.pages.next.pageIndex, this.pages.next.element);
			}
			
			this.browsingStarted = true;
			this.animate();
		},
		
		prev: function() {
			console.debug("Snapper.prev()");
			console.debug("going to page with index " + this.pages.prev.pageIndex);
			
			var temp, self = this;
			
			ns.utils.emptyElement(this.pages.next.element);
			
			this.pages.next.posIndex -= 3;
			this.pages.next.pageIndex -= 3;
			this.pages.next.element.style.left = (this.pages.next.posIndex * 100) + '%';
			this.pages.next.onPageAnimationEndCalled = false;
			
			temp = this.pages.next;
			this.pages.next = this.pages.current;
			this.pages.current = this.pages.prev;
			this.pages.prev = temp;
			
			this.checkAdjacentPages();
			if (this.pages.current.hasPrevPage) {
				this.options.generatePage(this.pages.prev.pageIndex, this.pages.prev.element);
			}
			
			this.browsingStarted = true;
			this.animate();
		},
		
		snapReset: function() {
			console.debug("Snapper.snapReset()");
			
			this.state = "PAGE_SHOWN";
			this.displace = 0;
			
			if (this.browsingStarted) {
				this.browsingStarted = false;
				this.onPageAnimationEnd();
			}
		},
		
		handlers: {
			"PAGE_SHOWN": {
				"START_EVENT": function(event) {
					this.state = "DRAGGING_DISPLACED_NONE";
				}
			},
			"DRAGGING_DISPLACED_NONE": {
				"MOVE_EVENT": function(event) {
					if (this.displace > 0) {
						this.state = "DRAGGING_DISPLACED_RIGHT";
						this.setPosition(this.displace, "prev");
					} else if (this.displace < 0) {
						this.state = "DRAGGING_DISPLACED_LEFT";
						this.setPosition(this.displace, "next");
					}
				},
				"END_EVENT": function(event) {
					this.snapReset();
				}
			},
			"DRAGGING_DISPLACED_RIGHT": {
				"MOVE_EVENT": function(event) {
					if (this.displace < 0) {
						this.state = "DRAGGING_DISPLACED_LEFT";
						this.setPosition(this.displace, "next");
					} else if (this.displace === 0) {
						this.state = "DRAGGING_DISPLACED_NONE";
						this.resetPosition();
					} else {
						this.setPosition(this.displace, "prev");
					}
				},
				"END_EVENT": function(event) {
					if (this.speed > 0.1 && this.pages.current.hasPrevPage) {
						// Swipe right
						this.state = "TRANSITIONING_GOING_BACK";
						this.prev();
					} else if (this.speed < -0.1) {
						// Swipe left
						this.state = "TRANSITIONING_RESET_RIGHT_DISPLACEMENT";
						this.animate();
					} else if (this.displace > Math.round(this.width / 2) && this.pages.current.hasPrevPage) {
						this.state = "TRANSITIONING_GOING_BACK";
						this.prev();
					} else {
						this.state = "TRANSITIONING_RESET_RIGHT_DISPLACEMENT";
						this.animate();
					}
				}
			},
			"DRAGGING_DISPLACED_LEFT": {
				"MOVE_EVENT": function(event) {
					if (this.displace > 0) {
						this.state = "DRAGGING_DISPLACED_RIGHT";
						this.setPosition(this.displace, "prev");
					} else if (this.displace === 0) {
						this.state = "DRAGGING_DISPLACED_NONE";
						this.resetPosition();
					} else {
						this.setPosition(this.displace, "next");
					}
				},
				"END_EVENT": function(event) {
					if (this.speed < -0.1 && this.pages.current.hasNextPage) {
						// Swipe left
						this.state = "TRANSITIONING_GOING_FORWARD";
						this.next();
					} else if (this.speed > 0.1) {
						// Swipe right
						this.state = "TRANSITIONING_RESET_LEFT_DISPLACEMENT";
						this.animate();
					} else if (this.displace < -Math.round(this.width / 2) && this.pages.current.hasNextPage) {
						this.state = "TRANSITIONING_GOING_FORWARD";
						this.next();
					} else {
						this.state = "TRANSITIONING_RESET_LEFT_DISPLACEMENT";
						this.animate();
					}
				}
			},
			"TRANSITIONING_RESET_RIGHT_DISPLACEMENT": {
				"START_EVENT": function(event) {
					this.state = "DRAGGING_DISPLACED_RIGHT";
					if (useTransitions) {
						this.displace = this.getDisplacement();
						this.resetTransition();
						this.displace = this.pages.current.hasPrevPage ? this.displace : this.displace * 2;
						this.setPosition(this.displace, "prev");
					} else {
						this.animating = false;
						this.displace = this.position + this.pages.current.posIndex * this.width;
						this.displace = this.pages.current.hasPrevPage ? this.displace : this.displace * 2;
					}
				},
				"TRANSITION_END_EVENT": function(event) {
					if (useTransitions) {
						this.resetTransition();
					}
					this.snapReset();
				}
			},
			"TRANSITIONING_RESET_LEFT_DISPLACEMENT": {
				"START_EVENT": function(event) {
					this.state = "DRAGGING_DISPLACED_LEFT";
					if (useTransitions) {
						this.displace = this.getDisplacement();
						this.resetTransition();
						this.displace = this.pages.current.hasNextPage ? this.displace : this.displace * 2;
						this.setPosition(this.displace, "next");
					} else {
						this.animating = false;
						this.displace = this.position + this.pages.current.posIndex * this.width;
						this.displace = this.pages.current.hasNextPage ? this.displace : this.displace * 2;
					}
				},
				"TRANSITION_END_EVENT": function(event) {
					if (useTransitions) {
						this.resetTransition();
					}
					this.snapReset();
				}
			},
			"TRANSITIONING_GOING_BACK": {
				"START_EVENT": function(event) {
					this.state = "STOPPED_WHILE_GOING_BACK";
					if (useTransitions) {
						this.displace = this.getDisplacement();
						this.resetTransition();
						this.setPosition(this.displace, "next");
					} else {
						this.animating = false;
						this.displace = this.position + this.pages.current.posIndex * this.width;
					}
				},
				"TRANSITION_END_EVENT": function(event) {
					if (useTransitions) {
						this.resetTransition();
					}
					this.snapReset();
				}
			},
			"TRANSITIONING_GOING_FORWARD": {
				"START_EVENT": function(event) {
					this.state = "STOPPED_WHILE_GOING_FORWARD";
					if (useTransitions) {
						this.displace = this.getDisplacement();
						this.resetTransition();
						this.setPosition(this.displace, "prev");
					} else {
						this.animating = false;
						this.displace = this.position + this.pages.current.posIndex * this.width;
					}
				},
				"TRANSITION_END_EVENT": function(event) {
					if (useTransitions) {
						this.resetTransition();
					}
					this.snapReset();
				}
			},
			"STOPPED_WHILE_GOING_BACK": {
				"MOVE_EVENT": function(event) {
					if (this.displace > 0) {
						this.state = "DRAGGING_DISPLACED_RIGHT";
						this.setPosition(this.displace, "prev");
					} else if (this.displace === 0) {
						this.state = "DRAGGING_DISPLACED_NONE";
						this.resetPosition();
					} else {
						this.setPosition(this.displace, "next");
					}
				},
				"END_EVENT": function(event) {
					if (this.speed < -0.1) {
						// Swipe left
						this.state = "TRANSITIONING_GOING_FORWARD";
						this.next();
					} else if (this.speed > 0.1 && this.pages.current.hasPrevPage) {
						// Swipe right
						this.state = "TRANSITIONING_GOING_BACK";
						this.prev();
					} else {
						this.state = "TRANSITIONING_RESET_LEFT_DISPLACEMENT";
						this.animate();
					}
				}
			},
			"STOPPED_WHILE_GOING_FORWARD": {
				"MOVE_EVENT": function(event) {
					if (this.displace < 0) {
						this.state = "DRAGGING_DISPLACED_LEFT";
						this.setPosition(this.displace, "next");
					} else if (this.displace === 0) {
						this.state = "DRAGGING_DISPLACED_NONE";
						this.resetPosition();
					} else {
						this.setPosition(this.displace, "prev");
					}
				},
				"END_EVENT": function(event) {
					if (this.speed > 0.1) {
						// Swipe right
						this.state = "TRANSITIONING_GOING_BACK";
						this.prev();
					} else if (this.speed < -0.1 && this.pages.current.hasNextPage) {
						// Swipe left
						this.state = "TRANSITIONING_GOING_FORWARD";
						this.next();
					} else {
						this.state = "TRANSITIONING_RESET_RIGHT_DISPLACEMENT";
						this.animate();
					}
				}
			}
		},
		
		handleEvent: function(event) {
			console.debug("Snapper.handleEvent, event.type=" + event.type + ", state=" + this.state + ", draggingEnabled=" + this.draggingEnabled);
			
			var self = this,
				_event = isTouch && event.changedTouches ? event.changedTouches[0] : event,
				target = _event.target,
				currentTarget = event.currentTarget,
				pagePos = _event.pageX,
				pagePosY = _event.pageY,
				time, eventState,
				relatedTarget = event.relatedTarget;
			
			// Run default actions for each event
			// ----------------------------------
			switch (event.type) {
				case START_EVENT:
					eventState = "START_EVENT";
					
					if (isTouch) {
						// Do not process second touches
						if (this.touchIdentifier === null) {
							// If touchIdentifier is null, then there is no fingers
							// touching surface, remember this finger's touchIdentifier
							this.touchIdentifier = _event.identifier;
						} else {
							// If touchIdentifier is not null, then one finger
							// already started touching.
							return;
						}
					}
					
					// Attach move and end events
					this.wrapper.addEventListener(MOVE_EVENT, this, false);
					this.wrapper.addEventListener(END_EVENT, this, false);
					this.wrapper.addEventListener("mouseout", this, false);
					this.wrapper.addEventListener("dragstart", this, false);
					
					// Run other default actions related to snapper
					this.prevStartTime = event.timeStamp || (new Date()).getTime();
					this.prevPagePos = pagePos;
					this.prevPagePosY = pagePosY;
					this.startTime = null;
					this.startTimePagePos = null;
					this.startTimePagePosY = null;
					
					this.moved = false;
					this.absDistX = 0;
					this.absDistY = 0;
	
					break;
					
				case MOVE_EVENT:
					eventState = "MOVE_EVENT";
					
					// Check if moved finger is the first touching finger, if not
					// return and do nothing.
					if (isTouch && this.touchIdentifier !== _event.identifier) {
						return;
					}
					
					// Run other default actions related to snapper
					this.startTime = this.prevStartTime;
					this.startTimePagePos = this.prevPagePos;
					this.startTimePagePosY = this.prevPagePosY;
					this.prevStartTime = event.timeStamp || (new Date()).getTime();
					this.prevPagePos = pagePos;
					this.prevPagePosY = pagePosY;
					
					if (!this.moved) {
						if (this.absDistX < 6 && this.absDistY < 6) {
							this.absDistX += Math.abs(this.prevPagePos - this.startTimePagePos);
							this.absDistY += Math.abs(this.prevPagePosY - this.startTimePagePosY);
						}
						if (this.absDistY > this.absDistX + 5) {
							return;
						}
						if (this.absDistX > 5) {
							this.moved = true;
						} else {
							return;
						}
					}
					
					this.displace += this.prevPagePos - this.startTimePagePos;
					
					break;
				
				case "mouseout":
					// Return if related target (element that pointer entered) is descendant of element
					while (relatedTarget) {
						if (relatedTarget === this.wrapper) {
							return;
						}
						relatedTarget = relatedTarget.parentNode;
					}
					// Do NOT break!
				case END_EVENT:
					eventState = "END_EVENT";
					
					// Check if moved finger is the first touching finger, if not
					// return and do nothing.
					if (isTouch && this.touchIdentifier !== _event.identifier) {
						return;
					}
					
					// Detach move and end events and clear touchIdentifier
					this.touchIdentifier = null;
					this.wrapper.removeEventListener(MOVE_EVENT, this, false);
					this.wrapper.removeEventListener(END_EVENT, this, false);
					this.wrapper.removeEventListener("mouseout", this, false);
					this.wrapper.removeEventListener("dragstart", this, false);
					
					// Run other default actions related to snapper
					if (this.startTime !== null) {
						time = (event.timeStamp || (new Date()).getTime()) - this.startTime;
						this.speed = (pagePos - this.startTimePagePos) / time;
					} else {
						this.speed = 0;
					}
					
					break;
					
				case TRANSITION_END_EVENT:
					eventState = "TRANSITION_END_EVENT";
					break;
				
				case "dragstart":
					event.preventDefault();
					return;
					
			}
			
			if (typeof this.handlers[this.state][eventState] === "function") {
				this.handlers[this.state][eventState].apply(this, [event]);
			} else {
				window.console.error("This type of event: '" + event.type + "' is illegal for current state: " + this.state);
			}
		}
	};
})(facetagram);

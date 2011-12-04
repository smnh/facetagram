/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, unparam: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console, iScroll */

facetagram = window.facetagram || {};

(function(ns) {
	
	// Classes
	var AppView, Page;
	
	AppView = function() {
		
		var self = this;
		
		// Prevent iPhone's touchmove default behavior so it will not drag the
		// whole browser's screen. As required by iScroll - http://cubiq.org/iscroll
		document.addEventListener('touchmove', function(e) {
			e.preventDefault();
		});
		
		window.addEventListener('resize', function(e) {
			self.setDimensions();
		});
		
		this.currentPage = null;
		this.pageHistory = [];
		
		this.$pageWrapper = $("#pageWrapper");
		this.$uiBlocker = $("#uiBlocker");
		this.$uiBlocker.css({
			"width": window.innerWidth + "px",
			"height": window.innerHeight + "px"
		});
		
		this.setDimensions();
		
		this.imageLibrary = new ns.ImageLibraryPage({
			appView: this
		});
	};
	
	AppView.prototype = {
		constructor: AppView,
		
		element: document.getElementById("imageGallery"),
		
		blockUI: function(loadingIndicator) {
			if (loadingIndicator) {
				this.$uiBlocker.html(ns.utils.loadingIndicatorDiv);
				this.$uiBlocker.addClass("loading");
			}
			this.$uiBlocker.show();
		},
		
		unblockUI: function() {
			this.$uiBlocker.hide();
			if (this.$uiBlocker.hasClass("loading")) {
				this.$uiBlocker.empty();
				this.$uiBlocker.removeClass("loading");
			}
		},
		
		setDimensions: function() {
			this.$pageWrapper.height(window.innerHeight - $("#header").outerHeight());
			if (this.currentPage) {
				this.currentPage.refresh();
			}
		},
		
		goBack: function(event) {
			console.debug("AppView.goBack(event=", event, ")");
			
			if (event !== undefined && typeof event === "number") {
				this.pageHistory.splice(-event, event);
			}
			
			var page = this.pageHistory.pop();
			page.backwards = true;
			
			switch(this.currentPage.originalAnimation) {
				case "slideLeft":
					page.animation = "slideRight";
					break;
				case "slideRight":
					page.animation = "slideLeft";
					break;
				case "popIn":
					page.animation = "popOut";
					break;
				case "none":
					page.animation = "none";
					break;
			}
			
			if (!page.invalidated) {
				console.debug("page not changed...");
				page.show();
			} else {
				console.debug("invalidated page...");
				// remove header buttons, they will be created again inside init method
				page.$leftHeaderButton = null;
				page.$rightHeaderButton = null;
				// unbind previously bound transition events
				page.$element.unbind("pageTransitionStart");
				page.$element.unbind("pageTransitionEnd");
				// set loading icon
				page.$element.html(ns.utils.loadingIndicatorDiv);
				// run page's generation
				page.init(page.pageParams);
				page.show();
				page.invalidated = false;
			}
		}
	};
	
	ns.AppView = AppView;
	
	/**
	 * Page Constructor
	 * 
	 * Constructs page. The page won't be shown immediately but will be appended
	 * to #pageWrapper with display:none property. To show the page invoke its
	 * show() method.
	 * 
	 * Methods:
	 * show()
	 *     Show the page with choosen animation
	 * addLeftHeaderButton(options)
	 *     Add left header button. If you add custom left header button, provide
	 *     another mean for going back.
	 * addRightHeaderButton(options)
	 *     Add right header button.
	 * 
	 * @param {Object} appView Instance of AppView
	 * @param {Object} options Options for new page
	 *   options (all options are optional):
	 *     id {String} id attribute that will be assigned to page element. If
	 *         another page element with the same id already exists, exception
	 *         will be thrown.
	 *     title {String} Title of the page. Will be shown at the top nav bar
	 *         when the page is viewed.
	 *     classAttr {String} class attributes separated by spaces that will be
	 *         assigned to page element.
	 *     pageParams {Object} parameters which will be passed to page init
	 *         method when user invalidates and then goes back to this page.
	 *     $element {jQuery} jQuery element that will be used for the page.
	 *     animation {String} animation for page transition
	 *         (default: "slideLeft")
	 *     slideButton {Boolean} If false, header buttons won't be animated with
	 *         default animation but only fade in and fade out.
	 *         (default: true)
	 *     backHeaderButtonLabel {String} Optional text for "Back" button, if
	 *         not specified, previous page title will be used as button label.
	 *         (default: null)
	 */
	Page = function(appView, options) {
		
		console.debug("Page(appView=", appView, ", options=", options, ")");
		
		var prop;
		
		this.pageOptions = {
			id: null,
			title: "",
			classAttr: "",
			pageParams: {},
			$element: $('<div>' + ns.utils.loadingIndicatorDiv + '</div>'),
			animation: "slideLeft",
			slideButtons: true,
			backHeaderButtonLabel: null
		};
		
		this.appView = appView;
		this.$element = null;
		
		// Merge default options values, passed in options will override
		if (options) {
			for (prop in options) {
				if (options.hasOwnProperty(prop) && this.pageOptions[prop] !== undefined) {
					this.pageOptions[prop] = options[prop];
				}
			}
		}
		
		// Check if page with given id already exists on the page.
		// Therefore, id property singletonifies page instance!
		if (options.id) {
			this.$element = $(".page#" + options.id);
			// If jQuery returned empty result, set back $element to null
			if (this.$element.length === 0) {
				this.$element = null;
			} else {
				throw "Page with giver id already exists! id=" + options.id;
			}
		}
		
		// The page should be constructed only if it doesn't exist in DOM.
		// If page wasn't found on the page, use default or passed in jQuery.
		// Otherwise, return already constructed page.
		if (this.$element === null) {
			this.state = null;
			this.$leftHeaderButton = null;
			this.$rightHeaderButton = null;
			this.invalidated = false;
			this.addToHistory = true;
			this.backwards = false;
			this.originalAnimation = null;
			
			this.$element = this.pageOptions.$element;
			this.$element.addClass("page");
			this.$element.data("pageInstance", this);
			this.element = this.$element.get(0);
			
			if (this.pageOptions.id) {
				this.$element.attr("id", this.pageOptions.id);
			}
			this.title = this.pageOptions.title;
			if (this.pageOptions.classAttr) {
				this.$element.addClass(this.pageOptions.classAttr);
			}
			this.pageParams = this.pageOptions.pageParams;
			this.animation = this.pageOptions.animation;
			this.backHeaderButtonLabel = this.pageOptions.backHeaderButtonLabel;
			
			// Check if page is in document tree by testing if it has a prant node.
			// If not, add it to the pageWrapper.
			if (!this.$element.parent().length) {
				$("#pageWrapper").append(this.$element);
			}
		} else {
			return this.$element.data("pageInstance");
		}
	};
	
	Page.prototype = {
		constructor: Page,
		
		init: function() {
			// Should be overriden by subclass
		},
		
		refreshIScroll: function(element) {
			var $scroller = (element && $(element) || this.$element).find(".scroller"),
				$wrapper,
				wrapperHeight,
				scrollerMinHeight,
				iscroll;
			
			if ($scroller.length) {
				// Calculate scroller min-height
				$wrapper = $scroller.parent(".wrapper");
				wrapperHeight = $wrapper.height();
				scrollerMinHeight = wrapperHeight;
				$scroller.css("min-height", scrollerMinHeight + "px");
				
				// Check if iScroll already initiated on current scroller element
				if (!$scroller.data("iscroll")) {
					iscroll = new iScroll($wrapper.get(0), {
						"checkDOMChanges": false
					});
					$scroller.get(0).immediateClickIScroll = iscroll;
					$scroller.data("iscroll", iscroll);
				} else {
					window.setTimeout(function () {
						$scroller.data("iscroll").refresh();
					}, 0);
				}
				// Prevent iScroll from catching START_EVENT on input and select
				// and preventing it's default action of focusing (needed only for
				// desktop mode).
				$scroller.find("input, select, textarea").bind(ns.utils.START_EVENT, function(event) {
					event.stopPropagation();
				});
			}
		},
		
		refresh: function() {
			this.refreshIScroll();
		},
		
		addLeftHeaderButton: function(options) {
			console.debug("Page.addLeftHeaderButton(options=", options, ")");
			
			var divElm,
				$leftHeaderButton;// = typeof leftHeaderButton === "string" ? $(leftHeaderButton) : leftHeaderButton;
			
			if (this.$leftHeaderButton) {
				console.warn("Can't add left header button, button already exists!");
				return false;
			}
			
			options = options || {};
			
			function onLeftHeaderAnimationEnd(event) {
				var leftHeaderButtonElm = $leftHeaderButton.get(0);
				if (leftHeaderButtonElm) {
					leftHeaderButtonElm.removeEventListener('webkitAnimationEnd', onLeftHeaderAnimationEnd, false);
					$leftHeaderButton.removeClass("fade in");
				}
			}
			
			divElm = document.createElement("div");
			divElm.className = options.className || "";
			divElm.textContent = options.text || "";
			$leftHeaderButton = $(divElm);
			
			$leftHeaderButton.addClass("leftHeaderButton headerButton ellipsis");
			this.$leftHeaderButton = $leftHeaderButton;
			if (this.state === "shown" || this.state === "slidingIn") {
				console.debug("prepending left header button to the header");
				$("#header").prepend($leftHeaderButton);
				$leftHeaderButton.get(0).style.display = "block";
//				this.appView.setTitleWidth();
				$leftHeaderButton.get(0).addEventListener('webkitAnimationEnd', onLeftHeaderAnimationEnd, false);
				$leftHeaderButton.addClass("fade in");
			}
			return $leftHeaderButton;
		},
		
		removeLeftHeaderButton: function() {
			console.debug("Page.removeLeftHeaderButton()");
			
			if (!this.$leftHeaderButton) {
				console.warn("Can't remove left header button, button doesn't exist!");
				return false;
			}
			
			this.$leftHeaderButton.remove();
			this.$leftHeaderButton = null;
		},
		
		addRightHeaderButton: function(options) {
			console.debug("Page.addRightHeaderButton(options=", options, ")");
			
			var divElm,
				$rightHeaderButton;// = typeof rightHeaderButton === "string" ? $(rightHeaderButton) : rightHeaderButton;
			
			if (this.$rightHeaderButton) {
				console.warn("Can't add left header button, button already exists!");
				return false;
			}
			
			options = options || {};
			
			function onRightHeaderAnimationEnd(event) {
				var rightHeaderButtonElm = $rightHeaderButton.get(0);
				if (rightHeaderButtonElm) {
					rightHeaderButtonElm.removeEventListener('webkitAnimationEnd', onRightHeaderAnimationEnd, false);
					$rightHeaderButton.removeClass("fade in");
				}
			}
			
			divElm = document.createElement("div");
			divElm.className = options.className || "";
			divElm.textContent = options.text || "";
			$rightHeaderButton = $(divElm);
			
			$rightHeaderButton.addClass("rightHeaderButton headerButton ellipsis");
			this.$rightHeaderButton = $rightHeaderButton;
			if (this.state === "shown" || this.state === "slidingIn") {
				console.debug("appending right header button to the header");
				$("#header").append($rightHeaderButton);
				$rightHeaderButton.get(0).style.display = "block";
//				this.appView.setTitleWidth();
				$rightHeaderButton.get(0).addEventListener('webkitAnimationEnd', onRightHeaderAnimationEnd, false);
				$rightHeaderButton.addClass("fade in");
			}
			return $rightHeaderButton;
		},
		
		removeRightHeaderButton: function() {
			console.debug("Page.removeRightHeaderButton()");
			
			if (!this.$rightHeaderButton) {
				console.warn("Can't remove right header button, button doesn't exist!");
				return false;
			}
			
			this.$rightHeaderButton.remove();
			this.$rightHeaderButton = null;
		},
		
		destroy: function() {
			console.debug("Page.destroy()");
			
			this.$element.removeData("pageInstance");
			this.$element.remove();
			this.state = null;
			this.destroyed = true;
			this.pageParams = null;
			if (this.$leftHeaderButton) {
				this.$leftHeaderButton.remove();
				this.$leftHeaderButton = null;
			}
			if (this.$rightHeaderButton) {
				this.$rightHeaderButton.remove();
				this.$rightHeaderButton = null;
			}
		},
		
		show: function() {
			console.debug("Page.show()");
			
			var self = this,
				pageElm = this.$element.get(0),
				$newTitle = $(".pageTitle.new"),
				newTitleElm = $newTitle.get(0),
				$oldTitle = $(".pageTitle.current"),
				oldTitleElm = $oldTitle.get(0),
				oldPage = this.appView.currentPage,
				$oldPage = null,
				oldPageElm = null,
				// Header Buttons
				$newLeftHeaderButton = this.$leftHeaderButton,
				newLeftHeaderButtonElm = $newLeftHeaderButton ? $newLeftHeaderButton.get(0) : null,
				$newRightHeaderButton = this.$rightHeaderButton,
				newRightHeaderButtonElm = $newRightHeaderButton ? $newRightHeaderButton.get(0) : null,
				$oldLeftHeaderButton = null,
				currentLeftHeaderButtonElm = null,
				$oldRightHeaderButton = null,
				currentRightHeaderButtonElm = null,
				animatedElements = [],
				titleAnimationClass = "",
				headerButtonAnimationClass = "";
			
			this.appView.blockUI();
			
			function onNewPageTransitionEnd(event) {
				console.debug("onNewPageTransitionEnd...");
				
				// Old Title
				// -------------
				oldTitleElm.style.display = "none";
				
				// Old Left Header Button
				// --------------------------
				if ($oldLeftHeaderButton) {
					currentLeftHeaderButtonElm.style.display = "none";
					$oldLeftHeaderButton.detach();
				}
	
				// Old Right Header Button
				// ---------------------------
				if ($oldRightHeaderButton) {
					currentRightHeaderButtonElm.style.display = "none";
					$oldRightHeaderButton.detach();
				}
				
				// Old Page
				// -------------
				oldPageElm.removeEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
				oldPageElm.style.display = "none";
				oldPage.state = "hidden";
				
				// New Page
				// ---------
				pageElm.removeEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
				self.state = "shown";
				
				// Remove all animation classes
				self.$element.removeClass("slideLeft slideRight pop fade in go");
				$oldPage.removeClass("slideLeft slideRight pop fade out go");
				$newTitle.removeClass("slideLeft slideRight slideUp slideDown fade in go");
				$oldTitle.removeClass("slideLeft slideRight slideUp slideDown fade out go");
				if ($newLeftHeaderButton) {
					$newLeftHeaderButton.removeClass("slideLeftWide slideRightWide slideUp slideDown fade in go");
				}
				if ($oldLeftHeaderButton) {
					$oldLeftHeaderButton.removeClass("slideLeftWide slideRightWide slideUp slideDown fade out go");
				}
				if ($newRightHeaderButton) {
					$newRightHeaderButton.removeClass("slideLeftWide slideRightWide slideUp slideDown fade in go");
				}
				if ($oldRightHeaderButton) {
					$oldRightHeaderButton.removeClass("slideLeftWide slideRightWide slideUp slideDown fade out go");
				}
				
				self.refresh();
				self.appView.unblockUI();
				
				self.$element.trigger("pageTransitionEnd");
				$oldPage.trigger("pageTransitionEnd");
	
				// Remove pages which are not in history, except the current page.
				$("#pageWrapper .page").each(function(index, element) {
					if (!ns.utils.inArray($(element).data("pageInstance"), self.appView.pageHistory) && element !== pageElm) {
						$(element).data("pageInstance").destroy();
					}
				});
			}
			
			// Set appView variable "currentPage" to new page
			this.appView.currentPage = this;
			
			if (oldPage) {
				console.debug("begin sliding pages...");
				
				$oldPage = oldPage.$element;
				oldPageElm = $oldPage.get(0);
				
				$oldLeftHeaderButton = oldPage.$leftHeaderButton;
				currentLeftHeaderButtonElm = $oldLeftHeaderButton ? $oldLeftHeaderButton.get(0) : null;
				$oldRightHeaderButton = oldPage.$rightHeaderButton;
				currentRightHeaderButtonElm = $oldRightHeaderButton ? $oldRightHeaderButton.get(0) : null;
				
				if (this.addToHistory && !this.backwards) {
					this.appView.pageHistory.push(oldPage);
				}
				
				// Initialize "Back" left header button
				// If Left Header Button wasn't stored in page's data before,
				// and we have at least one page in history, create new "Back"
				// button.
				if (!$newLeftHeaderButton && this.appView.pageHistory.length) {
					if (this.backHeaderButtonLabel) {
						$newLeftHeaderButton = this.addLeftHeaderButton({
							"text": this.backHeaderButtonLabel
						});
					} else {
						$newLeftHeaderButton = this.addLeftHeaderButton({
							"className": "back",
							"text": this.appView.pageHistory[this.appView.pageHistory.length - 1].title || "Back"
						});
					}
					newLeftHeaderButtonElm = $newLeftHeaderButton.get(0);
					$newLeftHeaderButton.bindImmediateClick(function (event) {
						self.appView.goBack();
					}, {
						removePressedClassOnRelease: false
					});
				}
				
				this.state = "slidingIn";
				oldPage.state = "slidingOut";
				
				switch(this.animation) {
					case "slideLeft":
						pageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						this.$element.addClass("slideLeft in");
						$oldPage.addClass("slideLeft out");
						animatedElements = [pageElm, oldPageElm];
						titleAnimationClass = "slideLeft";
						headerButtonAnimationClass = this.slideButtons ? "slideLeftWide" : '';
						break;
					case "slideRight":
						pageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						this.$element.addClass("slideRight in");
						$oldPage.addClass("slideRight out");
						animatedElements = [pageElm, oldPageElm];
						titleAnimationClass = "slideRight";
						headerButtonAnimationClass = this.slideButtons ? "slideRightWide" : '';
						break;
					case "popIn":
						pageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						this.$element.addClass("pop fade in");
						animatedElements = [pageElm];
						break;
					case "popOut":
						oldPageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						$oldPage.addClass("pop fade out");
						animatedElements = [oldPageElm];
						break;
				}
				
				$newTitle.addClass(titleAnimationClass + " fade in");
				$oldTitle.addClass(titleAnimationClass + " fade out");
				animatedElements.push(newTitleElm);
				animatedElements.push(oldTitleElm);
				
				if ($oldLeftHeaderButton) {
					$oldLeftHeaderButton.addClass(headerButtonAnimationClass + " fade out");
					animatedElements.push(currentLeftHeaderButtonElm);
				}
				if ($newLeftHeaderButton) {
					$newLeftHeaderButton.addClass(headerButtonAnimationClass + " fade in");
					animatedElements.push(newLeftHeaderButtonElm);
				}
				if ($oldRightHeaderButton) {
					$oldRightHeaderButton.addClass(headerButtonAnimationClass + " fade out");
					animatedElements.push(currentRightHeaderButtonElm);
				}
				if ($newRightHeaderButton) {
					$newRightHeaderButton.addClass(headerButtonAnimationClass + " fade in");
					animatedElements.push(newRightHeaderButtonElm);
				}
				
				pageElm.style.display = "block";
	
				newTitleElm.innerHTML = this.title;
				newTitleElm.style.display = "block";
				
				$newTitle.removeClass("new");
				$newTitle.addClass("current");
				$oldTitle.removeClass("current");
				$oldTitle.addClass("new");
				
				if ($newLeftHeaderButton) {
					$newLeftHeaderButton.prependTo($("#header"));
					newLeftHeaderButtonElm.style.display = "block";
				}
				
				// Initialize right header button
				if ($newRightHeaderButton) {
					$newRightHeaderButton.appendTo($("#header"));
					newRightHeaderButtonElm.style.display = "block";
				}
				
//				this.appView.setTitleWidth();
				
				// Blur all input elements on the current page
				$oldPage.find("textarea, input, select").blur();
				
				if (this.originalAnimation === null) {
					this.originalAnimation = this.animation;
				}
				
				this.$element.trigger("pageTransitionStart");
				$oldPage.trigger("pageTransitionStart");
				
				if (this.animation === "none") {
					onNewPageTransitionEnd();
				} else {
					window.setTimeout(function() {
						$(animatedElements).addClass("go");
					}, 0);
				}
			} else {
				// In case this is the first page to show don't use slide animation
				// just show the page.
				this.state = "shown";
				$oldTitle.text(this.title);
				this.$element.show();
				
				// Initialize left header button
				if ($newLeftHeaderButton) {
					$newLeftHeaderButton.prependTo($("#header"));
					newLeftHeaderButtonElm.style.display = "block";
				}
				
				// Initialize right header button
				if ($newRightHeaderButton) {
					$newRightHeaderButton.appendTo($("#header"));
					newRightHeaderButtonElm.style.display = "block";
				}
				
//				this.appView.setTitleWidth();
				
				this.$element.trigger("pageTransitionStart");
				this.refresh();
				this.appView.unblockUI();
				this.$element.trigger("pageTransitionEnd");
			}
		}

	};
	
	ns.Page = Page;
	
}(facetagram));

/*jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, maxerr: 50, indent: 4 */

facetagram = window.facetagram || {};

(function(ns) {

	ns.prototype.AppView = function() {
		
		var self = this,
			currentPage = null,
			pageHistory = [],
			isIphone = navigator.appVersion.match(/iphone/gi) ? true : false,
			isIpad = navigator.appVersion.match(/ipad/gi) ? true : false,
			isAndroid = navigator.appVersion.match(/android/gi) ? true : false,
			isTouch = isIphone || isIpad || isAndroid,
			loadingIndicatorDiv = '<div class="loadingIndicator"><span class="bar bar_1"></span><span class="bar bar_2"></span><span class="bar bar_3"></span><span class="bar bar_4"></span><span class="bar bar_5"></span><span class="bar bar_6"></span><span class="bar bar_7"></span><span class="bar bar_8"></span><span class="bar bar_9"></span><span class="bar bar_10"></span><span class="bar bar_11"></span><span class="bar bar_12"></span></div>',
			$uiBlocker;
		
		this.START_EVENT = isTouch ? 'touchstart' : 'mousedown';
		this.MOVE_EVENT = isTouch ? 'touchmove' : 'mousemove';
		this.END_EVENT = isTouch ? 'touchend' : 'mouseup';
		this.isTouch = isTouch;
		this.loadingIndicatorDiv = loadingIndicatorDiv;
		this.setDimensionsOnResize = true;
		
		// Prevent iPhone's touchmove default behavior so it will not drag the
		// whole browser's screen. As required by iScroll - http://cubiq.org/iscroll
		document.addEventListener('touchmove', function(e) {
			e.preventDefault();
		});
		
		function preloadImages() {
			$.each(ns.conf.IMAGES_TO_PRELOAD, function(index, imageUrl) {
				var image = new Image();
				image.src = imageUrl;
			});
		}
		
	//	preloadImages();
		
		// Write html sructure to body
		function renderBody() {
			$("body").html(
				'<div id="header" class="header">' +
				    '<div class="pageTitle ellipsis current"></div>' +
					'<div class="pageTitle ellipsis new"></div>' +
				'</div>' +
				'<div id="pagelWrapper"></div>' +
				'<div id="footer"></div>' +
				'<div id="uiBlocker"></div>'
			);
			$uiBlocker = $("#uiBlocker");
			$uiBlocker.css({
				"width": window.innerWidth + "px",
				"height": window.innerHeight + "px"
			});
		}
		
		function setDimensions() {
			$("#pageWrapper").height(window.innerHeight - $("#header").outerHeight() - $("#footer").outerHeight());
			if (currentPage) {
				self.refreshIScroll(currentPage.$page);
			}
		}
		
		renderBody();
		setDimensions();
		
	//	document.addEventListener('orientationchange', function(e) {
	//		if (self.setDimensionsOnResize) {
	//			setDimensions();
	//		}
	//	});
	
		window.addEventListener('resize', function(e) {
			if (self.setDimensionsOnResize) {
				setDimensions();
			}
		});
		
		// ------------------------------------------------------------------
		// ------------------------- Public Methods -------------------------
		// ------------------------------------------------------------------
		
		this.getCurrentPage = function() {
			return currentPage;
		};
		
		this.clearHistory = function() {
			pageHistory = [];
		};
		
		this.getHistoryLength = function() {
			return pageHistory.length;
		};
		
		this.blockUI = function(loadingIndicator) {
			if (loadingIndicator) {
				$uiBlocker.html(loadingIndicatorDiv);
				$uiBlocker.addClass("loading");
			}
			$uiBlocker.show();
		};
		
		this.unblockUI = function() {
			$uiBlocker.hide();
			if ($uiBlocker.hasClass("loading")) {
				$uiBlocker.empty();
				$uiBlocker.removeClass("loading");
			}
		};
		
		/**
		 * <p>If template wasn't loaded before loads template via AJAX and appends it 
		 * to &lt;head&gt; element inside &lt;script$gt; tag for future use.
		 * Also uses internal caching mechanism of the template engine.</p>
		 * 
		 * @param {string} template name of the template file without ".html"
		 * @return {template} instance
		 */
		this.getTemplate = function(template, data) {
			console.debug("ns.view.getTemplate(template=" + template + ")");
			var fn = function(data) {
				console.debug("template function(data=", data, ")");
				var html;
				data = $.extend(true, data, {"strings": ns.conf.strings});
				try {
					console.debug("template data: ", data);
					html = tmpl(template, data);
				} catch (e) {
					console.error("Error in " + template + " template: " + e.name + ": " + e.message);
				}
				return html;
				
			};
			return data ? fn(data) : fn;
		};
		
		/**
		 * Desynchronize all pages stored in pageHistory array.
		 * This action causes each desynchronized page to invoke it's controller
		 * which requests new data from API server and then renders new page
		 * instead of showing old content when back button clicked.
		 */
		this.desynchronizePageHistory = function() {
			$.each(pageHistory, function(indexInArray, page) {
				page.desynchronized = true;
			});
		};
		
		/**
		 * <p>Goes back to previous page in history, as if user clicked back button.
		 * If previous page in history desynchronized, then appropriate controller
		 * executed to load fresh data, otherwise old page page slid into view
		 * unchanged.</p>
		 */
		this.goBack = function(event) {
			console.debug("ns.view.goBack(event=", event, ")");
			if (event !== undefined && typeof event === "number") {
				pageHistory.splice(-event, event);
			}
			
			$(this).addClass("pressed");
			
			var page = pageHistory.pop();
			page.addToHistory = false;
			page.backwards = true;
			switch(currentPage.originalAnimation) {
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
			if (!page.desynchronized) {
				console.debug("page not changed...");
	//			ns.controller.loadedPageCount++;
				page.show();
			} else {
				console.debug("desynchronized page...");
				// remove header buttons, they will be created again throught controller
				page.$leftHeaderButton = null;
				page.$rightHeaderButton = null;
				// unbind previously bound transition events
				page.$page.unbind("pageTransitionStart");
				page.$page.unbind("pageTransitionEnd");
				// set loading icon
				page.$page.html(loadingIndicatorDiv);
				// run page's render
				page.render(page.pageParams);
				page.desynchronized = false;
			}
		};
		
		/**
		 * <p>Checks if given page (i.e.: $page), has a &lt;div class="scroller"&gt;.
		 * If this div is found, checks if it already has iScroll instance and 
		 * refreshes it, otherwise creates new iScroll instance and adds it to
		 * this div as jQuery data.</p>
		 * 
		 * @param {jquery} $page jQuery object of &ltdiv class="page"&gt;
		 */
		this.refreshIScroll =  function($page) {
			console.debug("ns.view.refreshIScroll()");
			var $scroller = $page.find(".scroller"),
				$wrapper, wrapperHeight, scrollerMinHeight,
				scroller;
			
			if ($scroller.length) {
				// Calculate scroller min-height
				$wrapper = $scroller.parent(".wrapper");
				wrapperHeight = $wrapper.height();
				scrollerMinHeight = wrapperHeight;
				$scroller.css("min-height", scrollerMinHeight + "px");
				
				// Check if iScroll already initiated on current scroller element
				if (!$scroller.data("scroller")) {
					scroller = new iScroll($scroller.get(0), {
						"desktopCompatibility": true,
						"checkDOMChanges": false //,
						//"bounceLock": true
					});
					$scroller.data("scroller", scroller);
				} else {
					window.setTimeout(function () { $scroller.data("scroller").refresh(); }, 0);
				}
				// Prevent iScroll from catching START_EVENT on input and select
				// and preventing it's default action of focusing (needed only for
				// desktop mode).
				$scroller.find("input, select, textarea").bind(self.START_EVENT, function(event) {
					event.stopPropagation();
				});
			}
		};
		
		this.Page = function(options) {
			console.debug("Page(options=", options, ")");
			
			var defaultOptions = {
					id: "",
					title: "",
					classAttr: "",
					pageParams: {},
					$page: $('<div>' + loadingIndicatorDiv + '</div>'),
					animation: "slideLeft",
					render: function() {}
				};
			
			// Merge default options values, passed in options will override
			options = $.extend(defaultOptions, options);
			
			function setPageOptions(page) {
				page.pageParams = options.pageParams;
				page.animation = options.animation;
				page.render = options.render;
				page.title = options.title;
				if (options.id) {
					page.$page.attr("id", options.id);
				}
				if (options.classAttr) {
					page.$page.addClass(options.classAttr);
				}
			}
			
			this.$page = null;
			
			// Check if page with given id already exists on the page
			if (options.id) {
				this.$page = $(".page#" + options.id);
			}
			
			// The page should be constructed only if it doesn't exists.
			// If page wasn't found on the page, use default or passed in jQuery.
			// Otherwise, return already constructed page.
			if (this.$page === null || !this.$page.length) {
				
				this.state = null;
				this.$leftHeaderButton = null;
				this.$rightHeaderButton = null;
				this.desynchronized = false;
				this.addToHistory = true;
				this.backwards = false;
				this.originalAnimation = null;
				
				this.$page = options.$page;
				this.$page.addClass("page");
				this.$page.data("page", this);
				
				setPageOptions(this);
				
				// Check if page is in document tree by testing if it has a prant node.
				// If not, add it to the pageWrapper.
				if (!this.$page.parent().length) {
					$("#pageWrapper").append(this.$page);
				}
			} else {
				return this.$page.data("page");
			}
		};
		
		this.Page.prototype.destroy = function() {
			console.debug("Page.destroy()");
			console.debug("destroying page: ", this);
			this.$page.remove();
			this.$page = null;
			this.state = null;
			if (this.$leftHeaderButton) {
				this.$leftHeaderButton.remove();
				this.$leftHeaderButton = null;
			}
			if (this.$rightHeaderButton) {
				this.$rightHeaderButton.remove();
				this.$rightHeaderButton = null;
			}
		};
		
		/*
		this.Page.prototype.addTitle = function(title) {
			console.debug("Page.addTitle(title=", title, ")");
			var pageState = this.state;
			this.title = title;
			if (pageState === "shown" || pageState === "slidingIn") {
				$("#header .pageTitle.current").get(0).textContent = title;
			}
		};
		*/
		
		/**
		 * <p>Adds left header button to the page.<br/>
		 * If the $page is shown (i.e.: already slid into view or sliding right now)
		 * then the button appended instantly. Otherwise it is added to the page
		 * object and when show() will be invoked for this page, the button
		 * will be slid in with graceful animation.</p>
		 * 
		 * @param {string,jQuery} leftHeaderButton html string or jQuery object
		 * of the left header button.<br/>
		 * Example:<br/>
		 * <pre style="font-size:12px; font-family:monospace">&lt;div class="rightHeaderButton add"&gt;&lt;/div&gt;</pre>
		 * @return {jQuery} jQuery of Left Header Button
		 */
		this.Page.prototype.addLeftHeaderButton = function(leftHeaderButton) {
			console.debug("Page.addLeftHeaderButton(leftHeaderButton=", leftHeaderButton, ")");
			
			var pageState = this.state,
				$leftHeaderButton = typeof leftHeaderButton === "string" ? $(leftHeaderButton) : leftHeaderButton;
			
			function onLeftHeaderAnimationEnd(event) {
				var leftHeaderButtonElm = $leftHeaderButton.get(0);
				if (leftHeaderButtonElm) {
					leftHeaderButtonElm.removeEventListener('webkitAnimationEnd', onLeftHeaderAnimationEnd, false);
					$leftHeaderButton.removeClass("fade in");
				}
			}
			
			$leftHeaderButton.addClass("leftHeaderButton headerButton ellipsis");
			this.$leftHeaderButton = $leftHeaderButton;
			if (pageState === "shown" || pageState === "slidingIn") {
				console.debug("prepending left header button to the header");
				$("#header").prepend($leftHeaderButton);
				$leftHeaderButton.get(0).style.display = "block";
//				setTitleWidth();
				$leftHeaderButton.get(0).addEventListener('webkitAnimationEnd', onLeftHeaderAnimationEnd, false);
				$leftHeaderButton.addClass("fade in");
			}
			return $leftHeaderButton;
		};
		
		/**
		 * <p>Adds right header button to the page.<br/>
		 * If the $page is shown (i.e.: already slid into view or sliding right now)
		 * then the button appended instantly. Otherwise it is added to the page
		 * object and when show() will be invoked for this page, the button
		 * will be slid in with graceful animation.</p>
		 * 
		 * @param {string,jQuery} rightHeaderButton html string or jQuery object
		 * of the right header button.<br/>
		 * Example:<br/>
		 * <pre style="font-size:12px; font-family:monospace">&lt;div class="rightHeaderButton add"&gt;&lt;/div&gt;</pre>
		 * @return {jQuery} jQuery of Right Header Button
		 */
		this.Page.prototype.addRightHeaderButton = function(rightHeaderButton) {
			console.debug("Page.addRightHeaderButton(rightHeaderButton=", rightHeaderButton, ")");
			
			var pageState = this.state,
				$rightHeaderButton = typeof rightHeaderButton === "string" ? $(rightHeaderButton) : rightHeaderButton;
			
			function onRightHeaderAnimationEnd(event) {
				var rightHeaderButtonElm = $rightHeaderButton.get(0);
				if (rightHeaderButtonElm) {
					rightHeaderButtonElm.removeEventListener('webkitAnimationEnd', onRightHeaderAnimationEnd, false);
					$rightHeaderButton.removeClass("fade in");
				}
			}
			
			$rightHeaderButton.addClass("rightHeaderButton headerButton ellipsis");
			this.$rightHeaderButton = $rightHeaderButton;
			if (pageState === "shown" || pageState === "slidingIn") {
				console.debug("appending right header button to the header");
				$("#header").append($rightHeaderButton);
				$rightHeaderButton.get(0).style.display = "block";
//				setTitleWidth();
				$rightHeaderButton.get(0).addEventListener('webkitAnimationEnd', onRightHeaderAnimationEnd, false);
				$rightHeaderButton.addClass("fade in");
			}
			return $rightHeaderButton;
		};
		
		/**
		 * <p>This method shows application page by sliding it into view.<br/>
		 * You should ensure that the page have some content in it. If you don't
		 * have page data yet, then you can show a loading indicator, by injecting
		 * loading image into the page page before running this function, and when
		 * the data arrives you can just inject the new content (although it won't
		 * be animated then).<br/>
		 * To animate right header button together with rest of page contents you
		 * should run ns.view.addRightHeaderButton() method before running this
		 * method.</p>
		 * 
		 * <p>If &lt;div&gt; with pageId has descendant element with class="scroller".
		 * If such an element found ns.view.refreshIScroll() invoked on the page.</p>
		 * 
		 * @param {Object} options Options object of key - value pairs for the page:
		 * <ol>
		 *   <li>string</li> <b>id</b>: Id attribute of the page page.
		 *   <li>boolean <b>addToHistory</b>: If true, adds current page to history and
		 *   displays back button with title of current page on new page.</li>
		 *   <li>boolean <b>backwards</b>: If true, new page will be slided from left to
		 *   right.</li>
		 *   <li>string <b>leftHeaderButtonLabel</b>: Text shown on left header button.
		 *   If specified the button will be rectangular. If not specified, title of
		 *   previous page will be used as button label.</li>
		 *   <li>string <b>title</b>: Title of the page. If not specified value of pages
		 *   title attribute will be used.</li>
		 *   <li>string <b>classAttr</b>: Class attribute of the page page. More than
		 *   one class may be added at a time, separated by a space. The "page"
		 *   class will be added automatically.</li>
		 *   <li>jQuery <b>$page</b>: jQuery of the page.</li>
		 * </ol>
		 */
		this.Page.prototype.show = function(options) {
			console.debug("Page.show(options=", options, ")");
			var defaultOptions = {
					leftHeaderButtonLabel: null
				},
				page = this,
				$page = this.$page,
				$newTitle = $(".pageTitle.new"),
				newTitleElm = $newTitle.get(0),
				$currentTitle = $(".pageTitle.current"),
				currentTitleElm = $currentTitle.get(0),
				_currentPage = currentPage,
				$currentPage = _currentPage ? _currentPage.$page : null,
				currentPageElm = $currentPage ? $currentPage.get(0) : null,
				pageElm = $page.get(0),
				// Header Buttons
				$newLeftHeaderButton = this.$leftHeaderButton,
				newLeftHeaderButtonElm = $newLeftHeaderButton ? $newLeftHeaderButton.get(0) : null,
				$currentLeftHeaderButton = $("#header").find(".leftHeaderButton"),
				currentLeftHeaderButtonElm = $currentLeftHeaderButton.get(0),
				$newRightHeaderButton = this.$rightHeaderButton,
				newRightHeaderButtonElm = $newRightHeaderButton ? $newRightHeaderButton.get(0) : null,
				$currentRightHeaderButton = $("#header").find(".rightHeaderButton"),
				currentRightHeaderButtonElm = $currentRightHeaderButton.get(0),
				animatedElements = [];
			
			// Merge default options values, passed in options will override
			options = $.extend(defaultOptions, options);
			
			self.blockUI();
			
			function onNewPageTransitionEnd(event) {
				console.debug("onNewPageTransitionEnd...");
				
				// New Title
				// ---------
				//newTitleElm.style.webkitTransitionDuration = "0";
				//$newTitle.addClass("current");
				
				// Current Title
				// -------------
				currentTitleElm.style.display = "none";
				$currentTitle.addClass("new");
				//currentTitleElm.style.webkitTransitionDuration = "0";
				
				// New Left Header Button
				// ----------------------
				//if ($newLeftHeaderButton) {
				//	newLeftHeaderButtonElm.style.webkitTransitionDuration = "0";
				//}
	
				// Current Left Header Button
				// --------------------------
				if ($currentLeftHeaderButton.length) {
					currentLeftHeaderButtonElm.style.display = "none";
					//currentLeftHeaderButtonElm.style.webkitTransitionDuration = "0";
					_currentPage.$leftHeaderButton = $currentLeftHeaderButton;
					$currentLeftHeaderButton.detach();
				}
	
				// New Right Header Button
				// -----------------------
				//if ($newRightHeaderButton) {
				//	newRightHeaderButtonElm.style.webkitTransitionDuration = "0";
				//}
	
				// Current Right Header Button
				// ---------------------------
				if ($currentRightHeaderButton.length) {
					currentRightHeaderButtonElm.style.display = "none";
					//currentRightHeaderButtonElm.style.webkitTransitionDuration = "0";
					_currentPage.$rightHeaderButton = $currentRightHeaderButton;
					$currentRightHeaderButton.detach();
				}
				
				// Current Page
				// -------------
				currentPageElm.style.display = "none";
				//currentPageElm.style.webkitTransitionDuration = "0";
				_currentPage.state = "hidden";
				
				// New Page
				// ---------
				//pageElm.removeEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
				pageElm.removeEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
				currentPageElm.removeEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
				//pageElm.style.webkitTransitionDuration = "0";
				page.state = "shown";
				
				// Remove all animation classes
				$page.removeClass("slideLeftIn slideRightIn popIn fadeIn go");
				$currentPage.removeClass("slideLeftOut slideRightOut popOut fadeOut go");
				$newTitle.removeClass("slideLeftIn slideRightIn slideUpIn slideDownIn fadeIn go");
				$currentTitle.removeClass("slideLeftOut slideRightOut slideUpOut slideDownOut fadeOut go");
				if ($newLeftHeaderButton) {
					$newLeftHeaderButton.removeClass("slideLeftInWide slideRightInWide slideUpIn slideDownIn fadeIn go");
				}
				$currentLeftHeaderButton.removeClass("slideLeftOutWide slideRightOutWide slideUpOut slideDownOut fadeOut go");
				if ($newRightHeaderButton) {
					$newRightHeaderButton.removeClass("slideLeftInWide slideRightInWide slideUpIn slideDownIn fadeIn go");
				}
				$currentRightHeaderButton.removeClass("slideLeftOutWide slideRightOutWide slideUpOut slideDownOut fadeOut go");
				
				self.refreshIScroll($page);
				self.unblockUI();
				
				$page.trigger("pageTransitionEnd");
				$currentPage.trigger("pageTransitionEnd");
	
				// Remove pages which are not in history, except the current page.
				$("#pageWrapper .page").each(function(index, element) {
					if (!ns.utils.inArray($(element).data("page"), pageHistory) && element !== pageElm) {
						$(element).data("page").destroy();
					}
				});
			}
			
			// Set global variable "currentPage" to new page
			currentPage = page;
			
			if (_currentPage) {
				console.debug("begin sliding pages...");
				
				if (page.addToHistory && !page.backwards) {
					pageHistory.push(_currentPage);
				}
				
				// Initialize left header button
				// If Left Header Button wasn't stored in $page's data before,
				// and we have at least one page in history, create new "Back"
				// button.
				if (!$newLeftHeaderButton && pageHistory.length) {
					if (options.leftHeaderButtonLabel) {
						$newLeftHeaderButton = page.addLeftHeaderButton('<div>' + options.leftHeaderButtonLabel + '</div>');
					} else {
	// TODO: back left header button
					}
					newLeftHeaderButtonElm = $newLeftHeaderButton.get(0);
					// triggerEvents: true - for changing canvas button pressed state
					$newLeftHeaderButton.bindImmediateClick(self.goBack, {"triggerEvents": true});
				}
				
				page.state = "slidingIn";
				_currentPage.state = "slidingOut";
				
				switch(page.animation) {
					case "slideLeft":
						pageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						$page.addClass("slideLeftIn");
						$currentPage.addClass("slideLeftOut");
						$newTitle.addClass("slideLeftIn fadeIn");
						$currentTitle.addClass("slideLeftOut fadeOut");
						animatedElements = [pageElm, currentPageElm, newTitleElm, currentTitleElm];
						if (currentLeftHeaderButtonElm) {
							$currentLeftHeaderButton.addClass("slideLeftOutWide fadeOut");
							animatedElements.push(currentLeftHeaderButtonElm);
						}
						if ($newLeftHeaderButton) {
							$newLeftHeaderButton.addClass("slideLeftInWide fadeIn");
							animatedElements.push(newLeftHeaderButtonElm);
						}
						if (currentRightHeaderButtonElm) {
							$currentRightHeaderButton.addClass("slideLeftOutWide fadeOut");
							animatedElements.push(currentRightHeaderButtonElm);
						}
						if ($newRightHeaderButton) {
							$newRightHeaderButton.addClass("slideLeftInWide fadeIn");
							animatedElements.push(newRightHeaderButtonElm);
						}
						break;
					case "slideRight":
						pageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						$page.addClass("slideRightIn");
						$currentPage.addClass("slideRightOut");
						$newTitle.addClass("slideRightIn fadeIn");
						$currentTitle.addClass("slideRightOut fadeOut");
						animatedElements = [pageElm, currentPageElm, newTitleElm, currentTitleElm];
						if (currentLeftHeaderButtonElm) {
							$currentLeftHeaderButton.addClass("slideRightOutWide fadeOut");
							animatedElements.push(currentLeftHeaderButtonElm);
						}
						if ($newLeftHeaderButton) {
							$newLeftHeaderButton.addClass("slideRightInWide fadeIn");
							animatedElements.push(newLeftHeaderButtonElm);
						}
						if (currentRightHeaderButtonElm) {
							$currentRightHeaderButton.addClass("slideRightOutWide fadeOut");
							animatedElements.push(currentRightHeaderButtonElm);
						}
						if ($newRightHeaderButton) {
							$newRightHeaderButton.addClass("slideRightInWide fadeIn");
							animatedElements.push(newRightHeaderButtonElm);
						}
						break;
					case "popIn":
						pageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						$page.addClass("popIn fadeIn");
						$newTitle.addClass("fadeIn");
						$currentTitle.addClass("fadeOut");
						animatedElements = [pageElm, newTitleElm, currentTitleElm];
						if (currentLeftHeaderButtonElm) {
							$currentLeftHeaderButton.addClass("fadeOut");
							animatedElements.push(currentLeftHeaderButtonElm);
						}
						if ($newLeftHeaderButton) {
							$newLeftHeaderButton.addClass("fadeIn");
							animatedElements.push(newLeftHeaderButtonElm);
						}
						if (currentRightHeaderButtonElm) {
							$currentRightHeaderButton.addClass("fadeOut");
							animatedElements.push(currentRightHeaderButtonElm);
						}
						if ($newRightHeaderButton) {
							$newRightHeaderButton.addClass("fadeIn");
							animatedElements.push(newRightHeaderButtonElm);
						}
						break;
					case "popOut":
						currentPageElm.addEventListener('webkitTransitionEnd', onNewPageTransitionEnd, false);
						$currentPage.addClass("popOut fadeOut");
						$newTitle.addClass("fadeIn");
						$currentTitle.addClass("fadeOut");
						animatedElements = [currentPageElm, newTitleElm, currentTitleElm];
						if (currentLeftHeaderButtonElm) {
							$currentLeftHeaderButton.addClass("fadeOut");
							animatedElements.push(currentLeftHeaderButtonElm);
						}
						if ($newLeftHeaderButton) {
							$newLeftHeaderButton.addClass("fadeIn");
							animatedElements.push(newLeftHeaderButtonElm);
						}
						if (currentRightHeaderButtonElm) {
							$currentRightHeaderButton.addClass("fadeOut");
							animatedElements.push(currentRightHeaderButtonElm);
						}
						if ($newRightHeaderButton) {
							$newRightHeaderButton.addClass("fadeIn");
							animatedElements.push(newRightHeaderButtonElm);
						}
						break;
				}
				
				pageElm.style.display = "block";
	
				newTitleElm.innerHTML = page.title || "";
				newTitleElm.style.display = "block";
				
				$newTitle.removeClass("new");
				$newTitle.addClass("current");
				$currentTitle.removeClass("current");
				
				if ($newLeftHeaderButton) {
					$newLeftHeaderButton.prependTo($("#header"));
					newLeftHeaderButtonElm.style.display = "block";
				}
				
				// Initialize right header button
				if ($newRightHeaderButton) {
					$newRightHeaderButton.appendTo($("#header"));
					newRightHeaderButtonElm.style.display = "block";
				}
				
//				setTitleWidth();
				
				$page.trigger("pageTransitionStart");
				$currentPage.trigger("pageTransitionStart");
				
				// Blur all input elements on the current page
				$currentPage.find("textarea, input, select").blur();
				
				if (page.originalAnimation === null) {
					page.originalAnimation = page.animation;
				}
				
				$(animatedElements).addClass("go");
				
				if (page.animation === "none") {
					onNewPageTransitionEnd();
				}
			} else {
				// In case this is the first page to show don't use slide animation
				// just show the page.
				this.state = "shown";
				$currentTitle.text(page.title);
				$page.show();
				
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
				
//				setTitleWidth();
				
				$page.trigger("pageTransitionStart");
				self.refreshIScroll($page);
				self.unblockUI();
				$page.trigger("pageTransitionEnd");
			}
		};
	};

}(facetagram));

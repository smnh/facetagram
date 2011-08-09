/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console, iScroll */

facetagram = window.facetagram || {};

(function(ns) {
	
	var AppView, Footer, Drawler;
	
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
		this.footer = new Footer(this);
		
		this.$pageWrapper = $("#pageWrapper");
		this.$uiBlocker = $("#uiBlocker");
		this.$uiBlocker.css({
			"width": window.innerWidth + "px",
			"height": window.innerHeight + "px"
		});
		
		this.setDimensions();
		
		this.imageLibrary = new ns.ImageLibrary({
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
			this.$pageWrapper.height(window.innerHeight - $("#header").outerHeight() - $("#footer").outerHeight());
			if (this.currentPage) {
				this.refreshIScroll(this.currentPage.$page);
			}
		},
		
		refreshIScroll: function($page) {
			var $scroller = $page.find(".scroller"),
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
						"desktopCompatibility": true,
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
		}
	};
	
	ns.AppView = AppView;
	
	Drawler = function(footer, menuItem) {
		
		var self = this, submenuItemId, submenuItemElm;
		
		this.footer = footer;
		this.appView = this.footer.appView;
		
		this.element = document.createElement("div");
		this.element.className = "subMenuDrawler";
		this.element.style.left = menuItem.element.offsetLeft + "px";
		this.element.style.width = (menuItem.element.offsetWidth - 4) + "px";
		
		this.menuItem = menuItem;
		this.menuItem.opened = true;
		$(this.menuItem.element).addClass("opened");
		
		this.submenuItemElms = [];
		
		for (submenuItemId in menuItem.submenu) {
			if (menuItem.submenu.hasOwnProperty(submenuItemId)) {
				submenuItemElm = document.createElement("div");
				submenuItemElm.className = "submenuItem";
				submenuItemElm.innerHTML = '' +
					'<div class="buttonWrapper">' +
						'<div class="icon ' + submenuItemId + (menuItem.selected === submenuItemId ? ' selected' : '') + '"></div>' +
						'<div class ="label">' + menuItem.submenu[submenuItemId].title + '</div>' +
					'</div>';
				
				this.submenuItemElms.push(submenuItemElm);
				
				this.bindSubmenuItemHandler(submenuItemElm, submenuItemId);
				
				this.element.appendChild(submenuItemElm);
			}
		}
		
		document.addEventListener(ns.utils.START_EVENT, this, false);
		
		this.footer.element.appendChild(this.element);
		
		this.show();
	};
	
	Drawler.prototype = {
		constructor: Drawler,
		
		destroy: function() {
			var i;
			
			this.menuItem.opened = false;
			
			for (i = 0; i < this.submenuItemElms.length; i++) {
				$(this.submenuItemElms[i]).unbindImmediateClick();
			}
			
			$(this.element).remove();
		},
		
		show: function() {
			var self = this;
			
			window.setTimeout(function() {
				$(self.element).addClass("slideUp");
			}, 0);
		},
		
		hide: function() {
			var self = this;
			
			this.element.addEventListener('webkitTransitionEnd', this, false);
			window.setTimeout(function() {
				$(self.menuItem.element).removeClass("opened");
				$(self.element).removeClass("slideUp");
			}, 0);
		},
		
		bindSubmenuItemHandler: function(submenuItemElm, submenuItemId) {
			var self = this;
			
			$(submenuItemElm).bindImmediateClick(function(event) {
				var newFilter = {};
				
				$(self.menuItem.icon).removeClass(self.menuItem.selected);
				self.menuItem.selected = submenuItemId;
				$(self.menuItem.icon).addClass(self.menuItem.selected);
				
				newFilter[self.menuItem.id] = self.menuItem.selected;
				self.appView.imageLibrary.showImages(newFilter);
				
				self.hide();
			});
		},
		
		handleEvent: function(event) {
			var self = this,
				_event = ns.utils.isTouch && event.changedTouches ? event.changedTouches[0] : event,
				target = _event.target,
				currentTarget = event.currentTarget;
			
			switch (event.type) {
				case ns.utils.START_EVENT:
					if ($(target).closest(".subMenuDrawler").length === 0 &&
						($(target).closest(".footerMenuItem").length === 0 || $(target).closest(".footerMenuItem").get(0) !== this.menuItem.element)) {
						document.removeEventListener(ns.utils.START_EVENT, this, false);
						this.hide();
					}
					break;
				case 'webkitTransitionEnd':
					this.element.removeEventListener('webkitTransitionEnd', this, false);
					this.destroy();
					break;
			}
		}
	};
	
	ns.Footer = Drawler;
	
	Footer = function(appView) {
		var self = this, prop, menuItemId, menuItem;
		
		this.appView = appView;
		
		this.menuItems = {
			"group": {
				id: "group",
				defaultMenuItem: "groupBoth",
				selected: null,
				opened: false,
				element: null,
				submenu: {
					"groupMany": {
						title: "Group"
					},
					"groupSingle": {
						title: "One Person"
					},
					"groupBoth": {
						title: "Both"
					}
				}
			},
			"gender": {
				id: "gender",
				defaultMenuItem: "genderBoth",
				selected: null,
				opened: false,
				element: null,
				submenu: {
					"genderMale": {
						title: "Guys"
					},
					"genderFemale": {
						title: "Gals"
					},
					"genderBoth": {
						title: "Both"
					}
				}
			},
			"mood": {
				id: "mood",
				defaultMenuItem: "moodAll",
				selected: null,
				opened: false,
				element: null,
				submenu: {
					"moodNeutral": {
						title: "Neutral"
					},
					"moodSurprised": {
						title: "Surprised"
					},
					"moodAngry": {
						title: "Angry"
					},
					"moodSad": {
						title: "Sad"
					},
					"moodHappy": {
						title: "Happy"
					},
					"moodAll": {
						title: "All Moods"
					}
				}
			},
			"location": {
				id: "location",
				element: null
			},
			"time": {
				id: "time",
				element: null
			}
		};
		
		this.element = $("#footer").get(0);
		this.$footerMenu = $("#footerMenu");
		
		for (prop in this.menuItems) {
			if (this.menuItems.hasOwnProperty(prop)) {
				if (this.menuItems[prop].submenu) {
					menuItemId = this.menuItems[prop].defaultMenuItem;
				} else {
					menuItemId = prop;
				}
				
				menuItem = this.menuItems[prop];
				
				menuItem.icon = $('<div class="icon ' + menuItemId + '"></div>').get(0);
				menuItem.element = $('<div class="footerMenuItem"></div>').get(0);
				menuItem.element.appendChild(menuItem.icon);
				
				if (this.menuItems[prop].submenu) {
					$(menuItem.element).addClass("drawable");
					this.menuItems[prop].selected = menuItemId;
					this.bindFooterMenuHandler(menuItem);
				}
				
				this.$footerMenu.append(menuItem.element);
			}
		}
	};
	
	Footer.prototype = {
		constructor: Footer,
		
		bindFooterMenuHandler: function(menuItem) {
			var self = this;
			
			$(menuItem.element).bindImmediateClick(function(event) {
				if (menuItem.opened) {
					return;
				}
				var drawler = new Drawler(self, menuItem);
			});
		}
	};
	
	ns.Footer = Footer;
	
})(facetagram);

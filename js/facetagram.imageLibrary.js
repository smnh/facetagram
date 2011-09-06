/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console */

facetagram = window.facetagram || {};

(function(ns) {
	
	var Drawler, Footer, ImageLibraryPage, SingleImagePage;
	
	Drawler = function(footer, menuItem) {
		
		var submenuItemId, submenuItemElm;
		
		this.footer = footer;
		
		this.element = document.createElement("div");
		this.element.className = "subMenuDrawler";
		this.element.style.left = menuItem.element.offsetLeft + "px";
		this.element.style.width = (menuItem.element.offsetWidth - 4) + "px";
		
		this.menuItem = menuItem;
		this.menuItem.opened = true;
		this.menuItem.drawler = this;
		$(this.menuItem.element).addClass("opened");
		
		this.submenuItemElms = [];
		
		for (submenuItemId in menuItem.submenu) {
			if (menuItem.submenu.hasOwnProperty(submenuItemId)) {
				submenuItemElm = document.createElement("div");
				submenuItemElm.className = "submenuItem";
				submenuItemElm.innerHTML =
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
			this.menuItem.drawler = null;
			
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
				self.footer.page.showImages(newFilter);
				
				self.hide();
			});
		},
		
		handleEvent: function(event) {
			var _event = ns.utils.isTouch && event.changedTouches ? event.changedTouches[0] : event,
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
	
	ns.Drawler = Drawler;
	
	Footer = function(page) {
		var prop, menuItemId, menuItem;
		
		this.page = page;
		
		this.menuItems = {
			"group": {
				id: "group",
				defaultMenuItem: "groupBoth",
				selected: null,
				opened: false,
				element: null,
				submenu: {
					"groupMany": {title: "Group"},
					"groupSingle": {title: "1 Person"},
					"groupBoth": {title: "Both"}
				}
			},
			"gender": {
				id: "gender",
				defaultMenuItem: "genderBoth",
				selected: null,
				opened: false,
				element: null,
				submenu: {
					"genderMale": {title: "Guys"},
					"genderFemale": {title: "Gals"},
					"genderBoth": {title: "Both"}
				}
			},
			"mood": {
				id: "mood",
				defaultMenuItem: "moodAll",
				selected: null,
				opened: false,
				element: null,
				submenu: {
					"moodNeutral": {title: "Neutral"},
					"moodSurprised": {title: "Surprised"},
					"moodAngry": {title: "Angry"},
					"moodSad": {title: "Sad"},
					"moodHappy": {title: "Happy"},
					"moodAll": {title: "All Moods"}
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
		
		this.element = document.createElement('div');
		this.element.id = 'footer';
		this.footerMenuElm = document.createElement('div');
		this.footerMenuElm.id = 'footerMenu';
		this.element.appendChild(this.footerMenuElm);
		
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
				
				this.footerMenuElm.appendChild(menuItem.element);
			}
		}
		
		this.page.element.appendChild(this.element);
	};
	
	Footer.prototype = {
		constructor: Footer,
		
		bindFooterMenuHandler: function(menuItem) {
			var self = this;
			
			$(menuItem.element).bindImmediateClick(function(event) {
				var drawler;
				
				if (menuItem.opened) {
					menuItem.drawler.hide();
				} else {
					drawler = new Drawler(self, menuItem);
				}
			});
		}
	};
	
	ns.Footer = Footer;
	
	/**
	 * ImageLibraryPage - Inherits from Page
	 */
	ImageLibraryPage = function(options) {
		
		var self = this;
		
		ns.Page.call(this, options.appView, {
			classAttr: 'imageGallery'
		});
		
		this.init();
		this.show();
		
        ns.ImageRepository.subscribe(function(images){
            self.appendImages(images);
            self.lastImageIndex = images.length;
        });
	};
	
	ns.utils.inheritPrototype(ImageLibraryPage, ns.Page, {
		
		init: function() {
			this.lastImageIndex = 0;
			this.loading = true;
			
			this.$wrapper = $('<div class="wrapper">' + ns.utils.loadingIndicatorDiv + '</div>');
			this.$scroller = $('<div class="scroller"></div>');
			this.$imageGallery = $('<div class="imageGallery"></div>');
			this.$scroller.append(this.$imageGallery);
			this.$element.empty();
			this.$element.append(this.$wrapper);
			this.footer = new Footer(this);
			
			this.filterOptions = {
				"group": this.footer.menuItems.group.defaultMenuItem,
				"gender": this.footer.menuItems.gender.defaultMenuItem,
				"mood": this.footer.menuItems.mood.defaultMenuItem
			};
			
			this.addLeftHeaderButton({
				className: "instagramLogin"
			}).bindImmediateClick(function(event) {
				window.location = "https://instagram.com/oauth/authorize/?client_id=" + ns.settings.instagramClientId + "&redirect_uri=" + encodeURIComponent(ns.settings.instagramCallbackUrl) + "&response_type=token";
			});
		},
		
		// Overwriting default refresh method
		refresh: function(event) {
			this.$wrapper.height(window.innerHeight - $("#header").outerHeight() - $(this.footer.element).outerHeight());
			this.appView.refreshIScroll(this.$element);
		},
		
		appendImage: function(image) {
			var self = this, thumbnailData, $imageWrapper;
			
		    thumbnailData = image.getThumbnail();
		    $imageWrapper = $('<div class="imageWrapper"><img src="' + thumbnailData.url + '" /></div>');
		    
		    $imageWrapper.bindImmediateClick(function(event) {
				var singleImageView = new SingleImagePage(image, self);
		    });
		    
		    this.$imageGallery.append($imageWrapper);
		},
		
		appendImages: function(images) {
			var i;
			
			if (this.loading) {
				this.loading = false;
				this.$wrapper.empty();
				this.$wrapper.append(this.$scroller);
			}
			
			if (images && images.length) {
				for (i = this.lastImageIndex; i < images.length; i++) {
                    if (this.filterImage(images[i])) {
						this.appendImage(images[i]);
                    }
				}
				
				this.appView.refreshIScroll(this.$element);
			}
		},
		
		showImages: function(filterOptions) {
			var prop, images = ns.ImageRepository.getImages(), i;
			
			if (filterOptions) {
				for (prop in filterOptions) {
					if (filterOptions.hasOwnProperty(prop) && this.filterOptions[prop] !== undefined) {
						this.filterOptions[prop] = filterOptions[prop];
					}
				}
			}
			
			if (this.loading) {
				return;
			}
			
			this.$imageGallery.empty();
			
			for (i = 0; i < images.length; i++) {
                if (this.filterImage(images[i])) {
				    this.appendImage(images[i]);
                }
			}
			
			this.appView.refreshIScroll(this.$element);
			this.lastImageIndex = images.length;
		},
		
		filterImage: function(image) {
			if (!image.hasFace()) {
				return false;
			}
			if (this.filterOptions.group === "groupMany" && !image.hasGroup()) {
				return false;
			}
			if (this.filterOptions.group === "groupSingle" && image.hasGroup()) {
				return false;
			}
			if (this.filterOptions.gender === "genderMale" && !image.hasMale()) {
				return false;
			}
			if (this.filterOptions.gender === "genderFemale" && !image.hasFemale()) {
				return false;
			}
			if (this.filterOptions.mood === "moodNeutral" && !image.hasNeutral()) {
				return false;
			}
			if (this.filterOptions.mood === "moodSurprised" && !image.hasSuprised()) {
				return false;
			}
			if (this.filterOptions.mood === "moodAngry" && !image.hasAngry()) {
				return false;
			}
			if (this.filterOptions.mood === "moodSad" && !image.hasSad()) {
				return false;
			}
			if (this.filterOptions.mood === "moodHappy" && !image.hasHappy()) {
				return false;
			}
			return true;
		}
	});
	
	ns.ImageLibraryPage = ImageLibraryPage;
	
	/**
	 * SingleImagePage - Inherits from Page
	 */
	SingleImagePage = function(image, imageLibrary) {
		
		ns.Page.call(this, imageLibrary.appView, {
			classAttr: 'singleImageView',
			withFooter: false,
			slideButtons: false
		});
		
		this.init(image);
		this.show();
	};
	
	ns.utils.inheritPrototype(SingleImagePage, ns.Page, {
		
		init: function(image) {
			console.debug("SingleImagePage.init(image=", image, ")");
			
			var self = this,
				caption = image.data.instagram.caption && image.data.instagram.caption.text ? image.data.instagram.caption.text : '',
				location = image.data.instagram.location && image.data.instagram.location.name ? image.data.instagram.location.name : '',
				groupClass, genderClass, moodClass,
				filtersHtml = '';
			
			if (image.hasGroup()) {
				groupClass = "groupMany";
			} else {
				groupClass = "groupSingle";
			}
			filtersHtml += '<div class="filter"><div class="icon ' + groupClass + '"></div></div>';
			
			if (image.hasMale() && image.hasFemale()) {
				genderClass = "genderBoth";
			} else if (image.hasMale()) {
				genderClass = "genderMale";
			} else {
				genderClass = "genderFemale";
			}
			filtersHtml += '<div class="filter"><div class="icon ' + genderClass + '"></div></div>';
			
			if (image.hasNeutral()) {
				moodClass = "moodNeutral";
			} else if (image.hasSuprised()) {
				moodClass = "moodSurprised";
			} else if (image.hasAngry()) {
				moodClass = "moodAngry";
			} else if (image.hasSad()) {
				moodClass = "moodSad";
			} else if (image.hasHappy()) {
				moodClass = "moodHappy";
			} else {
				moodClass = "moodAll";
			}
			filtersHtml += '<div class="filter"><div class="icon ' + moodClass + '"></div></div>';
			
			self.$element.empty();
			self.$element.append(
				'<div class="wrapper">' +
					'<div class="scroller">' +
						'<div class="imageWrapper">' + ns.utils.loadingIndicatorDiv + '</div>' +
						(caption ? '<div class="imageTitle">' + caption + '</div>' : '') +
						(location ? '<div class="location">Taken at: ' + location + '</div>' : '') +
						'<div class="imageFilters">' + filtersHtml + '</div>' +
					'</div>' +
				'</div>'
			);
			
			this.$element.one("pageTransitionEnd", function(event) {
				var _image = new Image();
				
				_image.onload = function(event) {
					this.removeEventListener('load');
					// In case user clicks back and destorys the page before
					// image has been loaded.
					if (self.destroyed) {
						return;
					}
					self.$element.find('.imageWrapper')
						.empty()
						.append('<img src="' + _image.src + '" alt="' + caption + '" />');
				};
				
				_image.src = image.getLowResImage().url;
			});
			
		}
		
	});
	
}(facetagram));

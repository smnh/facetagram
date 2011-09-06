/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console */

facetagram = window.facetagram || {};

(function(ns) {
	
	var ImageLibraryPage, SingleImagePage;
	
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
			this.filterOptions = {
				"group": this.appView.footer.menuItems.group.defaultMenuItem,
				"gender": this.appView.footer.menuItems.gender.defaultMenuItem,
				"mood": this.appView.footer.menuItems.mood.defaultMenuItem
			};
			
			this.lastImageIndex = 0;
			this.loading = true;
			
			this.$wrapper = $('<div class="wrapper"></div>');
			this.$scroller = $('<div class="scroller"></div>');
			this.$imageGallery = $('<div class="imageGallery"></div>');
			
			this.$scroller.append(this.$imageGallery);
			this.$wrapper.append(this.$scroller);
			
			this.addLeftHeaderButton({
				className: "instagramLogin"
			}).bindImmediateClick(function(event) {
				window.location = "https://instagram.com/oauth/authorize/?client_id=" + instagramApiKey + "&redirect_uri=" + window.location.href.replace(/#.*/, "") + "&response_type=token";
			});
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
				this.$element.empty();
				this.$element.append(this.$wrapper);
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
					if (this.filterOptions[prop] !== undefined) {
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
				'<div class="imageWrapper">' + ns.utils.loadingIndicatorDiv + '</div>' +
				(caption ? '<div class="imageTitle">' + caption + '</div>' : '') +
				(location ? '<div class="location">Taken at: ' + location + '</div>' : '') +
				'<div class="imageFilters">' + filtersHtml + '</div>'
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
	
})(facetagram);

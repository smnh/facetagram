/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console */

facetagram = window.facetagram || {};

(function(ns) {
	
	var ImageLibrary = function(options) {
		
		var self = this;
		
		this.appView = options.appView;
		this.lastImageIndex = 0;
		this.loading = true;
		this.$page = $('<div class="page">' + ns.utils.loadingIndicatorDiv + '</div>');
		this.$wrapper = $('<div class="wrapper"></div>');
		this.$scroller = $('<div class="scroller"></div>');
		this.$imageGallery = $('<div class="imageGallery"></div>');
		
		this.filterOptions = {
			"group": this.appView.footer.menuItems.group.defaultMenuItem,
			"gender": this.appView.footer.menuItems.gender.defaultMenuItem,
			"mood": this.appView.footer.menuItems.mood.defaultMenuItem
		};
		
		this.$scroller.append(this.$imageGallery);
		this.$wrapper.append(this.$scroller);
		
		this.appView.$pageWrapper.append(this.$page);
		
		this.$page.show();
		
        ns.ImageRepository.subscribe(function(images){
			
            self.appendImages(images);
            self.lastImageIndex = images.length;

        });
	};
	
	ImageLibrary.prototype = {
		constructor: ImageLibrary,
		
		appendImage: function(image) {
			var thumbnailData, $imageWrapper;
			
		    thumbnailData = image.getThumbnail();
		    $imageWrapper = $('<div class="imageWrapper"><img src="' + thumbnailData.url + '" /></div>');
		    this.$imageGallery.append($imageWrapper);
		},
		
		appendImages: function(images) {
			var i;
			
			if (this.loading) {
				this.loading = false;
				this.$page.empty();
				this.$page.append(this.$wrapper);
			}
			
			if (images && images.length) {
				for (i = this.lastImageIndex; i < images.length; i++) {
                    if (this.filterImage(images[i])) {
						this.appendImage(images[i]);
                    }
				}
				
				this.appView.refreshIScroll(this.$page);
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
			
			this.appView.refreshIScroll(this.$page);
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
		
	};
	
	ns.ImageLibrary = ImageLibrary;
	
})(facetagram);

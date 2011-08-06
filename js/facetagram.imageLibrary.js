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
		
		this.$scroller.append(this.$imageGallery);
		this.$wrapper.append(this.$scroller);
		
		this.appView.$pageWrapper.append(this.$page);

		this.$page.show();
		
        ns.ImageRepository.subscribe(function(images){
			
            self.showImages(images);
            self.lastImageIndex = images.length;

        });
	};
	
	ImageLibrary.prototype = {
		constructor: ImageLibrary,
		
		showImages: function(images) {
			var i,
				thumbnailData,
				$imageWrapper;
			
			if (this.loading) {
				this.loading = false;
				this.$page.empty();
				this.$page.append(this.$wrapper);
			}
			
			if (images && images.length) {
				for (i = this.lastImageIndex; i < images.length; i++) {
                    if (images[i].hasFace()) {
					    thumbnailData = images[i].getThumbnail();
					    $imageWrapper = $('<div class="imageWrapper"><img src="' + thumbnailData.url + '" /></div>');
					    this.$imageGallery.append($imageWrapper);
                    }
				}
				
				this.appView.refreshIScroll(this.$page);
			}
		}
	};
	
	ns.ImageLibrary = ImageLibrary;
	
})(facetagram);

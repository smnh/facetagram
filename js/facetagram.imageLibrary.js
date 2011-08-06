facetagram = window.facetagram || {};

(function(ns) {
	
	var ImageLibrary = function(options) {
		
		var self = this;
		
		this.appView = options.appView;
		this.element = options.appView.$pageWrapper.get(0);
		this.lastImageIndex = 0;
		this.$imageGallery = $('<div class="imageGallery page"><div class="wrapper"></div></div>');
		this.$scroller = $('<div class="scroller"></div>');
		
		this.$imageGallery.find('.wrapper').append(this.$scroller);
		$(this.element).append(this.$imageGallery);
		
		this.$imageGallery.show();
		
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
			
			if (images && images.length) {
				for (i = this.lastImageIndex; i < images.length; i++) {
                    if (images[i].hasFace()) {
					    thumbnailData = images[i].getThumbnail();
					    $imageWrapper = $('<div class="imageWrapper"><img src="' + thumbnailData.url + '" /></div>');
					    this.$scroller.append($imageWrapper);
                    }
				}
				
				this.appView.refreshIScroll(this.$imageGallery);
			}
		}
	};
	
	ns.ImageLibrary = ImageLibrary;
	
})(facetagram);

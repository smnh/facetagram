facetagram = window.facetagram || {};

(function(ns) {
	
	var ImageLibrary = function() {
		
	};
	
	ImageLibrary.prototype = {
		constructor: ImageLibrary,
		
		element: document.getElementById("imageGallery"),
		
		showImages: function() {
			ns.api.get(function(data) {
				//console.debug(data);
				var $imageGallery = $("#imageGallery"),
					i, $imageWrapper;
				
				if (data && data.length) {
					for (i = 0; i < data.length; i++) {
                        if (data[i].hasMale())
                        {
						    thumbnailData = data[i].getThumbnail();
						    $imageWrapper = $('<div class="imageWrapper"><img src="' + thumbnailData.url + '" width="' + thumbnailData.width + '" height="' + thumbnailData.height + '"/></div>');
						    $imageGallery.append($imageWrapper);
                        }
					}
					//$imageGallery.append('<div style="clear: left;"></div>');
				}
				
				
				
			}, this);
		}
	};
	
	ns.ImageLibrary = ImageLibrary;
	
})(facetagram);

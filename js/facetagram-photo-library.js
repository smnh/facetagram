facetagram = window.facetagram || {};

(function(ns) {
	
	var ImageLibrary = function() {
		
        

	};
	


	ImageLibrary.prototype = {
		constructor: ImageLibrary,
		
		element: document.getElementById("imageGallery"),
		
		showImages: function() {
			
            var lastIndex = 0;

            facetagram.ImageRepository.subscribe(function(images){
                
                draw(images);
                lastIndex = images.length;

            });
            return;
            function draw(images)
            {

				var $imageGallery = $("#imageGallery"),
					i, $imageWrapper;
				
				if (images && images.length) {
					for (i = lastIndex; i < images.length; i++) {
                        if (images[i].hasFace())
                        {
						    thumbnailData = images[i].getThumbnail();
						    $imageWrapper = $('<div class="imageWrapper"><img src="' + thumbnailData.url + '" width="' + thumbnailData.width + '" height="' + thumbnailData.height + '"/></div>');
						    $imageGallery.append($imageWrapper);
                        }
					}
					//$imageGallery.append('<div style="clear: left;"></div>');
				}
            }
		}
	};
	
	ns.ImageLibrary = ImageLibrary;
	
})(facetagram);

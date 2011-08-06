if (facetagram.utils.isTouch && top != window)
	top.location.href = 'frame.html';

$(function() {
	
	var view = new facetagram.AppView(),
		imageLibrary;
	
	imageLibrary = new facetagram.ImageLibrary({
		appView: view
	});
});

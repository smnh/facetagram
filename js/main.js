$(function() {
	
	var view = new facetagram.AppView(),
		imageLibrary;
//	
//	photoLibraryPage = new view.Page({
//		"id": "photoLibrary",
//		"title": "Photo Library",
//		"render": function() {
//			var page = this;
//			
//			page.$page.html("Hello World!");
//			
//			page.show();
//		}
//	});
//	
//	photoLibraryPage.render();
	
	imageLibrary = new facetagram.ImageLibrary({
		appView: view
	});
	imageLibrary.showImages();
});

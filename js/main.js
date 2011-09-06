/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console, iScroll */

if (facetagram.utils.isTouch && top != window) {
	top.location.href = 'frame.html';
}

$(function() {
	
	var accessToken = null;
	
	if ('standalone' in navigator && !navigator.standalone && (/iphone|ipod|ipad/gi).test(navigator.platform) && (/Safari/i).test(navigator.appVersion)) {
		window.addToHomeConfig = {
			touchIcon: true,
			message: 'Install FaceSnaps web app on your %device: tap %icon and then <strong>Add to Home Screen</strong>.'
		};
		$("head").append('<link rel="stylesheet" type="text/css" href="css/add2home.css" />');
		$("head").append('<script type="text/javascript" src="js/add2home.js"></script>');
	}
	
	accessToken = window.location.href.match(/access_token=([^&]*)/);
	if (accessToken) {
		facetagram.settings.instagramAccessToken = accessToken[1];
		facetagram.settings.signedIntoInstagram = true;
	}
	
	var view = new facetagram.AppView();
});

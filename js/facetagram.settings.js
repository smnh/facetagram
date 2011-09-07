/* jslint browser: true, sloppy: true, windows: true, white: true, nomen: true, maxerr: 50, indent: 4 */
/*global facetagram: true, window, $, console */

facetagram = window.facetagram || {};

(function(ns) {
	
	ns.settings = {
		instagramClientId: "9df7cea39cf34156b2d2e1b4b7a1c0ae",
		instagramAccessToken: null,
		signedIntoInstagram: false,
		instagramCallbackUrl: "http://facesnaps.com/oauthRedirectPage.html"
	};
	
})(facetagram);

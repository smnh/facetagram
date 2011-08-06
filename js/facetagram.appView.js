facetagram = window.facetagram || {};

(function(ns) {
	
	var AppView = function() {
		
		var self = this;
		
		// Prevent iPhone's touchmove default behavior so it will not drag the
		// whole browser's screen. As required by iScroll - http://cubiq.org/iscroll
		document.addEventListener('touchmove', function(e) {
			e.preventDefault();
		});
		
		window.addEventListener('resize', function(e) {
			self.setDimensions();
		});
		
		this.currentPage = null;
		
		$("body").html(
			'<div id="header" class="header"></div>' +
			'<div id="pageWrapper"></div>' +
			'<div id="footer"></div>' +
			'<div id="uiBlocker"></div>'
		);
		
		this.$pageWrapper = $("#pageWrapper");
		this.$uiBlocker = $("#uiBlocker");
		this.$uiBlocker.css({
			"width": window.innerWidth + "px",
			"height": window.innerHeight + "px"
		});
		
		this.setDimensions();
	};
	
	AppView.prototype = {
		constructor: AppView,
		
		element: document.getElementById("imageGallery"),
		
		blockUI: function(loadingIndicator) {
			if (loadingIndicator) {
				this.$uiBlocker.html(loadingIndicatorDiv);
				this.$uiBlocker.addClass("loading");
			}
			this.$uiBlocker.show();
		},
		
		unblockUI: function() {
			this.$uiBlocker.hide();
			if (this.$uiBlocker.hasClass("loading")) {
				this.$uiBlocker.empty();
				this.$uiBlocker.removeClass("loading");
			}
		},
		
		setDimensions: function() {
			this.$pageWrapper.height(window.innerHeight - $("#header").outerHeight() - $("#footer").outerHeight());
			if (this.currentPage) {
				self.refreshIScroll(this.currentPage.$page);
			}
		},
		
		refreshIScroll: function($page) {
			var $scroller = $page.find(".scroller"),
				$wrapper,
				wrapperHeight,
				scrollerMinHeight,
				scroller;
			
			if ($scroller.length) {
				// Calculate scroller min-height
				$wrapper = $scroller.parent(".wrapper");
				wrapperHeight = $wrapper.height();
				scrollerMinHeight = wrapperHeight;
				$scroller.css("min-height", scrollerMinHeight + "px");
				
				// Check if iScroll already initiated on current scroller element
				if (!$scroller.data("scroller")) {
					scroller = new iScroll($wrapper.get(0), {
						"desktopCompatibility": true,
						"checkDOMChanges": false
					});
					$scroller.data("scroller", scroller);
				} else {
					window.setTimeout(function () { $scroller.data("scroller").refresh(); }, 0);
				}
				// Prevent iScroll from catching START_EVENT on input and select
				// and preventing it's default action of focusing (needed only for
				// desktop mode).
				$scroller.find("input, select, textarea").bind(ns.utils.START_EVENT, function(event) {
					event.stopPropagation();
				});
			}
		}
	};
	
	ns.AppView = AppView;
	
})(facetagram);

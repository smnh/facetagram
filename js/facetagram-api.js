        var instagramToken = "8de4638ef797472989d88b1133f9203a";
		
		facetagram = window.facetagram || {};
		
        facetagram.api = (function (instagramToken, faceToken) {
                var instagramApiUrl = "https://api.instagram.com/v1/media/search?client_id=" + instagramToken;
                var location = "";

                return {
                    get: _get
                };

                function _get(callback, scope) {
	                if (navigator.geolocation)
	                    navigator.geolocation.getCurrentPosition(function (position) { location = position; _callInstagram(callback, scope);});
                };


                function _callInstagram(_callback, _scope) {

                    var url = instagramApiUrl;

                    if (location)
                        url += "&lat=" + location.coords.latitude + "&lng=" + location.coords.longitude;

                    $.ajax({ type: "GET",
                        dataType: "jsonp",
                        cache: false,
                        url: url,
                        success: function (data) {
                            if (data && data.meta && data.meta.code == 400)
                                alert(data.meta.error_message);
                            else
                                _callback.call(_scope, data);
                        }
                    });
                };

            })(instagramToken, "");

        function getPhotos()
        {
            FaceTagram.api.get(function (data) {

                for (var i = 0, len = data.data.length; i < len; i++) {

                    var img = document.createElement("img");
                    img.src = data.data[i].images.thumbnail.url;
                    document.body.appendChild(img);

                }

            }, this);
        }
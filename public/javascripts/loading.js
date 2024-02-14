
var loader = (function($clz){
	$clz.init();
	$($clz.onLoad);
	return $clz;
})((function(){
	var preventReload = true;
	var isLoading = false;
	return {
		init: function(){
			window.onbeforeunload = function(e){
				if(preventReload && isLoading){
					return true;
				}
			}
			document.onkeydown = function(){
				if(preventReload && isLoading) {
					if( (event.ctrlKey == true && (event.keyCode === 78 || event.keyCode === 82)) || (event.keyCode === 116) ) {
						event.keyCode = 0;
						event.cancelBubble = true;
						event.returnValue = false;
					} 
				}
			}
		},
		onLoad: function(){
			$("body").prepend('<div class="loader"></div><section class="loader-layout"></section>');
		},
		setStyle: function(style){
			$(".loader").addClass(style);
		},
		setReload: function(is){
			if(is === false){
				preventReload = false;
			} else {
				preventReload = true;
			}
		},
		on: function(cb){
			isLoading = true;
			$(".loader").addClass("on");
			$(".loader-layout").addClass("on");
			if(cb !== null && typeof cb === "function"){
				cb.call(this);
			}
		},
		off: function(cb){
			isLoading = false;
			$(".loader").removeClass("on");
			$(".loader-layout").removeClass("on");
			if(cb !== null && typeof cb === "function"){
				cb.call(this);
			}
		}
	}
})());
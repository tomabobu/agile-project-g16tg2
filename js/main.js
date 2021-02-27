
var navbar = document.getElementById("navbar");
if (navbar) {
	var sticky = navbar.offsetTop;
}
function stickyClass() {
	if (window.pageYOffset >= sticky) {
		navbar.classList.add("fixed-top")
	} else {
		navbar.classList.remove("fixed-top");
	}
}

$(document).ready(function () {
	$(window).scroll(function () {
		if (navbar) {
			stickyClass();
		}
		var scrollTop = $(window).scrollTop();
		var divam = 6;
		$(".custom-cake-form-background").css({
			"background-position": "0px -" + scrollTop / divam + "px"
		});
	});
});
$(document).ready(function(){		
	var galleryShown = false;
	$(".controls .edit .gallery").hide();
	
	$(".controls").on("click", ".function:not(.current)", function(){
		var curFunc = $(this).closest(".function"); // curretnly equals to $(this)
		var hidden = '<div class="hidden"></div>';
		// workaround strange obj.prevAll().wrapAll() behaviuor (reverse order)
		function _prevAll(obj){
			var first = obj.siblings().addBack().first().not(obj);
			return first.nextUntil(obj).add(first);
		}
		_prevAll(curFunc).wrapAll(hidden);
		curFunc.nextAll().wrapAll(hidden);
		curFunc.closest(".controls")
			.find(".edit")
				.slideDown()
			.end()
			.find(".hidden")
				.slideUp()
			.end();
		curFunc.addClass("current");
		curFunc.find(".editor").prop("contenteditable", "true").focus();
	});
	$(".controls .edit .button")
		.filter(".slide")
			.click(function(){
				$(this).closest(".edit").find(".gallery").slideToggle();
				galleryShown = !galleryShown;
				$(this).text((galleryShown?"Hide":"Show") + " functions");
			})
		.end()
		.filter(".go")
			.click(function(){
				$(this).closest(".controls")
					.find(".hidden")
						.slideDown(function(){
							$(this).children().unwrap();
						})
					.end()
					.find(".current")
						.removeClass("current")
						.find(".editor")
							.prop("contenteditable", "false")
						.end()
					.end()
					.find(".edit")
						.slideUp()
					.end();
			})
		.end();
	
	var graph = $("#graph");
	var canvas = new Canvas();
	canvas.attachCanvas("graph");
	$(window).resize(function(){
		graph
			.attr("width", graph.parent().width())
			.attr("height", graph.parent().height());
		canvas.resize();
	}).resize();
	canvas.addFunction().setExpression('x*x'); //.setColor("#000000").toggleEnabled(true);
	canvas.redraw();
});

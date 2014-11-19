$(document).ready(function(){
	
	var galleryShown = false;
	$(".controls .edit .gallery").hide();
	
	$(".controls").on("click", ".function:not(.current) p", function(){
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
			.find(".add")
				.wrapAll(hidden)
			.end()
			.find(".edit")
				.slideDown()
			.end()
			.find(".hidden")
				.slideUp()
			.end();
		curFunc.addClass("current");
		curFunc.find(".editor").prop("contenteditable", "true").focus();
	});
    
    $('.controls').on("input", '.function .input-color input[type="color"]', function(){
        var $this = $(this);
        $this.closest('.input-color').css("background-color", $this.val());        
		var ind = $this.closest(".function").data("funcs-index");
		funcs[ind].setColor($this.val());
		canvas.redraw();
    });
	
	funcs = new Array();
	var graph = $("#graph");
	var canvas = new Canvas();
	canvas.attachCanvas("graph");
	
	$(".controls .add").click(function(){
		var fBody = '3*x+3';
		var newFunc = canvas.addFunction();
		newFunc.setExpression(fBody);
		var fHtml = $('<li class="function" data-funcs-index="' +	funcs.length + '">' +
			'<p>y=<span class="editor">' + fBody + '</span></p>' +
            '<div class="input-color"><input type="color"/></div></li>');
		$(this).closest(".controls").find("ul").append(fHtml);
		funcs.push(newFunc);
        fHtml.find('input[type="color"]').val("#ff5555").trigger("input");
		canvas.redraw();
	});
	$(".controls").on("input", ".function .editor", function(){
		var $this = $(this);
		var ind = $this.closest(".function").data("funcs-index");
		funcs[ind].setExpression($this.text());
		canvas.redraw();
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
	
	$(window).resize(function(){
		graph
			.attr("width", graph.parent().width())
			.attr("height", graph.parent().height());
		canvas.resize();
	}).resize();
	graph
		.on("mousedown", function(event){ canvas.startScroll(event.originalEvent) })
		.on("mousemove", function(event){ canvas.scroll(event.originalEvent) })
		.on("mouseup", function(event){ canvas.endScroll() })
		.on("mouseover", function(event){ canvas.endScroll() })
		.on("dblclick", function(event){ canvas.center() })
		.on("wheel", function(event){ canvas.zoom(event.originalEvent) })
		.on("touchstart", function(event){ canvas.startTouchScroll(event.originalEvent) })
		.on("touchmove", function(event){ canvas.touchScroll(event.originalEvent) })
		.on("touchend", function(event){ canvas.endScroll() })
		.on("touchcansel", function(event){ canvas.endScroll() });
});

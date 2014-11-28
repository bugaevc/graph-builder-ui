var canvas = new Canvas();
var graph;

function workCurrent(el) {
    el.siblings().not(el).toggleClass("grey");
    el.toggleClass("current");
}

function makeCurrent(el) {
    finishCurrent(function(){
        workCurrent(el);
        el.find(".editor textarea").focus();
        var func = canvas.getFunction(el.data("funcs-index"));
        var color = func.color;
        var enabled = func.enabled;
        $(".edit")
            .appendTo(el).slideDown()
            .find("input")
                .filter('[type="color"]')
                    .spectrum("set", color)
                .end()
                .filter('[type="checkbox"]')
                    .prop("checked", enabled)
                .end();
    });
}

function finishCurrent(callback) {
    callback = callback || $.noop;
    var el = $(".controls .function.current");
    if(el.length === 0)
    {
        callback();
        return;
    }
    workCurrent(el);
    $(".edit").slideUp("fast", function(){
        $(this).appendTo(el.closest(".controls"));
        callback();
    });
}

var spectrum_options = {
    showPaletteOnly: true,
    togglePaletteOnly: true,
    hideAfterPaletteSelect: true,
    showButtons: false,
    color: "#6FA8DC",
    togglePaletteMoreText: 'More',
    togglePaletteLessText: 'Less',
    replacerClassName: 'color-input',
    palette: [
    ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
    ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
    ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
    ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
    ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
    ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
    ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
    ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
    ],
    change: function(color) {
        var ind = $(this).closest(".function").data("funcs-index");
        canvas.getFunction(ind).setColor(color);
        canvas.redraw();
    }
};

$(document).ready(function(){
    $(".controls .edit")
        .hide()
        .find(".gallery")
            .hide()
        .end()
        .find('input[type="color"]')
            .spectrum(spectrum_options)
        .end();
	
	graph = $("#graph");
	canvas.attachCanvas("graph");
    
	$(window).resize(function(){
        // Magic!
        // We shrink the canvas so that it doesn't affect its container size
        // Then calculate its size and the restore canvas size back
        graph
        .attr("width", 1)
        .attr("height", 1)
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
	
	$(".controls .add").click(function(){
		var fBody = '3x+2';
		var newFunc = canvas.addFunction();
        var fHtml = $(this).closest(".controls").find("ul .template").clone();
		$(this).closest(".controls").find("ul").append(fHtml);
        fHtml
            .hide()
            .removeClass("template")
            .addClass("function")
            .data("funcs-index", canvas.functions.length)
            .find(".editor")
                .html(fBody)
                .mathquill('editable')
                .change()
            .end()
            .slideDown(function() { makeCurrent(fHtml); });
            
		canvas.redraw();
	});
    
    $('.controls').on("change", '.function .options input[type="checkbox"]', function(){
        var $this = $(this);
        var ind = $this.closest(".function").data("funcs-index");
        canvas.getFunction(ind).toggleEnabled($this.prop("checked"));
        canvas.redraw();
    });
    $('.controls').on("click", '.function .options .remove', function(){
        var $function = $(this).closest(".function");
        var ind = $function.data("funcs-index");
        canvas.deleteFunction(ind);
        canvas.redraw();
        var editPanel = $(this).closest(".controls").find(".edit");
        if(editPanel.filter(":visible").length > 0)
            editPanel.find(".buttons .go").click();
        $function.nextAll().find(".function").addBack().filter(".function").each(function(){
            $(this).data("funcs-index", $(this).data("funcs-index")-1);
        });
        $function.slideUp(function(){
            $function.remove();
        });
    });
    
	$(".controls").on("click", ".function p", function(){
		var curFunc = $(this).closest(".function");
        if(curFunc.hasClass("current"))
            return;
        makeCurrent(curFunc);
	});

	$(".controls").on("input keydown keypress keyup change", ".function .editor", function(){
		var $this = $(this);
		var ind = $this.closest(".function").data("funcs-index");
        var latex = $this.mathquill("latex");
		canvas.getFunction(ind).setExpression(latex_parser.parse(latex));
		canvas.redraw();
	});
	$(".controls .edit .buttons")
		.find(".slide")
			.click(function(){
				$(this).closest(".edit").find(".gallery").slideToggle();
				$(this).find("i")
                    .toggleClass("fa-angle-double-down")
                    .toggleClass("fa-angle-double-up");
			})
		.end()
		.find(".go")
			.click(function(){finishCurrent(); })
		.end();
});

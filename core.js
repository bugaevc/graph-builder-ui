/* Core of GraphBuilder app (http://anton.kroko.ru/GraphBuiler/), version 1.1.
 * License: WTFPL (http://www.wtfpl.net/about/).
 * By Anton Listov, 2013-2014.
 */

var delta = 0.001; //constant, needed for calculating limits and differentials



//     FFF   U  U   N  N    CC    tTTTt   i    OO    N  N         CC    L      aAAA     SSs     SSs      //
//     F     U  U   N  N   C  C     T     I   O  O   N  N        C  C   L      A   A   S       S         //
//     FFF   U  U   NN N   C        T     I   O  O   NN N        C      L      AAAAA    SSS     SSS      //
//     F     U  U   N NN   C        T     I   O  O   N NN        C      L      A   A       S       S     //
//     F      UUU   N  N    CC      T     I    OO    N  N         CC    LLLl   A   A    sSS     sSS      //



function isStopSymbol(chr) //symbols that signify end of command name. For example, in abs() symbol '(' signifies end of abs command
{
	if(chr.length != 1) {
		return true;
	}
	return (chr == ' ') || (chr == '+') || (chr == '-') || (chr == '*') || (chr == '/')
	    || (chr == '=') || (chr == '^') || (chr == '|') || (chr == '&') || (chr == '%')
	    || (chr == '>') || (chr == '<') || (chr == '(') || (chr == ')') || (chr == ',');
}

function processSpaces(str, fromIndex, direction) //returns the index of next char after group of spaces
{
	if(direction == 0) {
		return fromIndex;
	}
	var curIndex = fromIndex;
	while(str.charAt(curIndex) == ' ') {
		curIndex += direction;
	}
	return curIndex;
}

function processBrackets(str, fromIndex, direction) //returns the index of next char after group of brackets
{
	if(direction == 0) {
		return fromIndex;
	}
	//we must continue only if (str.charAt(fromIndex) == '(' && direction > 0 || str.charAt(fromIndex) == ')' && direction < 0)
	if((str.charAt(fromIndex) != '(' || direction < 0) && (str.charAt(fromIndex) != ')' || direction > 0)) {
		return fromIndex;
	}
	//if(str.charAt(fromIndex) != '(' && str.charAt(fromIndex) != ')') {
	var curIndex = fromIndex;
	var balance  = 0;
	do {
		if(str.charAt(curIndex).length == 0) { //out of string range
			return fromIndex;
		}		
		if(str.charAt(curIndex) == '(') {
			balance++;
		}
		if(str.charAt(curIndex) == ')') {
			balance--;
		}
		curIndex += direction;
	} while(balance!=0);
	return curIndex;
}

function processCommandName(str, fromIndex, direction) //returns the index of next char after command name
{
	if(direction == 0) {
		return fromIndex;
	}
	var curIndex = fromIndex;
	while(!isStopSymbol(str.charAt(curIndex))) {
		curIndex += direction;
	}
	return curIndex;
}

function getLeftOperand(str, fromIndex) //returns an index of first char of operand, which placed of the left side of fromIndex
{
	var curIndex = fromIndex - 1;
	curIndex = processSpaces      (str, curIndex, -1);
	curIndex = processBrackets    (str, curIndex, -1);
	var index1 = curIndex;
	curIndex = processSpaces      (str, curIndex, -1);
	var index2 = curIndex;
	curIndex = processCommandName (str, curIndex, -1);
	if(index2 == curIndex) { //command name is empty
		return index1   + 1; //so it's not necessary to include extra spaces to operand
	} else {
		return curIndex + 1;
	}
}

function getRightOperand(str, fromIndex) //returns an index of last char of operand, which placed of the right side of fromIndex
{
	var curIndex = fromIndex + 1;
	curIndex = processSpaces      (str, curIndex, +1);
	curIndex = processCommandName (str, curIndex, +1);
	var index1 = curIndex;
	curIndex = processSpaces      (str, curIndex, +1);
	var index2 = curIndex;
	curIndex = processBrackets    (str, curIndex, +1);
	if(index2 == curIndex) { //we did't find brackets
		return index1   - 1; //so it's not necessary to include extra spaces to operand
	} else {
		return curIndex - 1;
	}
}

function genCode(expression) //generates JS-code from expression. For example, "x^2 - 2*x - 6" -> "y = Math.pow(x, 2) - 2*x - 6;".
{
	if(typeof expression !== 'string')
		return '';

	var code = expression.toLowerCase().trim();
	if(code.length == 0)
		return '';

	//preprocessing. For people who used to write expressions in JS
	code = replaceAll(code, 'math.log', 'ln');
	code = replaceAll(code, 'math.'   ,  '' );
	//supporting a/b as a:b
	code = replaceAll(code, ':' ,    '/');
	//supporting abs(x) as [x]
	code = replaceAll(code, '[' , 'abs(');
	code = replaceAll(code, ']' ,    ')');
	//supportint pow(x, y) as x**y
	code = replaceAll(code, '**',    '^');
	//supporting pow(x, y) as x^y
	do {
		var pos = code.indexOf('^');
		if(pos!=-1) {
			var left  = getLeftOperand (code, pos);
			var right = getRightOperand(code, pos);
			code = code.substring(0, left) + 'pow(' + code.substring(left, pos).trim() + ', '
			     + code.substring(pos+1, right+1).trim() + ')' + code.substring(right+1, code.length);
		}
	} while(pos!=-1);
	//supporting various functions & constants without 'Math.' prefix
	var replaceBase = [
		//supporting basic math functions
		['abs'   , 'Math.abs'    ],
		['sqrt'  , 'Math.sqrt'   ],
		['root'  , 'Math.sqrt'   ],
		['pow'   , 'Math.pow'    ],
		['exp'   , 'Math.exp'    ],
		['ln'    , 'Math.log'    ],
		['lg'    ,      'log10'  ],
		//supporting basic trigonometry functions
		['sin'   , 'Math.sin'    ],
		['cos'   , 'Math.cos'    ],
		['tan'   , 'Math.tan'    ],
		['tg'    , 'Math.tan'    ],
		//supporting advanced trigonometry functions
		['asin'  , 'Math.asin'   ],
		['arcsin', 'Math.asin'   ],
		['acos'  , 'Math.acos'   ],
		['arccos', 'Math.acos'   ],
		['atg2'  , 'Math.atan2'  ],
		['atan2' , 'Math.atan2'  ],
		['atan'  , 'Math.atan'   ],
		['arctan', 'Math.atan'   ],
		['atg'   , 'Math.atan'   ],
		['arctg' , 'Math.atan'   ],
		['arcctg',      'actg'   ],
		//supporting random
		['rnd'   ,      'random' ],
		['rand'  ,      'random' ],
		//supporting round functions
		['floor' , 'Math.floor'  ],
		['round' , 'Math.round'  ],
		['ceil'  , 'Math.ceil'   ],
		//supporting basic statistical functions
		['min'   , 'Math.min'    ],
		['max'   , 'Math.max'    ],
		//supporting basic logical functions
		[ 'not ' ,     '~'       ],
		[' and ' ,     '&'       ],
		[' or '  ,     '|'       ],
		[' xor ' ,     '^'       ],
		[' shr ' ,    '>>'       ],
		[' sar ' ,    '>>'       ],
		[' shl ' ,    '<<'       ],
		[' sal ' ,    '<<'       ],
		//supporting basic mathematical constants
		['pi'    , 'Math.PI'     ],
		['e'     , 'Math.E'      ],
		['phi'   , '1.6180339887'],
		//supporting physics constants
		['physg' , '9.8'         ]
	];

	var curIndex = 0;
	do {
		var newIndex = processCommandName(code, curIndex, 1);
		if(newIndex == curIndex) {
			//curIndex doesn't points to command name
			curIndex++;
		} else {
			var command = code.substring(curIndex, newIndex);
			var founded = false;
			replaceBase.forEach(function(pair) {
				if(pair[0] == command) {
					code = code.substring(0, curIndex) + pair[1] + code.substring(newIndex, code.length);
					curIndex += pair[1].length + 1;
					founded = true;
				}
			});
			if(!founded) {
				curIndex = newIndex + 1;
			}
		}
	} while(curIndex < code.length);
	//supporting x==y as x=y.
	var pos = -1;
	do {
		var pos = code.indexOf('=', pos+1);
		if(pos!=-1 && code.charAt(pos-1)!='=' && code.charAt(pos+1)!='=') {
			code = code.substring(0, pos) + '=' + code.substring(pos, code.length);
		}
	} while(pos!=-1);
	return 'y = ' + code + ';';
}

//constructor

function Function()
{
	this.enabled           = false;
	this.restoreIsJS       = false;
	this.restoreExpression = '';
	this.expression        = '';
	this.color             = '#00A2E8'; //light blue color is default
	this.differention      = 0;
}

//initializators

Function.prototype.setColor = function(color) {
	this.color = color === undefined ? '#00A2E8' : color;
	return this;
}

Function.prototype.setExpression = function(expression, isJS, differention) {
	this.restoreExpression = expression;
	this.restoreIsJS       = isJS         === undefined ? false : isJS;
	this.differention      = differention === undefined ?     0 : differention;

	if(isJS) {
		this.expression = expression;
	} else {
		this.expression = genCode(expression);
	}

	this.enabled = this.expression.length > 0;
	return this;
}

Function.prototype.toggleEnabled = function(enabled) {
	if(enabled === undefined) {
		return this.toggleEnabled(!this.enabled);
	}
	if(enabled == true) {
		this.enabled = this.expression.length > 0;
	} else {
		this.enabled = false;
	}
	return this;
}

//string converters

Function.prototype.saveToString = function() {
	return objectToString(this, ['enabled', 'restoreIsJS', 'restoreExpression', 'color', 'differention']);
}

Function.prototype.loadFromString = function(str) {
	eval('var obj = ' + str + ';');
	with(obj)
		return this.setExpression(restoreExpression, restoreIsJS, differention).setColor(color).toggleEnabled(enabled);
}

//calculators

Function.prototype.getFunctionY = function(x) {
	var y = undefined;
	if(this.enabled) {
		eval(this.expression);
	}
	return y;
}

Function.prototype.getDifferentionY = function(x, order) { //calculates differential quotient
	if(order === undefined || order == 0) {
		return this.getFunctionY(x);
	} else {
		return (this.getDifferentionY(x+delta, order-1, delta) - this.getDifferentionY(x, order-1, delta))/delta;
	}
}

Function.prototype.getY = function(x) {
	return this.getDifferentionY(x, this.differention);
}



//      CC    aAAA    N  N    V   V   aAAA     SSs          CC    L      aAAA     SSs     SSs      //
//     C  C   A   A   N  N    V   V   A   A   S            C  C   L      A   A   S       S         //
//     C      AAAAA   NN N    V   V   AAAAA    SSS         C      L      AAAAA    SSS     SSS      //
//     C      A   A   N NN     V V    A   A       S        C      L      A   A       S       S     //
//      CC    A   A   N  N      V     A   A    sSS          CC    LLLl   A   A    sSS     sSS      //



function processScaleNumber(number, zoomOrder) //returns true if it necessary to write current number on the scale
{
	if(!isInteger(number*8)) //long not-integer numbers looks not very attractive
		return false;

	if(!isInteger(number/zoomOrder/2)) { //every second number
		if(zoomOrder<1)
			return false;
		if(Math.abs(number)>=1000)
			return false;
		if(zoomOrder>32 && Math.abs(number)!=zoomOrder)
			return false;
	}

	if(number == 0) //origin draws separately
		return false;

	return true;
}

//constructor

function Canvas()
{
	this.functions       = new Array();
	this.attachedCanvas  = undefined;
	this.attachedContext = undefined;
	this.stepX     = 20; //distance between net's lines (will be changed during the zoom)
	this.stepY     = 20;
	this.shiftX    =  0; //deviation from the origin (will be changed after scrolling)
	this.shiftY    =  0;
	this.width     =  0; //dimensions of canvas (will be changed after resize)
	this.height    =  0;
	this.centerX   =  0; //coordinates of the origin (will be calculated using shift & width or height)
	this.centerY   =  0;
	this.scaleX    =  1; //scaling factors (will be changed after zoom)
	this.scaleY    =  1;
	this.minScale  = 1/64; //const
	this.maxScale  =  256; //const
	this.scrollX   = NaN; //coordinates of cursor during scrolling
	this.scrollY   = NaN;
	this.zoomTimer = undefined; //zooming timer id
	this.zoomStarted = false;
	this.fastDraw    = false; //some options
	this.changeXZoom = true;
	this.changeYZoom = true;
}

//system functions

Canvas.prototype.recalcOrigin = function() {
	if(!this.isCanvasAttached())
		return this;

	this.centerX = Math.round(this.shiftX + this.width  / 2);
	this.centerY = Math.round(this.shiftY + this.height / 2);

	return this;
}

Canvas.prototype.resize = function() {
	if(!this.isCanvasAttached())
		return this;

	this.width  = this.attachedCanvas.width;
	this.height = this.attachedCanvas.height;

	this.recalcOrigin();
	this.redraw();

	return this;
}

//initializators

Canvas.prototype.attachCanvas = function(id) {
	if(!elementExists(id))
		return this.deattachCanvas();
	
	this.attachedCanvas = document.getElementById(id);

	if(this.attachedCanvas.getContext === undefined) //canvas is insupported or id is not an id of a canvas
		return this.deattachCanvas();

	this.attachedContext = this.attachedCanvas.getContext('2d');
	this.resize();

	return this;
}

Canvas.prototype.addFunction = function () {
	var func = new Function();
	this.functions.push(func);
	return func;
}

//canvas urilities

Canvas.prototype.deattachCanvas = function() {
	this.attachedCanvas  = undefined;
	this.attachedContext = undefined;

	this.width   = 0;
	this.height  = 0;
	this.centerX = 0;
	this.centerY = 0;

	return this;
}

Canvas.prototype.isCanvasAttached = function() {
	return (this.attachedCanvas  !== undefined)
	    && (this.attachedContext !== undefined);
}

//functions utilities

Canvas.prototype.functionNumberIsCorrect = function(number) {
	return (number>0) && (number<=this.functions.length);
}

Canvas.prototype.getFunction = function(number) {
	if(!this.functionNumberIsCorrect(number)) {
		return null;
	}
	return this.functions[number - 1];
}

Canvas.prototype.deleteFunction = function(number) {
	if(!this.functionNumberIsCorrect(number)) {
		return this;
	}

	delete this.functions[number - 1];
	this.functions.splice(number - 1, 1);

	this.redraw();
	return this;
}

Canvas.prototype.deleteAllFunctions = function() {
	for(var i in this.functions) {
		delete this.functions[i];
	}
	this.functions.length = 0;

	this.redraw();
	return this;
}

Canvas.prototype.getFunctionsCount = function() {
	return this.functions.length;
}

//string converters

Canvas.prototype.saveToString = function() {
	if(this.inZooming())
		return '';

	var result = objectToString(this, ['shiftX', 'shiftY', 'scaleX', 'scaleY']);
	result = result.substring(0, result.length - 1); //'}' will be writed again in the future.

	result += ',functions:[';
	for(var i = 0; i < this.functions.length; i++) {
		var funcstr = this.functions[i].saveToString();
		funcstr = replaceAll(funcstr, '\'', '\\\'');
		result += '\"' + funcstr + '\",';
	}
	result = result.substring(0, result.length - 1); //last ',' shouldn't be included to the result

	result += ']}';
	return result;
}

Canvas.prototype.loadFromString = function(str) {
	if(this.inZooming())
		return this;

	this.deleteAllFunctions();
	eval('var obj = ' + str + ';');

	this.shiftX = obj.shiftX;
	this.shiftY = obj.shiftY;
	this.scaleX = obj.scaleX;
	this.scaleY = obj.scaleY;

	obj.functions.forEach(function(funcstr){
		this.addFunction().loadFromString(funcstr);
	}, this);

	this.recalcOrigin();
	this.redraw();
	return this;
}

//converters

/* Explanation: every point on canvas has two coordinates.
 *     1. canvasCoordinate (canvasX or canvasY) is a coordinate of pixel of the canvas.
 *     2. coordinate (x or y) is a mathematical coordinate of this point.
 * For example, the (centerX, centerY) point on the canvas has (0, 0) mathematical coordinates, becouse it is the origin.
 */

Canvas.prototype.getCanvasX = function(x) {
	return + x*this.stepX/this.scaleX + this.centerX;
}

Canvas.prototype.getCanvasY = function(y) {
	return - y*this.stepY/this.scaleY + this.centerY;
}

Canvas.prototype.getX = function(canvasX) {
	return + this.scaleX*(canvasX - this.centerX)/this.stepX;
}

Canvas.prototype.getY = function(canvasY) {
	return - this.scaleY*(canvasY - this.centerY)/this.stepY;
}

Canvas.prototype.getFunctionY = function(func, canvasX, delta) {
	delta = delta === undefined ? 0 : delta;
	return this.getCanvasY(func.getY(this.getX(canvasX)+delta));
}

//drawers

Canvas.prototype.drawArrow = function(x0, y0, x1, y1, radius) {
	if(!this.isCanvasAttached()) {
		return this;
	}
	if(!isFinite(radius)) {
		radius = 10;
	}

	var backup     = getContextOptions(this.attachedContext);
	var angle      = Math.atan2(y0 - y1, x0 - x1);
	var angleDelta = Math.PI / 6; //const

	this.attachedContext.lineWidth   = 1;
	this.attachedContext.strokeStyle = '#000000';
	this.attachedContext.beginPath();

	this.attachedContext.moveTo(x0 + 0.5, y0 + 0.5);
	this.attachedContext.lineTo(x1 + 0.5, y1 + 0.5);

	var curAngle = angle + angleDelta;
	this.attachedContext.moveTo(x1, y1 + 0.5);
	this.attachedContext.lineTo(Math.round(x1 + Math.cos(curAngle)*radius), Math.round(y1 + Math.sin(curAngle)*radius) + 0.5);

	var curAngle = angle - angleDelta;
	this.attachedContext.moveTo(x1, y1 + 0.5);
	this.attachedContext.lineTo(Math.round(x1 + Math.cos(curAngle)*radius), Math.round(y1 + Math.sin(curAngle)*radius) + 0.5);

	this.attachedContext.stroke();
	setContextOptions(this.attachedContext, backup);
	return this;
}

Canvas.prototype.drawNet = function() {
	if(!this.isCanvasAttached()) {
		return this;
	}
	var backup = getContextOptions(this.attachedContext);

	//net
	var   verticalLines = [];
	for(var x = this.centerX % this.stepX; x<this.width;  x += this.stepX) {
		  verticalLines.push(x);
	}

	var horizontalLines = [];
	for(var y = this.centerY % this.stepY; y<this.height; y += this.stepY) {
		horizontalLines.push(y);
	}

	this.attachedContext.lineWidth   = 1;
	this.attachedContext.strokeStyle = '#cccccc';
	this.attachedContext.beginPath();
	for(var i in verticalLines) {
		this.attachedContext.moveTo(verticalLines[i] + 0.5,           0);
		this.attachedContext.lineTo(verticalLines[i] + 0.5, this.height);
	}
	for(var i in horizontalLines) {
		this.attachedContext.moveTo(         0, horizontalLines[i] + 0.5);
		this.attachedContext.lineTo(this.width, horizontalLines[i] + 0.5);
	}
	this.attachedContext.stroke();

	//arrows & numbers near the arrows
	this.attachedContext.font         = '5pt verdana';
	this.attachedContext.textBaseline = 'top';
	this.attachedContext.textAlign    = 'right';
	this.attachedContext.strokeStyle  = '#444444';

	var xArrowIsInvisible = this.centerY <  0 || this.centerY >= this.height - 1;
	var yArrowIsInvisible = this.centerX <= 0 || this.centerX >  this.width  - 1;
	var xArrowIsHigher  = this.centerY <= 0;
	var yArrowIsRighter = this.centerX >= this.width;

	if(xArrowIsInvisible && yArrowIsInvisible) {
		//when there are two numbers at the one angle of canvas, it is impossible to read them
		//so, let's delete both of them :)
		if(xArrowIsHigher) {
			horizontalLines.splice(0, 1); //top
		} else {
			horizontalLines.length  --  ; //bottom
		}
		if(yArrowIsRighter) {
			  verticalLines.length  --  ; //right
		} else {
			  verticalLines.splice(0, 1); //left
		}
	}

	var xArrowHead = this.width + (yArrowIsRighter ? +10 : 0); //width + 10 means that arrow-head will be invisible
	var yArrowHead =               xArrowIsHigher  ? -10 : 0 ; //-10 means it too

	//constant
	var arrowHeadLength = 7;
	//constants for easier positioning text
	var shiftX = -3;
	var shiftY = +1;

	if(xArrowIsInvisible) {
		if(xArrowIsHigher) {
			this.drawArrow(0, 0, xArrowHead, 0);
			var xArrowPos = shiftY;
		} else {
			this.drawArrow(0, this.height - 1, xArrowHead, this.height - 1);
			var xArrowPos = this.height - 1 - shiftY;

			this.attachedContext.textBaseline = 'bottom';
		}
	} else {
		this.drawArrow(0, this.centerY, xArrowHead, this.centerY);
		var xArrowPos = this.centerY + shiftY;
	}

	for(var i in verticalLines) { //X scale
		var x = this.getX(verticalLines[i]);
		if(!processScaleNumber(x, this.scaleX))
			continue;
		if(verticalLines[i] > this.width - arrowHeadLength)
			continue;
		this.attachedContext.strokeText(x, verticalLines[i] + shiftX, xArrowPos);
	}
	this.attachedContext.textBaseline = 'top';

	if(yArrowIsInvisible) {
		if(yArrowIsRighter) {
			this.drawArrow(this.width - 1, this.height, this.width - 1, yArrowHead);
			var yArrowPos = this.width - 1 + shiftX;
		} else {
			this.drawArrow(0, this.height, 0, yArrowHead);
			var yArrowPos = - shiftX;

			this.attachedContext.textAlign = 'left';
		}
	} else {
		this.drawArrow(this.centerX, this.height, this.centerX, yArrowHead);
		var yArrowPos = this.centerX + shiftX;
	}

	for(var i in horizontalLines) { //Y scale
		var y = this.getY(horizontalLines[i]);
		if(!processScaleNumber(y, this.scaleY))
			continue;
		if(horizontalLines[i] < arrowHeadLength)
			continue;
		this.attachedContext.strokeText(y, yArrowPos, horizontalLines[i] + shiftY);
	}
	this.attachedContext.textAlign = 'right';

	if(!xArrowIsInvisible && !yArrowIsInvisible) {
		this.attachedContext.strokeText('0', this.centerX + shiftX, this.centerY + shiftY); //origin
	}

	  verticalLines.length = 0;
	horizontalLines.length = 0;

	setContextOptions(this.attachedContext, backup);
	return this;
}

Canvas.prototype.drawFunction = function(func) {
	//TODO: отрефакторить эту стерву.
	if(!func.enabled || !this.isCanvasAttached()) {
		return this;
	}

	var backup = getContextOptions(this.attachedContext);
	var maxY =  -this.height;
	var minY = 2*this.height;
	var startX = this.fastDraw ? this.centerX%this.stepX - this.stepX : 0;
	var moved = false;
	this.attachedContext.lineWidth   = 2;
	this.attachedContext.strokeStyle = func.color;
	this.attachedContext.beginPath();
	for(var i = startX; i<this.width; i+=this.fastDraw ? 4 : 1) {
		var y = this.getFunctionY(func, i);
		if (isFinite(y)) {
			//if function draws too far out canvas border, sometimes browser can't stroke function line. Fix:
			y = Math.min(y, minY);
			y = Math.max(y, maxY);
			if (moved) {
				this.attachedContext.lineTo(i, y);
			} else {
				this.attachedContext.moveTo(i, y);
				moved = true;
			}
		} else {
			if(isNaN(y)) {
				moved = false;
			} else { //y is not a finite, but y is a number. Then, y is Infinity
				if(!isFinite(this.getFunctionY(func, i, -delta)) && !isFinite(this.getFunctionY(func, i, +delta))) {
					//the points nearebly is Infinity too
					//it means that y value is so big that it can't be contained in number type and it had been rounded to Infinity
					moved = false;
				} else { //function aspires to Infinity in this point
					//left side limit
					if(this.getFunctionY(func, i, -delta)<this.getFunctionY(func, i, -2*delta)) {
						//function is uprising,   so it aspires to +Infinity
						this.attachedContext.lineTo(i, maxY);
					} else {
						//function is downrising, so it aspires to -Infinity
						this.attachedContext.lineTo(i, minY);
					}
					//right side limit
					if(this.getFunctionY(func, i, +delta)<this.getFunctionY(func, i, +2*delta)) {
						//function is downrising, so it aspires to +Infinity
						this.attachedContext.moveTo(i, maxY);
					} else {
						//function is uprising,   so it aspires to -Infinity
						this.attachedContext.moveTo(i, minY);
					}
					moved = true;
				}
			}
		}
	}
	this.attachedContext.stroke();
	setContextOptions(this.attachedContext, backup);
	return this;
}

Canvas.prototype.drawFunctions = function() {
	if(!this.isCanvasAttached()) {
		return this;
	}

	this.functions.forEach(this.drawFunction, this);
	return this;
}

Canvas.prototype.redraw = function() {
	if(!this.isCanvasAttached()) {
		return this;
	}

	this.attachedCanvas.width = this.attachedCanvas.width; //clean up
	this.drawNet().drawFunctions();

	return this;
}

//Scrollers

Canvas.prototype.startScroll = function(downEvent) {
	this.scrollX = downEvent.clientX;
	this.scrollY = downEvent.clientY;

	return this;
}

Canvas.prototype.startTouchScroll = function(touchEvent) {
	if(touchEvent.touches.length != 1)
		return false;

	this.startScroll(touchEvent.touches[0]);
	return true;
}

Canvas.prototype.scroll = function(moveEvent) {
	if (isNaN(this.scrollX) || isNaN(this.scrollY) || isNaN(moveEvent.clientX) || isNaN(moveEvent.clientY))
		return this;

	var x = moveEvent.clientX;
	var y = moveEvent.clientY;

	this.shiftX += x - this.scrollX;
	this.shiftY += y - this.scrollY;

	this.scrollX = x;
	this.scrollY = y;

	this.recalcOrigin();

	this.redraw();
	return this;
}

Canvas.prototype.touchScroll = function(touchEvent) {
	if(touchEvent.touches.length != 1)
		return false;

	this.scroll(touchEvent.touches[0]);
	return true;
}

Canvas.prototype.endScroll = function() {
	this.scrollX = NaN;
	this.scrollY = NaN;
	return this;
}

Canvas.prototype.center = function() {
	this.shiftX = 0;
	this.shiftY = 0;

	this.recalcOrigin();
	this.redraw();

	return this;
}

//Zoomers

Canvas.prototype.changeZoomOptions = function(changeXZoom, changeYZoom) {
	this.changeXZoom = changeXZoom === undefined ? true : changeXZoom;
	this.changeYZoom = changeYZoom === undefined ? true : changeYZoom;
	return this;
}

/* Zoom note:
 * It is comfortable for user if mathematical coordinates of center of the screen will be constant while zoom.
 * Let's think about it:
 *     1. coordinate = +- scale * (canvasCoord - originCoord) / step (see converter's functions - getX and getY).
 *     2. It is the center of the screen, so canvasCoord = dimension/2, where dimension is width or height.
 *     3. So, originCoord = shift + dimension/2 (see recalcOrigin function).
 *     4. Finally, as I already say, coordinate must be a constant.
 *     5. It means that scale*shift/step = const.
 * It is the magic of a zoom functions.
 */

Canvas.prototype.inZooming = function() {
	return this.zoomTimer !== undefined;
}

Canvas.prototype.zoomTick = function(multiplier, step, shift, scale) {
	if(multiplier == 1)
		return {step: step, shift: shift, scale: scale, end: true};

	if(multiplier < 1) {
		var startStep = 20;
		var  lastStep = 20 / multiplier;
	} else {
		var startStep = 20 * multiplier;
		var  lastStep = 20;
	}

	var deltaStep = (lastStep - startStep) / 10;
	if(!this.zoomStarted) { //start of a zoom
		step = startStep;
		if(multiplier > 1)
			scale *= multiplier;
	}

	var end = step == lastStep;
	if(end) { //end of a zoom
		if(multiplier < 1) {
			scale *= multiplier;
			step   = 20;
		}

		shift = Math.round(shift);
		end = true;
	} else {
		var oldStep = step;
		step  += deltaStep;
		shift *= step / oldStep;
	}

	return {step: step, shift: shift, scale: scale, end: end};
}

Canvas.prototype.onZoomTimer = function(multiplierX, multiplierY) {
	var resultX = this.zoomTick(multiplierX, this.stepX, this.shiftX, this.scaleX);
	this.stepX  = resultX.step ;
	this.shiftX = resultX.shift;
	this.scaleX = resultX.scale;

	var resultY = this.zoomTick(multiplierY, this.stepY, this.shiftY, this.scaleY);
	this.stepY  = resultY.step ;
	this.shiftY = resultY.shift;
	this.scaleY = resultY.scale;

	this.recalcOrigin();
	this.redraw();

	if(resultX.end && resultY.end) {
		clearInterval(this.zoomTimer);
		this.zoomTimer   = undefined;
		this.zoomStarted = false;
	} else {
		this.zoomStarted = true;
	}
}

Canvas.prototype.zoomIn = function() {
	if(this.inZooming())
		return this;

	var multiplierX = this.changeXZoom && this.scaleX > this.minScale ? 1/2 : 1;
	var multiplierY = this.changeYZoom && this.scaleY > this.minScale ? 1/2 : 1;

	var canvas = this;
	this.zoomTimer = setInterval(function() {
		canvas.onZoomTimer(multiplierX, multiplierY);
	}, 25);

	return this;
}

Canvas.prototype.zoomOut = function() {
	if(this.inZooming())
		return this;

	var multiplierX = this.changeXZoom && this.scaleX < this.maxScale ? 2 : 1;
	var multiplierY = this.changeYZoom && this.scaleY < this.maxScale ? 2 : 1;

	var canvas = this;
	this.zoomTimer = setInterval(function() {
		canvas.onZoomTimer(multiplierX, multiplierY);
	}, 25);

	return this;
}

Canvas.prototype.clearZoom = function() {
	if(this.inZooming())
		return this;

	var multiplierX = 1 / this.scaleX;
	var multiplierY = 1 / this.scaleY;

	var canvas = this;
	this.zoomTimer = setInterval(function() {
		canvas.onZoomTimer(multiplierX, multiplierY);
	}, 25);

	return this;
}

Canvas.prototype.zoom = function(wheelEvent) {
	if (wheelEvent.deltaY<0) {
		return this.zoomIn();
	} else {
		return this.zoomOut();
	}
}



//      OO      tTTTt     H   h     EEEe     RRR      //
//     O  O       T       H   H     E        R  R     //
//     O  O       T       HHHHH     EEEe     RRR      //
//     O  O       T       H   H     E        R  R     //
//      OO        T       H   H     EEEe     R  R     //

//some math functions (to help supporting them in Functions' expressions)

function isInteger(number)
{
	return Math.round(number) == number;
}

function round(number, base) //rounds number accurate within 1/base
{
	if(base === undefined || base == 0) {
		base = 10;
	}
	return Math.round(number*base)/base;
}

function sign(x)
{
	if(x<0)
		return -1;
	if(x>0)
		return +1;
	return 0;
}

function sqr(x)
{
	return x*x;
}

function log(x, y)
{
	return Math.log(x) / Math.log(y);
}

function log2(x)
{
	return Math.log(x) / Math.log(2);
}

function log10(x)
{
	return Math.log(x) / Math.log(10);
}

function ctg(x)
{
	return 1 / Math.tan(x);
}

function actg(x)
{
	return Math.atan(1/x);
}

function random(first, second)
{
	if(isNaN(first)) {  //random() is real number between 0 & 1
			return Math.random();
	}
	if(isNaN(second)) { //random(x) is an integer number between 0 & x-1
			return Math.floor(Math.random() * first);
	}
	//random(x, y) is an integer number between x & y
	return Math.floor(Math.random() * (second - first + 1) + first);
}

//DOM access helpers

function idIsCorrect(id)
{
	return typeof id === 'string' ? id.length > 0 : false;
}

function elementExists(id)
{
	return idIsCorrect(id) ? document.getElementById(id) != null : false;
}

//string utilities

function replaceAll(string, find, replace)
{
	return string.split(find).join(replace);
}

//object utilities

function objectToString(obj, neededKeys) //obj: {i: 1, j: 2, s: '3'}, neededKeys: ['i', 's'] -> "{i:100,s:\'10\'}"
{
	var result = '';

	for(var i in neededKeys) {
		var key   = neededKeys[i];
		var value = obj[key];
		if(typeof value === 'string')
			value = '\'' + value + '\'';

		result += key + ':' + value + ',';
	}

	result = result.substring(0, result.length - 1); //last ',' shouldn't be included to the result
	result = '{' + result + '}';
	return result;
}

function getContextOptions(context)
{
	var options = {};

	options.lineWidth    = context.lineWidth;
	options.fillStyle    = context.fillStyle;
	options.strokeStyle  = context.strokeStyle;
	options.font         = context.font;
	options.textAlign    = context.textAlign;
	options.textBaseline = context.textBaseline;

	return options;
}

function setContextOptions(context, options)
{
	context.lineWidth    = options.lineWidth;
	context.fillStyle    = options.fillStyle;
	context.strokeStyle  = options.strokeStyle;
	context.font         = options.font;
	context.textAlign    = options.textAlign;
	context.textBaseline = options.textBaseline;
}
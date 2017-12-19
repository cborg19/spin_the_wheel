/*
Didnt want to reinvent the wheel in this case so used HTML5 canvas from http://www.dougtesting.net/
Then just modified it for project needs
*/

import TweenMax from 'gsap';

var winwheelToDrawDuringAnimation = null; 
// ====================================================================================================================
// Class for the wheel spinning animation which like a segment becomes a property of the wheel.
// ====================================================================================================================
function Animation(options)
{
    var defaultOptions = {
        'type'              : 'spinOngoing',
        'direction'         : 'clockwise',         // clockwise or anti-clockwise.
        'propertyName'      : null,
        'propertyValue'     : null,
        'duration'          : 10,                  // Duration of the animation.
        'yoyo'              : false,               // If the animation is to reverse back again i.e. yo-yo.
        'repeat'            : 0,
        'easing'            : 'power3.easeOut',
        'stopAngle'         : null,
        'spins'             : null,
        'clearTheCanvas'    : null,
        'callbackFinished'  : null,                // Function to callback when the animation has finished.
    };

    // Now loop through the default options and create properties of this class set to the value for
    // the option passed in if a value was, or if not then set the value of the default.
    for (var key in defaultOptions)
    {
        if ((options != null) && (typeof(options[key]) !== 'undefined'))
            this[key] = options[key];
        else
            this[key] = defaultOptions[key];
    }

    // Also loop though the passed in options and add anything specified not part of the class in to it as a property.
    if (options != null)
    {
        for (key in options)
        {
            if (typeof(this[key]) === 'undefined')
            {
                this[key] = options[key];
            }
        }
    }
}

// ====================================================================================================================
// Class for segments.
// ====================================================================================================================
class Segment
{
  constructor(options) {
    // Define default options for segments, most are null so that the global defaults for the wheel
    // are used if the values for a particular segment are not specifically set.
    var defaultOptions = {
        'size'              : null, // Leave null for automatic. Valid values are degrees 0-360. Use percentToDegrees function if needed to convert.
        'text'              : '',   // Default is blank.
        'fillStyle'         : null, // If null for the rest the global default will be used.
        'strokeStyle'       : null,
        'lineWidth'         : null,
        'textFontFamily'    : null,
        'textFontSize'      : null,
        'textFontWeight'    : null,
        'textOrientation'   : null,
        'textAlignment'     : null,
        'textDirection'     : null,
        'textMargin'        : null,
        'textFillStyle'     : null,
        'textStrokeStyle'   : null,
        'textLineWidth'     : null,
        'image'             : null, // Name/path to the image
        'imageDirection'    : null, // Direction of the image, can be set globally for the whole wheel.
        'imgData'           : null  // Image object created here and loaded with image data.
    };

    // Now loop through the default options and create properties of this class set to the value for
    // the option passed in if a value was, or if not then set the value of the default.
    for (var key in defaultOptions)
    {
        if ((options != null) && (typeof(options[key]) !== 'undefined'))
            this[key] = options[key];
        else
            this[key] = defaultOptions[key];
    }

    // Also loop though the passed in options and add anything specified not part of the class in to it as a property.
    // This allows the developer to easily add properties to segments at construction time.
    if (options != null)
    {
        for (key in options)
        {
            if (typeof(this[key]) === 'undefined')
            {
                this[key] = options[key];
            }
        }
    }

    this.startAngle = 0;
    this.endAngle   = 0;
  }
}

class Wheel {
  constructor(canvas, callback) {
	this.canvas = canvas;
	this.ResultCallback = callback;
	this.lineWidth = 1;					// Width of lines around segments.
	this.innerRadius = 0;            	// Normally 0. Allows the creation of rings / doughnuts if set to value > 0. Should not exceed outer radius.
    this.numSegments = 1;            	// The number of segments. Need at least one to draw.
    this.rotationAngle = 0;            	// The angle of rotation of the wheel - 0 is 12 o'clock position.
    this.textFontFamily = 'Arial';      // Segment text font, you should use web safe fonts.
    this.textFontSize = 20;           	// Size of the segment text.
    this.textFontWeight = 'bold';       // Font weight.
    this.textOrientation = 'horizontal'; // Either horizontal, vertical, or curved.
    this.textAlignment = 'center';     	// Either center, inner, or outer.
    this.textDirection = 'normal';     	// Either normal or reversed. In normal mode for horizontal text in segment at 3 o'clock is correct way up, in reversed text at 9 o'clock segment is correct way up.
    this.textMargin = null;         	// Margin between the inner or outer of the wheel (depends on textAlignment).
    this.textFillStyle = 'black';      	// This is basically the text colour.
    this.textStrokeStyle = null;        // Basically the line colour for segment text, only looks good for large text so off by default.
    this.textLineWidth = 1;            	// Width of the lines around the text. Even though this defaults to 1, a line is only drawn if textStrokeStyle specified.
    this.fillStyle = 'silver';     		// The segment background colour.
    this.strokeStyle = 'black';      	// Segment line colour. Again segment lines only drawn if this is specified.
    this.lineWidth = 1;            		// Width of lines around segments.
    this.clearTheCanvas = true;         // When set to true the canvas will be cleared before the wheel is drawn.
    this.imageOverlay = false;        	// If set to true in image drawing mode the outline of the segments will be displayed over the image. Does nothing in code drawMode.
    this.drawText = true;         		// By default the text of the segments is rendered in code drawMode and not in image drawMode.
    this.pointerAngle = 0;            	// Location of the pointer that indicates the prize when wheel has stopped. Default is 0 so the (corrected) 12 o'clock position.
    this.wheelImage = null;         	// Must be set to image data in order to use image to draw the wheel - drawMode must also be 'image'.
    this.imageDirection = 'N';          // Used when drawMode is segmentImage. Default is north, can also be (E)ast, (S)outh, (W)est.
		
    if (this.centerX == null)
	{
		this.centerX = this.canvas.width / 2;
	}

	if (this.centerY == null)
	{
		this.centerY = this.canvas.height / 2;
	}
	
	// Need to set to half the width of the shortest dimension of the canvas as the canvas may not be square.
	// Minus the line segment line width otherwise the lines around the segments on the top,left,bottom,right
	// side are chopped by the edge of the canvas.
	if (this.canvas.width < this.canvas.height)
	{
		this.outerRadius = (this.canvas.width / 2) - this.lineWidth;
	}
	else
	{
		this.outerRadius = (this.canvas.height / 2) - this.lineWidth;
	}

	// Also get a 2D context to the canvas as we need this to draw with.
	this.ctx = this.canvas.getContext('2d');
			
	// ------------------------------------------
    // Add array of segments to the wheel, then populate with segments if number of segments is specified for this object.
	var DisplaySeg = [
		   {'text' : 'Prize 1'},
		   {'text' : 'Prize 2'},
		   {'text' : 'Prize 3'},
		   {'text' : 'Prize 4'},
		   {'text' : 'Prize 5'},
		   {'text' : 'Prize 6'},
		   {'text' : 'Prize 7'},
		   {'text' : 'Prize 8'},
		   {'text' : 'Prize 9'},
		   {'text' : 'Prize 10'}
		];
	
	// -------------------------------------------------------
	// Function to Randomise/shuffle the numbers
	// -------------------------------------------------------
	//
	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}
	DisplaySeg = shuffle(DisplaySeg);
	
	this.numSegments = DisplaySeg.length;
    this.segments = new Array(null);

    for (var x = 1; x <= this.numSegments; x++)
    {
		if(x % 2 === 0)
			DisplaySeg[x-1].fillStyle = '#E5C007';
		else
			DisplaySeg[x-1].fillStyle = '#058A82';
        this.segments[x] = new Segment(DisplaySeg[x-1]);
    }

    // ------------------------------------------
    // Call function to update the segment sizes setting the starting and ending angles.
    this.updateSegmentSizes();		
			
	// ------------------------------------------
    // animation 
	this.animation = new Animation({
        'type'     : 'spinToStop',
        'duration' : 5,     // Duration in seconds.
        'spins'    : 8,     // Number of complete spins.
        'callbackFinished' : 'this.WheelCompleted()'
    });	
	
	this.draw(this.clearTheCanvas);
  }

  // ====================================================================================================================
  // This function clears the canvas. Will wipe anything else which happens to be drawn on it.
  // ====================================================================================================================
  clearCanvas()
  {
    if (this.ctx)
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // ====================================================================================================================
  // This function draws / re-draws the wheel on the canvas therefore rendering any changes.
  // ====================================================================================================================
  draw(clearTheCanvas)
  {
    // If have the canvas context.
    if (this.ctx)
    {
        this.clearCanvas();

		// The default operation is to draw the segments using code via the canvas arc() method.
		this.drawSegments();

		// The text is drawn on top.
		if (this.drawText === true)
		{
			this.drawSegmentText();
		}

        // If this class has pins.
        if (typeof this.pins !== 'undefined')
        {
            // If they are to be visible then draw them.
            if (this.pins.visible === true)
                this.drawPins();
        }
    }
  }

  // ====================================================================================================================
  // This function draws the wheel on the page by rendering the segments on the canvas.
  // ====================================================================================================================
  drawSegments()
  {
    // Again check have context in case this function was called directly and not via draw function.
    if (this.ctx)
    {
        // Draw the segments if there is at least one in the segments array.
        if (this.segments)
        {
            // Loop though and output all segments - position 0 of the array is not used, so start loop from index 1
            // this is to avoid confusion when talking about the first segment.
            for (var x = 1; x <= this.numSegments; x ++)
            {
                // Get the segment object as we need it to read options from.
                var seg = this.segments[x];

                var fillStyle;
                var lineWidth;
                var strokeStyle;

                // Set the variables that defined in the segment, or use the default options.
                if (seg.fillStyle !== null)
                    fillStyle = seg.fillStyle;
                else
                    fillStyle = this.fillStyle;

                this.ctx.fillStyle = fillStyle;

                if (seg.lineWidth !== null)
                    lineWidth = seg.lineWidth;
                else
                    lineWidth = this.lineWidth;

                this.ctx.lineWidth = lineWidth;

                if (seg.strokeStyle !== null)
                    strokeStyle = seg.strokeStyle;
                else
                    strokeStyle = this.strokeStyle;

                this.ctx.strokeStyle = strokeStyle;


                // Check there is a strokeStyle or fillStyle, if either the the segment is invisible so should not
                // try to draw it otherwise a path is began but not ended.
                if ((strokeStyle) || (fillStyle))
                {
                    // ----------------------------------
                    // Begin a path as the segment consists of an arc and 2 lines.
                    this.ctx.beginPath();

                    // If don't have an inner radius then move to the center of the wheel as we want a line out from the center
                    // to the start of the arc for the outside of the wheel when we arc. Canvas will draw the connecting line for us.
                    if (!this.innerRadius)
                    {
                        this.ctx.moveTo(this.centerX, this.centerY);
                    }
                    else
                    {
                       //++ do need to draw the starting line in the correct x + y based on the start angle
                       //++ otherwise as seen when the wheel does not use up 360 the starting segment is missing the stroked side,
                    }

                    // Draw the outer arc of the segment clockwise in direction -->
                    this.ctx.arc(this.centerX, this.centerY, this.outerRadius, this.degToRad(seg.startAngle + this.rotationAngle - 90), this.degToRad(seg.endAngle + this.rotationAngle - 90), false);

                    if (this.innerRadius)
                    {
                        // Draw another arc, this time anticlockwise <-- at the innerRadius between the end angle and the start angle.
                        // Canvas will draw a connecting line from the end of the outer arc to the beginning of the inner arc completing the shape.

                        //++ Think the reason the lines are thinner for 2 of the segments is because the thing auto chops part of it
                        //++ when doing the next one. Again think that actually drawing the lines will help.

                        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, this.degToRad(seg.endAngle + this.rotationAngle - 90), this.degToRad(seg.startAngle + this.rotationAngle - 90), true);
                    }
                    else
                    {
                        // If no inner radius then we draw a line back to the center of the wheel.
                        this.ctx.lineTo(this.centerX, this.centerY);
                    }

                    // Fill and stroke the segment. Only do either if a style was specified, if the style is null then
                    // we assume the developer did not want that particular thing.
                    // For example no stroke style so no lines to be drawn.
                    if (fillStyle)
                        this.ctx.fill();

                    if (strokeStyle)
                        this.ctx.stroke();
                }
            }
        }
    }
  }

  // ====================================================================================================================
  // This draws the text on the segments using the specified text options.
  // ====================================================================================================================
  drawSegmentText()
  {
    // Again only draw the text if have a canvas context.
    if (this.ctx)
    {
        // Declare variables to hold the values. These are populated either with the value for the specific segment,
        // or if not specified then the global default value.
        var fontFamily;
        var fontSize;
        var fontWeight;
        var orientation;
        var alignment;
        var direction;
        var margin;
        var fillStyle;
        var strokeStyle;
        var lineWidth;
        var fontSetting;

        // Loop though all the segments.
        for (var x = 1; x <= this.numSegments; x ++)
        {
            // Save the context so it is certain that each segment text option will not affect the other.
            this.ctx.save();

            // Get the segment object as we need it to read options from.
            var seg = this.segments[x];

            // Check is text as no point trying to draw if there is no text to render.
            if (seg.text)
            {
                // Set values to those for the specific segment or use global default if null.
                if (seg.textFontFamily  !== null)   fontFamily  = seg.textFontFamily;  else fontFamily  = this.textFontFamily;
                if (seg.textFontSize    !== null)   fontSize    = seg.textFontSize;    else fontSize    = this.textFontSize;
                if (seg.textFontWeight  !== null)   fontWeight  = seg.textFontWeight;  else fontWeight  = this.textFontWeight;
                if (seg.textOrientation !== null)   orientation = seg.textOrientation; else orientation = this.textOrientation;
                if (seg.textAlignment   !== null)   alignment   = seg.textAlignment;   else alignment   = this.textAlignment;
                if (seg.textDirection   !== null)   direction   = seg.textDirection;   else direction   = this.textDirection;
                if (seg.textMargin      !== null)   margin      = seg.textMargin;      else margin      = this.textMargin;
                if (seg.textFillStyle   !== null)   fillStyle   = seg.textFillStyle;   else fillStyle   = this.textFillStyle;
                if (seg.textStrokeStyle !== null)   strokeStyle = seg.textStrokeStyle; else strokeStyle = this.textStrokeStyle;
                if (seg.textLineWidth   !== null)   lineWidth   = seg.textLineWidth;   else lineWidth   = this.textLineWidth;

                // ------------------------------
                // We need to put the font bits together in to one string.
                fontSetting = '';

                if (fontWeight != null)
                    fontSetting += fontWeight + ' ';

                if (fontSize != null)
                    fontSetting += fontSize + 'px ';    // Fonts on canvas are always a px value.

                if (fontFamily != null)
                    fontSetting += fontFamily;

                // Now set the canvas context to the decided values.
                this.ctx.font        = fontSetting;
                this.ctx.fillStyle   = fillStyle;
                this.ctx.strokeStyle = strokeStyle;
                this.ctx.lineWidth   = lineWidth;

                // Split the text in to multiple lines on the \n character.
                var lines = seg.text.split('\n');

                // Figure out the starting offset for the lines as when there are multiple lines need to center the text
                // vertically in the segment (when thinking of normal horozontal text).
                var lineOffset = 0 - (fontSize * (lines.length / 2)) + (fontSize / 2);

                // The offset works great for horozontal and vertial text, also centered curved. But when the text is curved
                // and the alignment is outer then the multiline text should not have some text outside the wheel. Same if inner curved.
                if ((orientation === 'curved') && ((alignment === 'inner') || (alignment === 'outer')))
                {
                    lineOffset = 0;
                }

                for(var i = 0; i < lines.length; i ++)
                {
                    // ---------------------------------
                    // If direction is reversed then do things differently than if normal (which is the default - see further down)
                    if (direction === 'reversed')
                    {
                        // When drawing reversed or 'upside down' we need to do some trickery on our part.
                        // The canvas text rendering function still draws the text left to right and the correct way up,
                        // so we need to overcome this with rotating the opposite side of the wheel the correct way up then pulling the text
                        // through the center point to the correct segment it is supposed to be on.
                        if (orientation === 'horizontal')
                        {
                            if (alignment === 'inner')
                                this.ctx.textAlign = 'right';
                            else if (alignment === 'outer')
                                this.ctx.textAlign = 'left';
                            else
                                this.ctx.textAlign = 'center';

                            this.ctx.textBaseline = 'middle';

                            // Work out the angle to rotate the wheel, this is in the center of the segment but on the opposite side of the wheel which is why do -180.
                            var textAngle = this.degToRad((seg.endAngle - ((seg.endAngle - seg.startAngle) / 2) + this.rotationAngle - 90) - 180);

                            this.ctx.save();
                            this.ctx.translate(this.centerX, this.centerY);
                            this.ctx.rotate(textAngle);
                            this.ctx.translate(-this.centerX, -this.centerY);

                            if (alignment === 'inner')
                            {
                                // In reversed state the margin is subtracted from the innerX.
                                // When inner the inner radius also comes in to play.
                                if (fillStyle)
                                    this.ctx.fillText(lines[i], this.centerX - this.innerRadius - margin, this.centerY + lineOffset);

                                if (strokeStyle)
                                    this.ctx.strokeText(lines[i], this.centerX - this.innerRadius - margin, this.centerY + lineOffset);
                            }
                            else if (alignment === 'outer')
                            {
                                // In reversed state the position is the center minus the radius + the margin for outer aligned text.
                                if (fillStyle)
                                    this.ctx.fillText(lines[i], this.centerX - this.outerRadius + margin, this.centerY + lineOffset);

                                if (strokeStyle)
                                    this.ctx.strokeText(lines[i], this.centerX - this.outerRadius + margin, this.centerY + lineOffset);
                            }
                            else
                            {
                                // In reversed state the everything in minused.
                                if (fillStyle)
                                    this.ctx.fillText(lines[i], this.centerX - this.innerRadius - ((this.outerRadius - this.innerRadius) / 2) - margin, this.centerY + lineOffset);

                                if (strokeStyle)
                                    this.ctx.strokeText(lines[i], this.centerX - this.innerRadius - ((this.outerRadius - this.innerRadius) / 2) - margin, this.centerY + lineOffset);
                            }

                            this.ctx.restore();
                        }
                        else if (orientation === 'vertical')
                        {
                            // See normal code further down for comments on how it works, this is similar by plus/minus is reversed.
                            this.ctx.textAlign = 'center';

                            // In reversed mode this are reversed.
                            if (alignment === 'inner')
                                this.ctx.textBaseline = 'top';
                            else if (alignment === 'outer')
                                this.ctx.textBaseline = 'bottom';
                            else
                                this.ctx.textBaseline = 'middle';

                            textAngle = (seg.endAngle - ((seg.endAngle - seg.startAngle) / 2) - 180);
                            textAngle += this.rotationAngle;

                            this.ctx.save();
                            this.ctx.translate(this.centerX, this.centerY);
                            this.ctx.rotate(this.degToRad(textAngle));
                            this.ctx.translate(-this.centerX, -this.centerY);

							var yPos;
                            if (alignment === 'outer')
                                yPos = (this.centerY + this.outerRadius - margin);
                            else if (alignment === 'inner')
                                yPos = (this.centerY + this.innerRadius + margin);

                            // I have found that the text looks best when a fraction of the font size is shaved off.
                            var yInc = (fontSize - (fontSize / 9));

                            // Loop though and output the characters.
                            if (alignment === 'outer')
                            {
                                // In reversed mode outer means text in 6 o'clock segment sits at bottom of the wheel and we draw up.
                                for (var c = (lines[i].length -1); c >= 0; c--)
                                {
                                    var character = lines[i].charAt(c);

                                    if (fillStyle)
                                        this.ctx.fillText(character, this.centerX + lineOffset, yPos);

                                    if (strokeStyle)
                                        this.ctx.strokeText(character, this.centerX + lineOffset, yPos);

                                    yPos -= yInc;
                                }
                            }
                            else if (alignment === 'inner')
                            {
                                // In reversed mode inner text is drawn from top of segment at 6 o'clock position to bottom of the wheel.
                                for (var c = 0; c < lines[i].length; c++)
                                {
                                    var character = lines[i].charAt(c);

                                    if (fillStyle)
                                        this.ctx.fillText(character, this.centerX + lineOffset, yPos);

                                    if (strokeStyle)
                                        this.ctx.strokeText(character, this.centerX + lineOffset, yPos);

                                    yPos += yInc;
                                }
                            }
                            else if (alignment === 'center')
                            {
                                // Again for reversed this is the opposite of before.
                                // If there is more than one character in the text then an adjustment to the position needs to be done.
                                // What we are aiming for is to position the center of the text at the center point between the inner and outer radius.
                                var centerAdjustment = 0;

                                if (lines[i].length > 1)
                                {
                                    centerAdjustment = (yInc * (lines[i].length -1) / 2);
                                }

                                var yPos = (this.centerY + this.innerRadius + ((this.outerRadius - this.innerRadius) / 2)) + centerAdjustment + margin;

                                for (var c = (lines[i].length -1); c >= 0; c--)
                                {
                                    character = lines[i].charAt(c);

                                    if (fillStyle)
                                        this.ctx.fillText(character, this.centerX + lineOffset, yPos);

                                    if (strokeStyle)
                                        this.ctx.strokeText(character, this.centerX + lineOffset, yPos);

                                    yPos -= yInc;
                                }
                            }

                            this.ctx.restore();
                        }
                        else if (orientation === 'curved')
                        {
                            // There is no built in canvas function to draw text around an arc,
                            // so we need to do this ourselves.
                            var radius = 0;

                            // Set the alignment of the text - inner, outer, or center by calculating
                            // how far out from the center point of the wheel the text is drawn.
                            if (alignment === 'inner')
                            {
                                // When alignment is inner the radius is the innerRadius plus any margin.
                                radius = this.innerRadius + margin;
                                this.ctx.textBaseline = 'top';
                            }
                            else if (alignment === 'outer')
                            {
                                // Outer it is the outerRadius minus any margin.
                                radius = this.outerRadius - margin;
                                this.ctx.textBaseline = 'bottom';

                                // We need to adjust the radius in this case to take in to multiline text.
                                // In this case the radius needs to be further out, not at the inner radius.
                                radius -= (fontSize * (lines.length - 1));
                            }
                            else if (alignment === 'center')
                            {
                                // When center we want the text halfway between the inner and outer radius.
                                radius = this.innerRadius + margin + ((this.outerRadius - this.innerRadius) / 2);
                                this.ctx.textBaseline = 'middle';
                            }

                            // Set the angle to increment by when looping though and outputting the characters in the text
                            // as we do this by rotating the wheel small amounts adding each character.
                            var anglePerChar = 0;
                            var drawAngle = 0;
						    var radiusPercent = 0;
							var totalArc = 0;

                            // If more than one character in the text then...
                            if (lines[i].length > 1)
                            {
                                // Text is drawn from the left.
                                this.ctx.textAlign = 'left';

                                // Work out how much angle the text rendering loop below needs to rotate by for each character to render them next to each other.
                                // I have discovered that 4 * the font size / 10 at 100px radius is the correct spacing for between the characters
                                // using a monospace font, non monospace may look a little odd as in there will appear to be extra spaces between chars.
                                anglePerChar = (4 * (fontSize / 10));

                                // Work out what percentage the radius the text will be drawn at is of 100px.
                                radiusPercent = (100 / radius);

                                // Then use this to scale up or down the anglePerChar value.
                                // When the radius is less than 100px we need more angle between the letters, when radius is greater (so the text is further
                                // away from the center of the wheel) the angle needs to be less otherwise the characters will appear further apart.
                                anglePerChar = (anglePerChar * radiusPercent);

                                // Next we want the text to be drawn in the middle of the segment, without this it would start at the beginning of the segment.
                                // To do this we need to work out how much arc the text will take up in total then subtract half of this from the center
                                // of the segment so that it sits centred.
                                totalArc = (anglePerChar * lines[i].length);

                                // Now set initial draw angle to half way between the start and end of the segment.
                                drawAngle = seg.startAngle + (((seg.endAngle - seg.startAngle) / 2) - (totalArc / 2));
                            }
                            else
                            {
                                // The initial draw angle is the center of the segment when only one character.
                                drawAngle = (seg.startAngle + ((seg.endAngle - seg.startAngle) / 2));

                                // To ensure is dead-center the text alignment also needs to be centered.
                                this.ctx.textAlign = 'center';
                            }

                            // ----------------------
                            // Adjust the initial draw angle as needed to take in to account the rotationAngle of the wheel.
                            drawAngle += this.rotationAngle;

                            // And as with other 'reverse' text direction functions we need to subtract 180 degrees from the angle
                            // because when it comes to draw the characters in the loop below we add the radius instead of subtract it.
                            drawAngle -= 180;

                            // ----------------------
                            // Now the drawing itself.
                            // In reversed direction mode we loop through the characters in the text backwards in order for them to appear on screen correctly
                            for (c = lines[i].length; c >= 0; c--)
                            {
                                this.ctx.save();

                                character = lines[i].charAt(c);

                                // Rotate the wheel to the draw angle as we need to add the character at this location.
                                this.ctx.translate(this.centerX, this.centerY);
                                this.ctx.rotate(this.degToRad(drawAngle));
                                this.ctx.translate(-this.centerX, -this.centerY);

                                // Now draw the character directly below the center point of the wheel at the appropriate radius.
                                // Note in the reversed mode we add the radius to the this.centerY instead of subtract.
                                if (strokeStyle)
                                    this.ctx.strokeText(character, this.centerX, this.centerY + radius + lineOffset);

                                if (fillStyle)
                                    this.ctx.fillText(character, this.centerX, this.centerY + radius + lineOffset);

                                // Increment the drawAngle by the angle per character so next loop we rotate
                                // to the next angle required to draw the character at.
                                drawAngle += anglePerChar;

                                this.ctx.restore();
                            }
                        }
                    }
                    else
                    {
                        // Normal direction so do things normally.
                        // Check text orientation, of horizontal then reasonably straight forward, if vertical then a bit more work to do.
                        if (orientation === 'horizontal')
                        {
                            // Based on the text alignment, set the correct value in the context.
                            if (alignment === 'inner')
                                this.ctx.textAlign = 'left';
                            else if (alignment === 'outer')
                                this.ctx.textAlign = 'right';
                            else
                                this.ctx.textAlign = 'center';

                            // Set this too.
                            this.ctx.textBaseline = 'middle';

                            // Work out the angle around the wheel to draw the text at, which is simply in the middle of the segment the text is for.
                            // The rotation angle is added in to correct the annoyance with the canvas arc drawing functions which put the 0 degrees at the 3 oclock
                            var textAngle = this.degToRad(seg.endAngle - ((seg.endAngle - seg.startAngle) / 2) + this.rotationAngle - 90);

                            // We need to rotate in order to draw the text because it is output horizontally, so to
                            // place correctly around the wheel for all but a segment at 3 o'clock we need to rotate.
                            this.ctx.save();
                            this.ctx.translate(this.centerX, this.centerY);
                            this.ctx.rotate(textAngle);
                            this.ctx.translate(-this.centerX, -this.centerY);

                            // --------------------------
                            // Draw the text based on its alignment adding margin if inner or outer.
                            if (alignment === 'inner')
                            {
                                // Inner means that the text is aligned with the inner of the wheel. If looking at a segment in in the 3 o'clock position
                                // it would look like the text is left aligned within the segment.

                                // Because the segments are smaller towards the inner of the wheel, in order for the text to fit is is a good idea that
                                // a margin is added which pushes the text towards the outer a bit.

                                // The inner radius also needs to be taken in to account as when inner aligned.

                                // If fillstyle is set the draw the text filled in.
                                if (fillStyle)
                                    this.ctx.fillText(lines[i], this.centerX + this.innerRadius + margin, this.centerY + lineOffset);

                                // If stroke style is set draw the text outline.
                                if (strokeStyle)
                                    this.ctx.strokeText(lines[i], this.centerX + this.innerRadius + margin, this.centerY + lineOffset);
                            }
                            else if (alignment === 'outer')
                            {
                                // Outer means the text is aligned with the outside of the wheel, so if looking at a segment in the 3 o'clock position
                                // it would appear the text is right aligned. To position we add the radius of the wheel in to the equation
                                // and subtract the margin this time, rather than add it.

                                // I don't understand why, but in order of the text to render correctly with stroke and fill, the stroke needs to
                                // come first when drawing outer, rather than second when doing inner.
                                if (fillStyle)
                                    this.ctx.fillText(lines[i], this.centerX + this.outerRadius - margin, this.centerY + lineOffset);

                                // If fillstyle the fill the text.
                                if (strokeStyle)
                                    this.ctx.strokeText(lines[i], this.centerX + this.outerRadius - margin, this.centerY + lineOffset);
                            }
                            else
                            {
                                // In this case the text is to drawn centred in the segment.
                                // Typically no margin is required, however even though centred the text can look closer to the inner of the wheel
                                // due to the way the segments narrow in (is optical effect), so if a margin is specified it is placed on the inner
                                // side so the text is pushed towards the outer.

                                // If stoke style the stroke the text.
                                if (fillStyle)
                                    this.ctx.fillText(lines[i], this.centerX + this.innerRadius + ((this.outerRadius - this.innerRadius) / 2) + margin, this.centerY + lineOffset);

                                // If fillstyle the fill the text.
                                if (strokeStyle)
                                    this.ctx.strokeText(lines[i], this.centerX + this.innerRadius + ((this.outerRadius - this.innerRadius) / 2) + margin, this.centerY + lineOffset);
                            }

                            // Restore the context so that wheel is returned to original position.
                            this.ctx.restore();
                        }
                        else if (orientation === 'vertical')
                        {
                            // If vertical then we need to do this ourselves because as far as I am aware there is no option built in to html canvas
                            // which causes the text to draw downwards or upwards one character after another.

                            // In this case the textAlign is always center, but the baseline is either top or bottom
                            // depending on if inner or outer alignment has been specified.
                            this.ctx.textAlign = 'center';

                            if (alignment === 'inner')
                                this.ctx.textBaseline = 'bottom';
                            else if (alignment === 'outer')
                                this.ctx.textBaseline = 'top';
                            else
                                this.ctx.textBaseline = 'middle';

                            // The angle to draw the text at is halfway between the end and the starting angle of the segment.
                            var textAngle = seg.endAngle - ((seg.endAngle - seg.startAngle) / 2);

                            // Ensure the rotation angle of the wheel is added in, otherwise the test placement won't match
                            // the segments they are supposed to be for.
                            textAngle += this.rotationAngle;

                            // Rotate so can begin to place the text.
                            this.ctx.save();
                            this.ctx.translate(this.centerX, this.centerY);
                            this.ctx.rotate(this.degToRad(textAngle));
                            this.ctx.translate(-this.centerX, -this.centerY);

                            // Work out the position to start drawing in based on the alignment.
                            // If outer then when considering a segment at the 12 o'clock position want to start drawing down from the top of the wheel.
                            if (alignment === 'outer')
                                var yPos = (this.centerY - this.outerRadius + margin);
                            else if (alignment === 'inner')
                                var yPos = (this.centerY - this.innerRadius - margin);

                            // We need to know how much to move the y axis each time.
                            // This is not quite simply the font size as that puts a larger gap in between the letters
                            // than expected, especially with monospace fonts. I found that shaving a little off makes it look "right".
                            var yInc = (fontSize - (fontSize / 9));

                            // Loop though and output the characters.
                            if (alignment === 'outer')
                            {
                                // For this alignment we draw down from the top of a segment at the 12 o'clock position to simply
                                // loop though the characters in order.
                                for (var c = 0; c < lines[i].length; c++)
                                {
                                    character = lines[i].charAt(c);

                                    if (fillStyle)
                                        this.ctx.fillText(character, this.centerX + lineOffset, yPos);

                                    if (strokeStyle)
                                        this.ctx.strokeText(character, this.centerX + lineOffset, yPos);

                                    yPos += yInc;
                                }
                            }
                            else if (alignment === 'inner')
                            {
                                // Here we draw from the inner of the wheel up, but in order for the letters in the text text to
                                // remain in the correct order when reading, we actually need to loop though the text characters backwards.
                                for (var c = (lines[i].length -1); c >= 0; c--)
                                {
                                    character = lines[i].charAt(c);

                                    if (fillStyle)
                                        this.ctx.fillText(character, this.centerX + lineOffset, yPos);

                                    if (strokeStyle)
                                        this.ctx.strokeText(character, this.centerX + lineOffset, yPos);

                                    yPos -= yInc;
                                }
                            }
                            else if (alignment === 'center')
                            {
                                // This is the most complex of the three as we need to draw the text top down centred between the inner and outer of the wheel.
                                // So logically we have to put the middle character of the text in the center then put the others each side of it.
                                // In reality that is a really bad way to do it, we can achieve the same if not better positioning using a
                                // variation on the method used for the rendering of outer aligned text once we have figured out the height of the text.

                                // If there is more than one character in the text then an adjustment to the position needs to be done.
                                // What we are aiming for is to position the center of the text at the center point between the inner and outer radius.
                                var centerAdjustment = 0;

                                if (lines[i].length > 1)
                                {
                                    centerAdjustment = (yInc * (lines[i].length -1) / 2);
                                }

                                // Now work out where to start rendering the string. This is half way between the inner and outer of the wheel, with the
                                // centerAdjustment included to correctly position texts with more than one character over the center.
                                // If there is a margin it is used to push the text away from the center of the wheel.
                                var yPos = (this.centerY - this.innerRadius - ((this.outerRadius - this.innerRadius) / 2)) - centerAdjustment - margin;

                                // Now loop and draw just like outer text rendering.
                                for (var c = 0; c < lines[i].length; c++)
                                {
                                    character = lines[i].charAt(c);

                                    if (fillStyle)
                                        this.ctx.fillText(character, this.centerX + lineOffset, yPos);

                                    if (strokeStyle)
                                        this.ctx.strokeText(character, this.centerX + lineOffset, yPos);

                                    yPos += yInc;
                                }
                            }

                            this.ctx.restore();
                        }
                        else if (orientation === 'curved')
                        {
                            // There is no built in canvas function to draw text around an arc, so
                            // we need to do this ourselves.
                            var radius = 0;

                            // Set the alignment of the text - inner, outer, or center by calculating
                            // how far out from the center point of the wheel the text is drawn.
                            if (alignment === 'inner')
                            {
                                // When alignment is inner the radius is the innerRadius plus any margin.
                                radius = this.innerRadius + margin;
                                this.ctx.textBaseline = 'bottom';

                                // We need to adjust the radius in this case to take in to multiline text.
                                // In this case the radius needs to be further out, not at the inner radius.
                                radius += (fontSize * (lines.length - 1));
                            }
                            else if (alignment === 'outer')
                            {
                                // Outer it is the outerRadius minus any margin.
                                radius = this.outerRadius - margin;
                                this.ctx.textBaseline = 'top';
                            }
                            else if (alignment === 'center')
                            {
                                // When center we want the text halfway between the inner and outer radius.
                                radius = this.innerRadius + margin + ((this.outerRadius - this.innerRadius) / 2);
                                this.ctx.textBaseline = 'middle';
                            }

                            // Set the angle to increment by when looping though and outputting the characters in the text
                            // as we do this by rotating the wheel small amounts adding each character.
                            var anglePerChar = 0;
                            var drawAngle = 0;

                            // If more than one character in the text then...
                            if (lines[i].length > 1)
                            {
                                // Text is drawn from the left.
                                this.ctx.textAlign = 'left';

                                // Work out how much angle the text rendering loop below needs to rotate by for each character to render them next to each other.
                                // I have discovered that 4 * the font size / 10 at 100px radius is the correct spacing for between the characters
                                // using a monospace font, non monospace may look a little odd as in there will appear to be extra spaces between chars.
                                anglePerChar = (4 * (fontSize / 10));

                                // Work out what percentage the radius the text will be drawn at is of 100px.
                                radiusPercent = (100 / radius);

                                // Then use this to scale up or down the anglePerChar value.
                                // When the radius is less than 100px we need more angle between the letters, when radius is greater (so the text is further
                                // away from the center of the wheel) the angle needs to be less otherwise the characters will appear further apart.
                                anglePerChar = (anglePerChar * radiusPercent);

                                // Next we want the text to be drawn in the middle of the segment, without this it would start at the beginning of the segment.
                                // To do this we need to work out how much arc the text will take up in total then subtract half of this from the center
                                // of the segment so that it sits centred.
                                totalArc = (anglePerChar * lines[i].length);

                                // Now set initial draw angle to half way between the start and end of the segment.
                                drawAngle = seg.startAngle + (((seg.endAngle - seg.startAngle) / 2) - (totalArc / 2));
                            }
                            else
                            {
                                // The initial draw angle is the center of the segment when only one character.
                                drawAngle = (seg.startAngle + ((seg.endAngle - seg.startAngle) / 2));

                                // To ensure is dead-center the text alignment also needs to be centred.
                                this.ctx.textAlign = 'center';
                            }

                            // ----------------------
                            // Adjust the initial draw angle as needed to take in to account the rotationAngle of the wheel.
                            drawAngle += this.rotationAngle;

                            // ----------------------
                            // Now the drawing itself.
                            // Loop for each character in the text.
                            for (c = 0; c < (lines[i].length); c++)
                            {
                                this.ctx.save();

                                character = lines[i].charAt(c);

                                // Rotate the wheel to the draw angle as we need to add the character at this location.
                                this.ctx.translate(this.centerX, this.centerY);
                                this.ctx.rotate(this.degToRad(drawAngle));
                                this.ctx.translate(-this.centerX, -this.centerY);

                                // Now draw the character directly above the center point of the wheel at the appropriate radius.
                                if (strokeStyle)
                                    this.ctx.strokeText(character, this.centerX , this.centerY - radius + lineOffset);

                                if (fillStyle)
                                    this.ctx.fillText(character, this.centerX, this.centerY - radius + lineOffset);

                                // Increment the drawAngle by the angle per character so next loop we rotate
                                // to the next angle required to draw the character at.
                                drawAngle += anglePerChar;

                                this.ctx.restore();
                            }
                        }
                    }

                    // Increment this ready for the next time.
                    lineOffset += fontSize;
                }
            }

            // Restore so all text options are reset ready for the next text.
            this.ctx.restore();
        }
    }
  }
  
  // ====================================================================================================================
  // This function sorts out the segment sizes. Some segments may have set sizes, for the others what is left out of
  // 360 degrees is shared evenly. What this function actually does is set the start and end angle of the arcs.
  // ====================================================================================================================
  updateSegmentSizes = function()
  {
    // If this object actually contains some segments
    if (this.segments)
    {
        // First add up the arc used for the segments where the size has been set.
        var arcUsed = 0;
        var numSet  = 0;

        // Remember, to make it easy to access segments, the position of the segments in the array starts from 1 (not 0).
        for (var x = 1; x <= this.numSegments; x ++)
        {
            if (this.segments[x].size !== null)
            {
                arcUsed += this.segments[x].size;
                numSet ++;
            }
        }

        var arcLeft = (360 - arcUsed);

        // Create variable to hold how much each segment with non-set size will get in terms of degrees.
        var degreesEach = 0;

        if (arcLeft > 0)
        {
            degreesEach = (arcLeft / (this.numSegments - numSet));
        }

        // ------------------------------------------
        // Now loop though and set the start and end angle of each segment.
        var currentDegree = 0;

        for (var x = 1; x <= this.numSegments; x ++)
        {
            // Set start angle.
            this.segments[x].startAngle = currentDegree;

            // If the size is set then add this to the current degree to get the end, else add the degreesEach to it.
            if (this.segments[x].size)
            {
                currentDegree += this.segments[x].size;
            }
            else
            {
                currentDegree += degreesEach;
            }

            // Set end angle.
            this.segments[x].endAngle = currentDegree;
        }
    }
  }
  
  // ==================================================================================================================================================
  // This function starts the wheel's animation by using the properties of the animation object of of the wheel to begin the a greensock tween.
  // ==================================================================================================================================================
  startAnimation()
  {
    if (this.animation)
    {
        // Call function to compute the animation properties.
        this.computeAnimation();

        // Set this global variable to this object as an external function is required to call the draw() function on the wheel
        // each loop of the animation as Greensock cannot call the draw function directly on this class.
        winwheelToDrawDuringAnimation = this;

        // Put together the properties of the greesock animation.
        var properties = new Array(null);
        properties[this.animation.propertyName] = this.animation.propertyValue; // Here we set the property to be animated and its value.
        properties['yoyo']       = this.animation.yoyo;     // Set others.
        properties['repeat']     = this.animation.repeat;
        properties['ease']       = this.animation.easing;
        properties['onUpdate']   = this.AnimationLoop;   // Call function to re-draw the canvas.
        properties['onComplete'] = this.AnimationCompleted;   // Call function to perform actions when animation has finished.

        // Do the tween animation passing the properties from the animation object as an array of key => value pairs.
        // Keep reference to the tween object in the wheel as that allows pausing, resuming, and stopping while the animation is still running.
        this.tween = TweenMax.to(this, this.animation.duration, properties);
    }
  }
  
  // ====================================================================================================================
  // In order for the wheel to be re-drawn during the spin animation the function greesock calls needs to be outside
  // of the class as for some reason it errors if try to call winwheel.draw() directly.
  // ====================================================================================================================
  AnimationLoop(){
	if (winwheelToDrawDuringAnimation)
    {
        // Check if the clearTheCanvas is specified for this animation, if not or it is not false then clear the canvas.
        if (winwheelToDrawDuringAnimation.clearTheCanvas !== false)
        {
            winwheelToDrawDuringAnimation.ctx.clearRect(0, 0, winwheelToDrawDuringAnimation.width, winwheelToDrawDuringAnimation.height);
        }
        // Call code to draw the wheel, 
        winwheelToDrawDuringAnimation.draw(false);
    }  
  }
  
  
  AnimationCompleted(){
	var winningSegment = winwheelToDrawDuringAnimation.getIndicatedSegment();
    // Do basic alert of the segment text.
	winwheelToDrawDuringAnimation.ResultCallback(winningSegment.text);
  }

  // ====================================================================================================================
  // Called at the beginning of the startAnimation function and computes the values needed to do the animation
  // before it starts. This allows the developer to change the animation properties after the wheel has been created
  // and have the animation use the new values of the animation properties.
  // ====================================================================================================================
  computeAnimation()
  {
    if (this.animation)
    {
        // Spin to stop the rotation angle is affected.
		this.animation.propertyName = 'rotationAngle';

		if (this.animation.spins == null)
		{
			this.animation.spins = 5;
		}

		if (this.animation.repeat == null)
		{
			this.animation.repeat = 0;        // As this is spin to stop we don't normally want it repeated.
		}

		if (this.animation.easing == null)
		{
			this.animation.easing = 'Power4.easeOut';     // This easing is fast start and slows over time.
		}

		if (this.animation.stopAngle == null)
		{
			// If the stop angle has not been specified then pick random between 0 and 359.
			this.animation._stopAngle = Math.floor((Math.random() * 359));
		}
		else
		{
			// We need to set the internal to 360 minus what the user entered because the wheel spins past 0 without
			// this it would indicate the prize on the opposite side of the wheel. We aslo need to take in to account
			// the pointerAngle as the stop angle needs to be relative to that.
			this.animation._stopAngle = (360 - this.animation.stopAngle + this.pointerAngle);
		}

		if (this.animation.yoyo == null)
		{
			this.animation.yoyo = false;
		}

		// The property value is the spins * 360 then plus or minus the stopAngle depending on if the rotation is clockwise or anti-clockwise.
		this.animation.propertyValue = (this.animation.spins * 360);

		if (this.animation.direction === 'anti-clockwise')
		{
			this.animation.propertyValue = (0 - this.animation.propertyValue);

			// Also if the value is anti-clockwise we need subtract the stopAngle (but to get the wheel to stop in the correct
			// place this is 360 minus the stop angle as the wheel is rotating backwards).
			this.animation.propertyValue -= (360 - this.animation._stopAngle);
		}
		else
		{
			// Add the stopAngle to the propertyValue as the wheel must rotate around to this place and stop there.
			this.animation.propertyValue += this.animation._stopAngle;
		}
    }
  }
  
  // ====================================================================================================================
  // Returns a reference to the segment that is at the location of the pointer on the wheel.
  // ====================================================================================================================
  getIndicatedSegment()
  {
    // Call function below to work this out and return the prizeNumber.
    var prizeNumber = this.getIndicatedSegmentNumber();

    // Then simply return the segment in the segments array at that position.
    return this.segments[prizeNumber];
  }
  
  // ====================================================================================================================
  // Works out the segment currently pointed to by the pointer of the wheel. Normally called when the spinning has stopped
  // to work out the prize the user has won. Returns the number of the segment in the segments array.
  // ====================================================================================================================
  getIndicatedSegmentNumber()
  {
    var indicatedPrize = 0;
    var rawAngle = this.getRotationPosition();

    // Now we have the angle of the wheel, but we need to take in to account where the pointer is because
    // will not always be at the 12 o'clock 0 degrees location.
    var relativeAngle = Math.floor(this.pointerAngle - rawAngle);

    if (relativeAngle < 0)
    {
        relativeAngle = 360 - Math.abs(relativeAngle);
    }

    // Now we can work out the prize won by seeing what prize segment startAngle and endAngle the relativeAngle is between.
    for (var x = 1; x < (this.segments.length); x ++)
    {
        if ((relativeAngle >= this.segments[x]['startAngle']) && (relativeAngle <= this.segments[x]['endAngle']))
        {
            indicatedPrize = x;
            break;
        }
    }

    return indicatedPrize;
  }
  
  // ==================================================================================================================================================
  // Returns the rotation angle of the wheel corrected to 0-360 (i.e. removes all the multiples of 360).
  // ==================================================================================================================================================
  getRotationPosition()
  {
    var rawAngle = this.rotationAngle;  // Get current rotation angle of wheel.

    // If positive work out how many times past 360 this is and then take the floor of this off the rawAngle.
    if (rawAngle >= 0)
    {
        if (rawAngle > 360)
        {
            // Get floor of the number of times past 360 degrees.
            var timesPast360 = Math.floor(rawAngle / 360);

            // Take all this extra off to get just the angle 0-360 degrees.
            rawAngle = (rawAngle - (360 * timesPast360));
        }
    }
    else
    {
        // Is negative, need to take off the extra then convert in to 0-360 degree value
        // so if, for example, was -90 then final value will be (360 - 90) = 270 degrees.
        if (rawAngle < -360)
        {
            var timesPast360 = Math.ceil(rawAngle / 360);   // Ceil when negative.

            rawAngle = (rawAngle - (360 * timesPast360));   // Is minus because dealing with negative.
        }

        rawAngle = (360 + rawAngle);    // Make in the range 0-360. Is plus because raw is still negative.
    }

    return rawAngle;
  }
  
  // ====================================================================================================================
  // Converts degrees to radians which is what is used when specifying the angles on HTML5 canvas arcs.
  // ====================================================================================================================
  degToRad(d)
  {
    return d * 0.0174532925199432957;
  }

  // ====================================================================================================================
  // This function sets the center location of the wheel, saves a function call to set x then y.
  // ====================================================================================================================
  setCenter(x, y)
  {
    this.centerX = x;
    this.centerY = y;
  }
}

export default Wheel;

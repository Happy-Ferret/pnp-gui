

var createGeometry = require("gl-geometry")
var createShader = require("gl-shader")
var mat4 = require("gl-mat4")
var fontInfo = require("./font_info.js")
var fontAtlas= require("./font_atlas.js")
var createTexture = require('gl-texture2d')


const VIRTUAL_WIDTH  = 2000;
const VIRTUAL_HEIGHT = 1300;



const vert = `
precision mediump float;
 
attribute vec2 aPosition;
attribute vec3 aColor;
attribute vec2 aUv;

uniform mat4 uProj;

varying vec3 vColor;
varying vec2 vUv;
 
void main() {
  gl_Position = uProj * vec4(aPosition, 0, 1);
  vColor = aColor;
  vUv = aUv;
}
`

const
    frag = `
precision mediump float;
 
varying vec3 vColor;
varying vec2 vUv;

uniform sampler2D uFontAtlas;

void main() {
  vec4 sample = texture2D(uFontAtlas, vUv);
  //sample.xyz = vec3(1.0, 1.0, 1.0);
  gl_FragColor = vec4(/*vColor.xyz */ sample.xyz, sample.x );
 // gl_FragColor = vec4(vUv, 0.0, 1.0 );
  
}
`

/*
Constructor
 */
function GUI(gl) {
    console.log("CREATE")

    this.allGuiGeometry = createGeometry(gl)
    this.shader = createShader(gl, vert, frag)

    // distance from window-borders to the widgets.
    this.windowSpacing = 19;

    // the vertical spacing between the widgets.
    this.widgetSpacing = 11;


    this.windowPosition = [000,100]
    this.windowSize = [300,1000]

   // console.log("font info", fontInfo.chars[2] )
  //  console.log("font atlas", typeof(fontAtlas) )

    this.fontAtlasTexture = createTexture(gl, fontAtlas)

    //this._getCharDesc("@");

    this.textScale = 2.0;
    this.textBase = fontInfo.common.base;
    this.textScaleW = fontInfo.common.scaleW;
    this.textScaleH= fontInfo.common.scaleH;
    this.textFontHeight= fontInfo.common.lineHeight;

   // console.log( this.textBase)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)


    gl.disable(gl.CULL_FACE)


}

GUI.prototype._getCharDesc = function(char) {
    return fontInfo.chars[ char.charCodeAt(0) -32];
}

/*
PRIVATE
 */
GUI.prototype._addIndex = function(index) {
    this.indexBuffer[this.indexBufferIndex++] = index;
}

/*
PRIVATE
 */
GUI.prototype._addPosition = function(position) {
    this.positionBuffer[this.positionBufferIndex++] = position[0];
    this.positionBuffer[this.positionBufferIndex++] = position[1];

}

/*
 PRIVATE
 */
GUI.prototype._addColor = function(color) {
    this.colorBuffer[this.colorBufferIndex++] = color[0];
    this.colorBuffer[this.colorBufferIndex++] = color[1];
    this.colorBuffer[this.colorBufferIndex++] = color[2];
}

GUI.prototype._addUv = function(uv) {
    this.uvBuffer[this.uvBufferIndex++] = uv[0];
    this.uvBuffer[this.uvBufferIndex++] = uv[1];
}



/*
render text
 */
GUI.prototype._text = function(position, str, spacing) {

    var x = position[0];
    var y = position[1];

    y += this.textScale * this.textBase;

    for(var i = 0; i < str.length; ++i) {

        var ch = str[i];

        // char desc
        var cd = this._getCharDesc(ch);

        // Map the center of the texel to the corners
        // in order to get pixel perfect mapping
        var u = ((cd.x)+0.5) / this.textScaleW;
        var v = ((cd.y)+0.5) / this.textScaleH;
        var u2 = u + (cd.width) / this.textScaleW;
        var v2 = v + (cd.height) / this.textScaleH;

        var a = this.textScale * (cd.xadvance);
        var w = this.textScale * (cd.width);
        var h = this.textScale * (cd.height);
        var ox = this.textScale * (cd.xoffset);
        var oy = this.textScale * (cd.yoffset);

      //  console.log("bla ",cd.width,  this.textScaleW, u + (cd.width) / this.textScaleW );


       // console.log("tp bl tr br:", [x+ox, y-h-oy], [x+ox, y-oy], [x+w+ox, y-h-oy],  [x+w+ox, y-oy] );


        var baseIndex = this.positionBufferIndex / 2;

    //    console.log("tl br tr br", [u, v], [u, v2], [u2, v], [u2, v2])

        var whiteColor = [1,1,1]

        // top left
        this._addPosition([x+ox, y-h-oy]);
        this._addColor(whiteColor);
        this._addUv([u, v]);


        // bottom left
        this._addPosition([x+ox, y-oy]);
        this._addColor(whiteColor);
        this._addUv([u, v2]);


        // top right
        this._addPosition([x+w+ox, y-h-oy]);
        this._addColor(whiteColor);
        this._addUv([u2, v]);


        // bottom right
        this._addPosition([x+w+ox, y-oy]);
        this._addColor(whiteColor);
        this._addUv([u2, v2]);


        // console.log("array",  this.positionBufferIndex / 2 );


        this._addIndex(baseIndex+0);
        this._addIndex(baseIndex+1);
        this._addIndex(baseIndex+2);

        this._addIndex(baseIndex+1);
        this._addIndex(baseIndex+2);
        this._addIndex(baseIndex+3);

/*
        render->VtxColor(color);
        render->VtxData(ch->chnl);
        render->VtxTexCoord(u, v);
        render->VtxPos(x+ox, y-oy, z);
        render->VtxTexCoord(u2, v);
        render->VtxPos(x+w+ox, y-oy, z);
        render->VtxTexCoord(u2, v2);
        render->VtxPos(x+w+ox, y-h-oy, z);
        render->VtxTexCoord(u, v2);
        render->VtxPos(x+ox, y-h-oy, z);
        */

        x += a;
        if( ch == " " )
            x += spacing;

        /*
        if( n < count )
            x += AdjustForKerningPairs(charId, GetTextChar(text,n));
        */

    }
}

/*
PRIVATE
 */
GUI.prototype._box = function(position, size, color) {

    // top-left, bottom-left, top-right, bottom-right corners
    var tl = position;
    var bl =  [position[0]          , position[1] + size[1]  ];
    var tr =  [position[0] + size[0], position[1]            ];
    var br =  [position[0] + size[0], position[1] + size[1]  ];

    var baseIndex = this.positionBufferIndex / 2;

    var whiteUv = [0,0]

    this._addPosition(tl);
    this._addColor(color);
    this._addUv([0,0]);

    this._addPosition(bl);
    this._addColor(color);
    this._addUv([0,0]);

    this._addPosition(tr);
    this._addColor(color);
    this._addUv([0,0]);

    this._addPosition(br);
    this._addColor(color);
    this._addUv([0,0]);

   // console.log("array",  this.positionBufferIndex / 2 );


    this._addIndex(baseIndex+0);
    this._addIndex(baseIndex+1);
    this._addIndex(baseIndex+2);

    this._addIndex(baseIndex+1);
    this._addIndex(baseIndex+2);
    this._addIndex(baseIndex+3);

}

GUI.prototype._createVirtualToScreenMatrix = function(out, canvasWidth, canvasHeight) {
    var widthScale = canvasWidth / VIRTUAL_WIDTH;
    var heightScale = canvasHeight / VIRTUAL_HEIGHT;

    var scale = 0;
    var xOffset = 0;
    var yOffset = 0;
    if(widthScale < heightScale){
        scale = widthScale;
        yOffset = (canvasHeight - VIRTUAL_HEIGHT * scale) / 2;
        xOffset = 0;
    } else {
        scale = heightScale;
        xOffset = (canvasWidth - VIRTUAL_WIDTH * scale) / 2;
        yOffset = 0;
    }


    out[0] = scale;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = scale;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 0;
    out[11] = 0;
    out[12] = xOffset;
    out[13] = yOffset;
    out[14] = 0;
    out[15] = 1;

    return out;
}

GUI.prototype.button = function() {

    var buttonPosition = this.windowCaret;

    this._box(this.windowCaret, [200,200], [1.0, 0.0, 0.0]  )
    this.windowCaret = [this.windowCaret[0], this.windowCaret[1] + 200 + this.widgetSpacing]
}


GUI.prototype.begin = function(){

    this.indexBuffer = [];
    this.positionBuffer = [];
    this.colorBuffer = [];
    this.uvBuffer = [];

    this.indexBufferIndex = 0;
    this.positionBufferIndex = 0;
    this.colorBufferIndex = 0;
    this.uvBufferIndex = 0;

    // render window.
  //  this._box(this.windowPosition, this.windowSize, [0.3, 0.3, 0.3]  )

    // setup the window-caret. The window-caret is where we will place the next widget in the window.
    this.windowCaret = [this.windowPosition[0] + this.windowSpacing, this.windowPosition[1] + this.windowSpacing]

/*
    this.button()

    this.button()

    this.button()
*/

   this._text([100,100] , "Eric Arneback", 0);


    // this.addBox(vec2.fromValues(000,100), vec2.fromValues(100,100), [1.0, 1.0, 0.0]  )

   // this.addBox(vec2.fromValues(000,200), vec2.fromValues(100,100), [1.0, 1.0, 1.0]  )

}

GUI.prototype.end = function(canvasWidth, canvasHeight){

    // create GUI geometry.
    this.allGuiGeometry
        .attr("aPosition", this.positionBuffer, {size: 2} )
        .attr("aColor", this.colorBuffer, {size: 3} )
        .attr("aUv", this.uvBuffer, {size: 2} )

        .faces(this.indexBuffer );


    this.shader.bind()

   var projection = mat4.create()

   mat4.ortho(projection, 0, canvasWidth, canvasHeight, 0,  -1.0, 1.0)

    var virtualToScreenMatrix = mat4.create()

    this._createVirtualToScreenMatrix(virtualToScreenMatrix, canvasWidth, canvasHeight)

    mat4.multiply(projection, projection, virtualToScreenMatrix)

    this.shader.uniforms.uProj = projection;

    this.shader.uniforms.uFontAtlas = this.fontAtlasTexture .bind()

    // render bunny.
    this.allGuiGeometry.bind(this.shader)



    this.allGuiGeometry.draw()
}


module.exports = GUI;


/*
if( token == "lineHeight" )
    fontHeight = (short)strtol(value.c_str(), 0, 10);
else if( token == "base" )
    base = (short)strtol(value.c_str(), 0, 10);
else if( token == "scaleW" )
    scaleW = (short)strtol(value.c_str(), 0, 10);
else if( token == "scaleH" )
    scaleH = (short)strtol(value.c_str(), 0, 10);
else if( token == "pages" )
    pages = strtol(value.c_str(), 0, 10);
else if( token == "packed" )
    packed = strtol(value.c_str(), 0, 10);

    */
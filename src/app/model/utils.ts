import { vec3 } from "gl-matrix";
import * as GLMat from "gl-matrix";
//import { Scene } from "./Film";
import { Config } from "./config";
import { EPSILON, Ray } from "./Primitive";
import { Scene } from "./Scene";

export var verbose = false;
export var verbose2 = false;
export var verbose3 = false;
export function setVerbose(value:boolean)
{
    verbose = value
    verbose2 = value
    verbose3 = value
}

export function saveCanvasAs(canvas:HTMLCanvasElement, fileName:string) {
    // get image data and transform mime type to application/octet-stream
    var canvasDataUrl = canvas.toDataURL()
            .replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
    var link = document.createElement('a'); // create an anchor tag

    // set parameters for downloading
    link.setAttribute('href', canvasDataUrl);
    link.setAttribute('target', '_blank');
    link.setAttribute('download', fileName);

    // compat mode for dispatching click on your anchor
    if (document.createEvent) {
        var evtObj = document.createEvent('MouseEvents');
        evtObj.initEvent('click', true, true);
        link.dispatchEvent(evtObj);
    } else if (link.click) {
        link.click();
    }
}


export function closeTo(v1:number, v2:number, eps = EPSILON)
{
    return Math.abs(v1 - v2) < eps;
}
export function VecAbs(n:vec3):vec3{
    return <vec3>n.map(v=>Math.abs(v));
}
export function VecMap(n:vec3, min:vec3,max:vec3):vec3{
    let delta = sub2(max, min);
    let factor = <vec3>delta.map(v=>1/v)
    return mul(sub2(n,min), factor);
}

export function sollution([a,b,c]:vec3)
{
    var delta = b*b -4*a*c;
    var sol1 = (-b + Math.sqrt(delta))/(2*a)
    var sol2 = (-b - Math.sqrt(delta))/(2*a);
    if(verbose)console.log("Calc Solution", -b, delta, 2*a)
    return [sol1,sol2];
    
}
export function createMat4(c1:vec3, c2:vec3, c3:vec3,c4:vec3):GLMat.mat4
{
    return [
        c1[0],c1[1],c1[2],0,
        c2[0],c2[1],c2[2],0,
        c3[0],c3[1],c3[2],0,
        c4[0],c4[1],c4[2],1,]
}

export function add2(v1:vec3, v2:vec3)
{
    return vec3.add([0,0,0], v1, v2);
}
export function add3(v1:vec3, v2:vec3, v3:vec3)
{
    var v = vec3.create();
    vec3.add(v, v1, v2);
    vec3.add(v, v, v3);
    return v
}
export function sub2(v1:vec3, v2:vec3)
{
    return vec3.sub([0,0,0], v1, v2);
}
export function mul(v1:vec3, v2:vec3)
{
    return vec3.mul([0,0,0], v1, v2);
}
export function divide(v1:vec3, v2:vec3)
{
    return vec3.divide([0,0,0], v1, v2);
}
export function mulMat(v1:GLMat.mat4, v2:GLMat.mat4)
{
    return GLMat.mat4.multiply(GLMat.mat4.create(), v1, v2);
}
export function cross(v1:vec3, v2:vec3)
{
    return vec3.cross([0,0,0], v1, v2);
}
export function getTranslation(v1:GLMat.mat4)
{
    return GLMat.mat4.getTranslation(GLMat.vec3.create(), v1);
    //return <vec3>[0,0,0]//GLMat.mat4.getTranslation(GLMat.vec3.create(), v1);
}
export function dot(v1:vec3, v2:vec3)
{
    return vec3.dot( v1, v2);
}
export function triple(v1:vec3, v2:vec3, v3:vec3)
{
    return vec3.dot( v1, cross(v2,v3));
}
export function reflect(d:vec3, n:vec3){
    //d−2(d⋅n)n
    //return sub2(d, scale(n,2*dot(d,n)))
    return sub2(scale(n,2*dot(d,n)),d)
}
export function scale(v1:vec3, n:number)
{
    return vec3.scale([0,0,0], v1, n);
}
export function minus(v1:vec3)
{
    return vec3.scale([0,0,0], v1, -1);
}
export function distance(v1:vec3, v2:vec3)
{
    return vec3.distance(v1, v2);
}
export function length(v1:vec3)
{
    return vec3.length(v1);
}
export function sqrLen(v1:vec3)
{
    return vec3.sqrLen(v1);
}
export function normalize(v:vec3)
{
    return vec3.normalize([0,0,0], v);
}
export function inverse(v:GLMat.mat4)
{
    return GLMat.mat4.invert([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,], v);
}
export function min(...all:vec3[])
{
    var res = vec3.fromValues(Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY);
    all.forEach(v=>vec3.min(res,res, v));
    return res;
}
export function max(...all:vec3[])
{
    var res = vec3.fromValues(Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY);
    all.forEach(v=>vec3.max(res,res, v));
    return res;
}
export function transpose(v:GLMat.mat4)
{
    return GLMat.mat4.transpose([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,], v);
}
export function toVec4(v:vec3):GLMat.vec4{
    return [v[0],v[1],v[2],1];
}
export function toVec3(v:GLMat.vec4):vec3{
    return [v[0],v[1],v[2]];
}

export function transform(mat:GLMat.mat4, origin: vec3) {
    return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(origin), mat))
}

export function identity()
{
    var m = GLMat.mat4.create();
    GLMat.mat4.identity(m)
    return m;
}

export function translate(mat:GLMat.mat4, translation:vec3=[0,0,0])
{
    GLMat.mat4.translate(mat, mat, translation)
    return mat;
}
export function scaleMat(mat:GLMat.mat4, scale:vec3=[0,0,0])
{
    GLMat.mat4.scale(mat, mat, scale)
    return mat;
}

export const VECS = {
    get ZERO(){ return <vec3>[0,0,0]},
    get ONE(){ return <vec3>[1,1,1]},
    create(n:number){ return <vec3>[n,n,n]}
}

export const COLOR = {
    RED : <vec3>[1,0,0],
    GREEN : <vec3>[0,1,0],
    BLUE : <vec3>[0,0,1],
    GRAY_8 : <vec3>[0x8/16,0x8/16,0x8/16],
    GRAY_F : <vec3>[0xf/16,0xf/16,0xf/16],
    BLACK : VECS.ZERO,
    WHITE : VECS.ONE,
}

const degrees_to_radians = (deg:number) => (deg * Math.PI) / 180.0;
export function rotate(mat:GLMat.mat4, angle:number, axis:"x"|"y"|"z")
{
    var axisvec = vec3.fromValues(1,0,0);
    switch(axis)
    {
        case "y":
            axisvec = vec3.fromValues(0,1,0);
            break;
        case "z":
            axisvec = vec3.fromValues(0,0,1);
            break;

    }
    GLMat.mat4.rotate(mat, mat, degrees_to_radians(angle), axisvec);
    return mat;
}



export function sampleBetween(ray:Ray, xmin:number,xmax:number,ymin:number,ymax:number)
{
    var sample = (<any>ray)['sample'];
    if(!sample) return false
    return sampleBetween2(sample, xmin, xmax,ymin,ymax)
}
export function sampleBetween2(sample:GLMat.vec2, xmin:number,xmax:number,ymin:number,ymax:number)
{
    var check = (
        ((sample[0] > xmin) && (sample[0] < xmax)) &&
        ((sample[1] > ymin) && (sample[1] < ymax)) &&
        true
        );
    //if(check)
    //console.log("ymax",sample)
    return check? true:false;
    //if(sample)
    {
        return check;
        
    }
    return false;
}

export function abs(v:vec3){
    return <vec3>v.map(c=>Math.abs(c));
}
export function absdist(n:number, n2:number, delta=EPSILON){
    return Math.abs(n-n2) < delta
}

export function debugSample(scene:{sample:GLMat.vec2}):boolean{
    return Config.DEBUG_SAMPLE && absdist(scene.sample[0],Config.DEBUG_SAMPLE[0], Config.SAMPLE_DIST) && absdist(scene.sample[1], Config.DEBUG_SAMPLE[1], Config.SAMPLE_DIST);
}
export function debugSample2(scene:{sample:GLMat.vec2}):boolean{
    return Config.DEBUG_SAMPLE2 && scene.sample[0] == Config.DEBUG_SAMPLE[0] && scene.sample[1]==Config.DEBUG_SAMPLE[1]
}
const factor = 2;
const factor2 = 4;
export function calculateHitCode(code:number):vec3{
    //code = 5;
    return [(((code)/factor2)%factor)/2,(((code)/factor)%factor)/2,((code)%factor)/2]
}


export const setPixel = (myImageData:any, x:number, y:number, width:number, height:number, r:number, g:number, b:number, a:number = 255) => {

    const colorIndices = getColorIndicesForCoord(x, height-(y+1), width);
    const [redIndex, greenIndex, blueIndex, alphaIndex] = colorIndices;
    //film->SetPixelValue(i, j, glm::vec3(1.0f, 0.0f, 0.0f));

    for(let j = 0; j<Config.REPEAT_PX; ++j)
    {
        for(let i = 0; i<Config.REPEAT_PX; ++i)
        {
            myImageData.data[redIndex+(i*4)+ (j*width*Config.REPEAT_PX*4)] = r;
            myImageData.data[greenIndex+(i*4)+j*width*Config.REPEAT_PX*4] = g;
            myImageData.data[blueIndex+(i*4)+j*width*Config.REPEAT_PX*4] = b;
            myImageData.data[alphaIndex+(i*4)+j*width*Config.REPEAT_PX*4] = a;
        }
    }
  }
  
  export  const getColorIndicesForCoord = (x:number, y:number, width:number, hasAlpha:boolean = true) => {
    const idxMul = hasAlpha?4:3
    const red = y * Config.REPEAT_PX * (width* Config.REPEAT_PX * idxMul) + x * Config.REPEAT_PX  * idxMul;
    return [red, red + 1, red + 2, red + 3];
  };
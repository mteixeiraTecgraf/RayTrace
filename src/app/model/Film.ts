import { vec2, vec3, vec4 } from "gl-matrix";
import * as GLMat from  "gl-matrix";
import { add2, createMat4, inverse, normalize, setPixel, sub2, toVec3, toVec4, verbose,  } from "./utils";

import { RANDOM_SAMPLE, REPEAT_PX, SAMPLE_COUNT } from "./config";

import { Ray } from "./Primitive";


export class Film{
    GetSampleCount()
    {
        return SAMPLE_COUNT;
    }
    GetRandom(){
        return RANDOM_SAMPLE? Math.random() : 0.5;
    }
    GetSample(i: number, j: number): vec2 {
        return [(i+this.GetRandom())/this.W, (j+this.GetRandom())/this.H];
    }
    public static Make(resolution: vec2, value:number, ctx?:CanvasRenderingContext2D)
    {
        return new Film(resolution, new Array(resolution[0]).fill([]).map(() => new Array(resolution[1]).fill([]).map(()=>[value,value,value])), ctx);
        //var a:vec2 = []
    }

    constructor(public Resolution:vec2, public Data:vec3[][], public Context?:CanvasRenderingContext2D ){}

    SetPixelValue(i_idx:number,j:number,value:vec3){
        const i2 = i_idx;
        //console.log(i, j, value);
        //console.log("Data", i_idx, j, this.Data)
        const v = 155 + (i_idx/this.W) * 100;
        this.Data[i_idx][j]=value;
        //console.log("Data", i_idx, j, this.Data[i2][j])
    }
    get H(){
        return this.Resolution[1];
    }
    get W(){
        return this.Resolution[0];
    }
    
    RenderImage(Context:CanvasRenderingContext2D){
        Context = Context ?? this.Context;
        if(Context){
            console.log("Data", this.Data)
            const myImageData = Context!.createImageData(this.W*REPEAT_PX, this.H*REPEAT_PX);
            this.Data.forEach((l,idx)=>{
                l.forEach((c,jdx)=>{
                    setPixel(myImageData, idx,jdx,this.W, this.H, c[0]*255, c[1]*255,c[2]*255,255 );
                })
            })
            //console.log("myImageData", myImageData)
            Context!.putImageData(myImageData,0,0);
        }
    }

    SaveImage(){

    }
}

export class Camera{
    toWorldMatric:GLMat.mat4 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    constructor(private _o:vec3, public u:vec3, public v: vec3, public w: vec3, private _angle:number, public distance:number, public ratio:number)
    {
        this.lookAt(u,v,w,_o);   
    }
    set angle(value:number)
    {
        this._angle = value;
    }
    get angle()
    {
        return this._angle;
    }
    set origin(value:vec3)
    {
        this._o = value;
        this.refresh();
    }
    get origin()
    {
        return this._o;
    }

    addToOrigin(dir:vec3)
    {
        this.origin = add2(this.origin, dir);
    }

    RotateDefault(rot:number, f:(out: vec3, a: vec3, b: vec3, rad: number)=> vec3)
    {
        this.u = f([0,0,0],this.u, [0,0,0], Math.PI*rot/180)
        this.v = f([0,0,0],this.v, [0,0,0], Math.PI*rot/180)
        this.w = f([0,0,0],this.w, [0,0,0], Math.PI*rot/180)

    }
    RotateOriginX(rot:number)
    {
        this._o = vec3.rotateX([0,0,0],this._o, [0,0,0], Math.PI*rot/180)
        this.refresh();
    }
    RotateOriginY(rot:number)
    {
        this._o = vec3.rotateY([0,0,0],this._o, [0,0,0], Math.PI*rot/180)
        this.refresh();
    }
    RotateOriginZ(rot:number)
    {
        this._o = vec3.rotateZ([0,0,0],this._o, [0,0,0], Math.PI*rot/180)
        this.refresh();
    }
    RotateX(rot:number)
    {
        this.RotateDefault(rot, vec3.rotateX);
        this.refresh();
    }
    RotateY(rot:number)
    {
        this.RotateDefault(rot, vec3.rotateY);
        this.refresh();
    }
    RotateZ(rot:number)
    {
        this.RotateDefault(rot, vec3.rotateZ);
        this.refresh();
    }
    refresh(){
        this.lookAt(this.u, this.v, this.w, this._o);
    }
    lookAt(u:vec3, v: vec3, w: vec3, o:vec3)
    {
        //this.toWorldMatric = inverse(GLMat.mat4.lookAt(GLMat.mat4.create(),o, sub2(o,w), v))
        
        //GLMat.mat4.fromRotationTranslation(GLMat.mat4.create(),)
        this.toWorldMatric = createMat4(u, v, w, o)
        
       console.log("LookAt", this.toWorldMatric,inverse(this.toWorldMatric),GLMat.mat4.create());
    }
    ToCameraPosition(v:GLMat.vec3){

        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(v), inverse(this.toWorldMatric)))
    }
    ToWorldPosition(v:GLMat.vec3):vec3{
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(v), this.toWorldMatric))

    }
    GenerateRay([nx,ny]: vec2): Ray {
        const degrees_to_radians = (deg:number) => (deg * Math.PI) / 180.0;
        var f = this.distance;
        var theta = degrees_to_radians(this.angle);
        var dv = f*Math.tan(theta/2);
        var du = dv*this.ratio;
        var p:vec3 = [-du + 2*du*nx, -dv + 2*dv*ny, -f];
        var o = this.ToWorldPosition([0,0,0]);
        if(verbose)console.log("Origin",o)
        var t = this.ToWorldPosition(p);
        if(verbose)console.log("point",t)
        return {origin:o,direction: normalize(sub2(t, o)), camera:true}
    }

}

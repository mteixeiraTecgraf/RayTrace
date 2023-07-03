import { vec2, vec3, vec4 } from "gl-matrix";
import * as GLMat from  "gl-matrix";
import { add2, createMat4, inverse, normalize, saveCanvasAs, setPixel, sub2, toVec3, toVec4, verbose,  } from "./utils";

import { CONFIG_NAME, RANDOM_SAMPLE, REPEAT_PX, SAMPLE_COUNT, SAVE_FILE } from "./config";

import { Ray, RayGenerator } from "./Primitive";
import { Sampler } from "./Sampler";


export class Film{
    _sampleCount:number = SAMPLE_COUNT;
    set sampleCount(v:number){
        this._sampleCount = v;
    }
    get sampleCount()
    {
        return this._sampleCount;
    }
    _currentCount:number=0;
    set currentCount(v:number){
        this._currentCount = v;
    }
    get currentCount()
    {
        return this._currentCount;
    }
    GetRandom(){
        return RANDOM_SAMPLE? Math.random() : 0.5;
    }
    GetSample(i: number, j: number): vec2 {
        return [(i+this.GetRandom())/this.W, (j+this.GetRandom())/this.H];
        //return [(((i)/this.W)*2)-1, ((j)/this.H)*2 - 1];
    }
    GetSampleOne(i: number, j: number): vec2 {
        //return [(i+this.GetRandom())/this.W, (j+this.GetRandom())/this.H];
        return [(((i)/this.W)*2)-1, ((j)/this.H)*2 - 1];
    }
    sampler = new Sampler()
    GetPixelRadial(i: number, j: number): vec2 {
        var [i2,j2] = this.sampler.getUnitaryHemisphere();
        //console.log([i2,j2], r, theta)
        return this.GetPixelOne((i2+1)/2,(j2+1)/2)
        //[Math.floor(((i2+1)/2) *this.W), Math.floor(((j2+1)/2)*this.H)];
    }
    GetPixelOne(i: number, j: number): vec2 {
        //return [(i+this.GetRandom())/this.W, (j+this.GetRandom())/this.H];
        return [Math.floor(i *this.W), Math.floor(j*this.H)];
    }
    public static Make(resolution: vec2, value:number, ctx:CanvasRenderingContext2D[])
    {
        var dataArray = new Array(ctx.length).fill([]).map(_=>new Array(resolution[0]).fill([]).map(() => new Array(resolution[1]).fill([]).map(()=><vec3>[value,value,value])))
        return new Film(resolution, dataArray, ctx);
        //var a:vec2 = []
    }
    get DataLength(){
        return this.Data.length;
    }
    constructor(public Resolution:vec2, public Data:vec3[][][], public Context:CanvasRenderingContext2D[] ){}

    GetPixelValue(i_idx:number,j:number,idx:number = 0){
        return this.Data[idx][i_idx][j]

    }
    SetPixelValue(i_idx:number,j:number,value:vec3, idx:number = 0){
        const i2 = i_idx;
        //console.log(i, j, value);
        //console.log("Data", i_idx, j, this.Data)
        const v = 155 + (i_idx/this.W) * 100;
        this.Data[idx][i_idx][j]=value;
        //console.log("Data", i_idx, j, this.Data[i2][j])
    }
    get H(){
        return this.Resolution[1];
    }
    get W(){
        return this.Resolution[0];
    }
    
    RenderImage(idx:number=-1){
        if(idx == -1)
        {
            let res = this.Context.map((_,i)=>i).map(index => Film.RenderImageInContextS(this.Context[index], this.Data[index], this));
            console.log("SampleCount", this, this.sampleCount)
            if(SAVE_FILE)this.Context.forEach((c,idx2)=>saveCanvasAs(c.canvas,`Canvas_${idx2}_${this.Resolution[0]}x${this.Resolution[1]}_${this.sampleCount}_${CONFIG_NAME}.png`))
            return res;
        }
        return Film.RenderImageInContextS(this.Context[idx], this.Data[idx], this);
    }
    RenderImageInContext(Context:CanvasRenderingContext2D|undefined){
        let idx = 0;
        Context = Context ?? this.Context[idx];
        return Film.RenderImageInContextS(Context, this.Data[idx], this);
    }
    static RenderImageInContextS(Context:CanvasRenderingContext2D|undefined, Data:vec3[][],res:{W:number, H:number}){
        if(Context){
            console.log("Data", Data)
            const myImageData = Context!.createImageData(res.W*REPEAT_PX, res.H*REPEAT_PX);
            Data.forEach((l,idx)=>{
                l.forEach((c,jdx)=>{
                    setPixel(myImageData, idx,jdx,res.W, res.H, c[0]*255, c[1]*255,c[2]*255,255 );
                })
            })
            //console.log("myImageData", myImageData)
            Context!.putImageData(myImageData,0,0);
        }
    }

    SaveImage(){

    }
}

export class Camera implements RayGenerator{
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
        console.log("Camera Set Origin", this);
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

        return {origin:o,direction: normalize(sub2(t, o)), camera:true, generator:this}
    }

}

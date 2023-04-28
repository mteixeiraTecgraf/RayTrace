import { vec2, vec3, vec4 } from "gl-matrix";
import * as GLMat from  "gl-matrix";
import { Area, Box, Shape, Sphere } from "./Shapes";
import { add2, add3, calculateHitCode, createMat4, cross, debugSample, distance, dot, getTranslation, identity, inverse, length, max, min, minus, mul, mulMat, normalize, reflect, sampleBetween, sampleBetween2, scaleMat, setPixel, setVerbose, sub2, toVec3, toVec4, transpose, verbose, verbose2, verbose3 } from "./utils";
import * as utils from "./utils";
import { DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, DEFAULT_AREA_SAMPLE_COUNT, FORCCE_HIT, FORCCE_HIT_MAT_CODE, FORCCE_HIT_OCL_MAT_CODE, FORCCE_HIT_ON_VERTEX, LIGHT_FACTOR, LIMITS, PONTUAL_LIGHT_RADIUS, RANDOM_SAMPLE, REPEAT_PX, SAMPLE_COUNT, TEST_BRUTE_FORCE, TRACE_RAY_RECURSION_MAX } from "./config";
import { Material, PhongMaterial } from "./Material";
import { mat4 } from "gl-matrix";

export type ProgressAction = (i:number,total:number)=>void
var DEFAULTPROGRESS: ProgressAction = ()=>{}
export const EPSILON = Math.pow(10,-5);

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
        return add2(this.origin, dir);
    }

    RotateDefault(rot:number, f:(out: vec3, a: vec3, b: vec3, rad: number)=> vec3)
    {
        this.u = f([0,0,0],this.u, [0,0,0], Math.PI*rot/180)
        this.v = f([0,0,0],this.v, [0,0,0], Math.PI*rot/180)
        this.w = f([0,0,0],this.w, [0,0,0], Math.PI*rot/180)

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
export abstract class Light{
    public Intensidade: vec3 = [1,1,1];
    public Potencia: vec3 = [1,1,1];
    abstract Radiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; hitCode?:number } 
}
export class PontualLight implements Light{
    type:"PontualLight";
    Radiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; hitCode?:number} {

        var rayo = p; 
        var rayd = sub2(this.Position,p);
        
        var ray = createRay(p, rayd, {addEps:true,normalizeDirection:true})

        //if(v2 || verbose2)console.log("Computing intersection with same light", p, ray);
        var hit2 = scene.ComputeIntersection(ray);

        var hitCode = -1;
        if(FORCCE_HIT_OCL_MAT_CODE && hit2 && hit2.instanceRef>0   )
        {
            hitCode = hit2.instanceRef;
           //return <vec3>[1,0,1]
           //return [(hit2.instanceRef/4)%2,(hit2.instanceRef/2)%2,hit2.instanceRef%2]

        }
        //if(v2 || verbose2) console.log("Hit2", ray, hit2, hit.light, sub2(ls.Position,hit.p))
        if(hit2?.light != this
        /*&& (hit2?.material != this)*/
        )
        {
            //if(v2 || verbose3) console.log("Hit2 Found", hit, ray, hit2, hit.light, ls)
            return {li:vec3.create(), l:vec3.create(), hitCode};
        }

        

        var l = normalize(sub2(this.Position, p))
        var r = distance(p,this.Position);
        var Li = utils.scale(this.Potencia,1/(r*r*LIGHT_FACTOR))
        
        //console.log("Radiance", this.Potencia, l, r,Li, r, 1/(r*r*0.5));
        return {li:Li, l:l, hitCode}
    }
    Potencia:vec3;
    constructor(public Position: vec3 = [0,0,0], public Intensidade: vec3 = [1,1,1]){
        this.Potencia = utils.scale(this.Intensidade, 2*Math.PI)
    }

}
export class AreaLight implements Light{
    type:"AreaLight";
    Potencia:vec3;
    _SAMPLE_COUNT = DEFAULT_AREA_SAMPLE_COUNT;
    sqr_SAMPLE_COUNT = Math.sqrt(this.SAMPLE_COUNT);
    get SAMPLE_COUNT(){
        return this._SAMPLE_COUNT;
    }
    set SAMPLE_COUNT(value){
        this._SAMPLE_COUNT = value;
        this.sqr_SAMPLE_COUNT = Math.sqrt(this.SAMPLE_COUNT);
        this.AreaPart = this.Area/this.SAMPLE_COUNT;
    }
    Radiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; } {
        const res = {li:vec3.create(),l:vec3.create()};
        for(var i = 0; i< this.SAMPLE_COUNT; ++i)
        {

            var {li,l} = this.SampleRadiance(scene, p, n,i);
            res.li = add2(res.li,li);
            res.l = add2(res.l,l);
        } 
        //console.log("radiance", res)
        return res;
    }
    SampleRadiance(scene: Scene, p: vec3, n: vec3, i:number): { li: vec3; l: vec3; } {
        var ni = Math.ceil(i/this.sqr_SAMPLE_COUNT);
        var nj = (i % this.sqr_SAMPLE_COUNT);
        var {pos, normal:ns} = this.getSample(ni, nj)

        var rayo = p; 
        var l = utils.scale(normalize(sub2(pos,p)),1/this.SAMPLE_COUNT); 
        var ray = createRay(rayo, l, {addEps:true});

        //if(v2 || verbose2)console.log("Computing intersection with same light", p, ray);
        var hit = scene.ComputeIntersection(ray);
        //if(v2 || verbose2) console.log("Hit2", hit)
        //console.log("Radiance", ray);
        //console.log("Radiance", ray, hit);
        if(hit?.light == this
        /*&& (hit2?.material != this)*/
        )
        {
            var r = distance(p,pos);
            //console.log("distance", r)
            var Li = utils.scale(this.Potencia,(dot(minus(l),ns)/(r*r*LIGHT_FACTOR))*this.AreaPart)
            //console.log("distance", l, ns, dot(minus(l),ns), this.AreaPart, Li, this.Area)
            
            //console.log("Radiance", r,Li);
            return {li:Li, l:l}
        }
        //if(v2 || verbose3) console.log("Hit2 Found", hit, ray, hit2, hit.light, ls)
        return {li:vec3.create(), l:vec3.create()};
    }
    random = Math.random
    getSample(ni:number,nj: number){
        return {
            pos:add3(
                this.Position,
                utils.scale(this.ArestaI,(ni+this.random())/this.sqr_SAMPLE_COUNT), 
                utils.scale(this.Arestaj,(nj+this.random())/this.sqr_SAMPLE_COUNT)
            ),
            normal: this.Normal,
        };
    }
    constructor(public Position: vec3 = [0,0,0], public ArestaI:vec3 = [1,0,0],public Arestaj:vec3 = [0, 1, 0], public Intensidade: vec3 = [1,1,1]){}

    Cross = cross(this.ArestaI,this.Arestaj);
    Area=  length(this.Cross);
    Normal = normalize(this.Cross);
    AreaPart = this.Area/this.SAMPLE_COUNT;

}

export function createRay(origin:vec3, direction:vec3, options:{addEps?:boolean, normalizeDirection?:boolean}={} ){
    var rayo = origin
    var rayd = direction
    if(options.addEps)
        rayo = add2(rayo, utils.scale(rayd, EPSILON))
    if(options.normalizeDirection)
        rayd = normalize(rayd);
    var ray:Ray = {origin:rayo, direction:rayd, camera:false};
    return ray;
}

export type Ray = {origin:vec3, direction:vec3, camera:boolean};
function getT(ray:Ray, point: vec3)
{
    return dot(sub2(point, ray.origin), ray.direction);
}
export type Hit = {
    n:vec3;
    t: number;
    light?: Light;
    material?: Material;
    backface:boolean;
    forceOnVertex:boolean;
    instanceRef:number;
    p:vec3,
    uv:vec2,
};
export class Scene{
    ReportComputations() {
        console.log("Shape Count  ", this.instances.length)
        //console.log("Instances  ", this.instances)
        for(var i of this.instances)
        {
            console.log("Computation Shape  ", i.shape.computationCount)
        }
    }

    constructor(private Film:Film, public camera:Camera, public ambientLight:vec3){}
    get W(){return this.Film.W}
    get H(){return this.Film.H}
    sample:vec2 = [0,0,]
    get Sample(){
        return this.sample;
    }
    prepareScene(){
        this.tester.generateStructure();
    }
    Render(Context:CanvasRenderingContext2D, progress:ProgressAction = DEFAULTPROGRESS){
        const film = this.Film
        const count = film.GetSampleCount();
        //return;
        for(let i = 0; i<this.W;i++ )
        {
            progress(i,this.W);
            
            for(let j = 0; j<this.H;j++ )
            {
                var c:vec3 = [0,0,0]
                for(let s = 0; s<count; s++)
                {
                    //1
                    var sample:vec2 = film.GetSample(i,j);
                    
                    this.sample = sample;
                    
                    //2
                    var ray:Ray = this.camera.GenerateRay(sample);
                    (<any>ray)['sample']=sample;
                    if(verbose2) console.log("Ray",i,j, ray)
                    
                    //3
                    c = add2(c,this.TraceRay(ray));
                    if(verbose2) console.log("Pixel", i,j,c)
                }
                film.SetPixelValue(i,j,utils.scale(c, 1/count));
                
            }
        }
        progress(this.W,this.W);
        this.Film.RenderImage(Context);
        
    }
    recursionCount = 0;
    TraceRay(ray: Ray): vec3 {
        if(this.recursionCount>=TRACE_RAY_RECURSION_MAX)return [0,0,0];
        this.recursionCount++;
        
        setVerbose(debugSample(this));
        let c = this._TraceRay(ray);
        
        setVerbose(false);
        this.recursionCount--;
        return c;
    }
    _TraceRay(ray: Ray): vec3 {
        //setVerbose(debugSample(this));
        var hit = this.ComputeIntersection(ray);
        
        //setVerbose(false);
        if (hit)
        {
            if(DEBUG_TRACE_POINT && distance(hit?.p??[0,0,0], DEBUG_TRACE_POINT_COORDS)<0.04)
            {
                console.log("Hit trace", ray, hit);
                return [0,0,1]
                //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
            }
            //console.log("Hit Some", hit);
            if(hit.light)
            {
                if(FORCCE_HIT_MAT_CODE&& hit.instanceRef>0)
                {
                    return <vec3>[0,1,1]
                    //return [(hit.instanceRef/4)%2,(hit.instanceRef/2)%2,hit.instanceRef%2]
                }
                var c:vec3 = [0,0,0];
                var r:number = hit.t;
                c = add2(this.ambientLight, utils.scale(hit.light.Potencia,1/r*r));
                //c = hit.light.Potencia;
                //c = scale(c,255)
                
                return  c;
            }
            else if(hit.material)
            {
                if(hit.uv){
                    //return min([1,1,1],add2(scale([1,0,0],hit.uv[0]), scale([0,1,0],hit.uv[1])));
                }

                if(FORCCE_HIT) return <vec3>[1,0,0];
                if(FORCCE_HIT_ON_VERTEX  && hit.forceOnVertex) return <vec3>[1,0,0];
                if(FORCCE_HIT_MAT_CODE&& hit.instanceRef>0)
                {
                    //return <vec3>[0,0,1]
                    return calculateHitCode(hit.instanceRef)
                }
                
                if(verbose3)console.log("Hit Material", hit);
                var c = hit.material.Eval(this, hit, ray.origin);
                if(verbose3)console.log("@MARK2::Evaluated to ", c);
                
                if(debugSample(this))
                {
                    console.log("Trace", ray, hit)
                    return [0,0,1];
                }

                if(true && sampleBetween(ray, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3]))
                    return [0,1,0];
                //console.log("Hit Some ", c, hit);
                return c;
            }

        }
        
        if(false && sampleBetween(ray, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3]))
        return [0,0,1];
        
        //console.log("Hit None");
        return [0,0,0];
            //return this.temp(ray);
    }
    AddAreaLight(light:AreaLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = 1;
        const position =light.Position;
        //const position:vec3 = [0,2,1]
        //var transform = Transform.fromVec(position,light.ArestaI,light.Arestaj);
        var transform = new Transform;
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity({name:"Luz de Area",light, shape:new Area(light.Position, light.ArestaI, light.Arestaj), transform});
    }

    AddPonctualLight(light:PontualLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = PONTUAL_LIGHT_RADIUS;
        const position =light.Position;
        //const position:vec3 = [0,2,1]
        var transform = Transform.fromScaleAndTranslation(position,scale,scale,scale);
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity({name:"Luz Pontual",light, shape:new Sphere(), transform});
        

    }
    //lightSources:Light[]=[    ]
    materials:Material[] = [
        new PhongMaterial([1,0,0]), 
        new PhongMaterial([0,1,0]),
        new PhongMaterial([0,0, 1]),
        new PhongMaterial([1,1,1]),
    ]
    
    tester = new IntersectionTester()
    AddEntity(arg0: Instance) {
        //this.obj.push(arg0);
        //console.log("AreaAddEntity", arg0)
        this.instances.push(arg0)
        this.tester.Add(arg0);

        return;
        var boxAdj = arg0.shape.BondingBox().Borders().map(arg0.transform.toGlobal,arg0.transform);
        var vmax = max(...boxAdj);
        var vmin = min(...boxAdj);
        var node:AccNode = {instance:arg0, box: 
            new Box(vmin,vmax)
            //arg0.shape.BondingBox()
        };
        if(!this.root.instance)
        {
            this.root = node;
        }
        else
        {
            node.child2 = this.root;
            this.root = node
            var bmin = this.root.child2!.box!.bMin;
            var bmin = min(this.root.box!.bMin, this.root.child2!.box!.bMin);;
            var bmax = max(this.root.box!.bMax, this.root.child2!.box!.bMax);
            this.root.box = new Box(bmin, bmax)
            console.log("Box", this.root.box)

        }
    }
    root:AccNode = {}
    instances:Instance[] =[]
    get lights():Instance[]{
        return this.instances.filter(i=>Boolean(i.light)==true)
    }
    
    //obj:{material:Material,shape:Shape}[] =[]
    ComputeIntersection(ray: Ray):Hit|undefined {
        if(verbose)console.log("MARK2::Compute Intersections in Scene and ray", ray);
        const v2 = sampleBetween2(this.Sample, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3]);
        var t = Infinity;
        var p:vec3 = [0,0,0];
        var n:vec3 = [0,0,0];
        var backface=false;
        var material:Material = new PhongMaterial([0,0,0]);
        var bestHit:Hit|undefined = undefined; 

        /*
        var hit = this.root.box?.ComputeIntersection(ray);
        if(this.root.box && !hit)
        {
            return ;
        }
        */
       var bestHit = this.tester.Test(ray);
        //this.tester.Test()
        if(verbose3)console.log("MARK2::Hit Object Final", bestHit);
        return bestHit;
    }
    temp(ray: Ray): vec3
    {
        
        var i = ray.origin[0]*this.W;
        var j = ray.origin[1]*this.H;
        if (i < (this.W / 2))
        {
        
            if (j < (this.H / 2))
            {
            //console.log("Teste", i);
                return [255,0,0];
        
            }
            else return [0,255,0];    
        }

        else
        {
            if (j < (this.H / 2))
                return [0,0, 255]      
            else return [255,255,255];     
        }
    }
    testCameraPixels(){
        
        for(var i=0;i<this.W;++i)
            for(var  j=0;j<this.H;++j)
            console.log("Pixel", i, j, this.camera.GenerateRay([i/this.W,j/this.H]))
    
    }
}
type Instance = {name:string, material?:Material, light?:Light,shape:Shape, transform:Transform};
type AccNode = {box?:Box, child1?:AccNode, child2?:AccNode, instance?:Instance}
type MatrixPipeAction = (mat:mat4)=>mat4;

export function translate(vec:vec3):MatrixPipeAction{
    return function(mat:mat4){
        return utils.translate(mat, vec);
    }
}
export function scale(vec:vec3):MatrixPipeAction{
    return function(mat:mat4){
        return scaleMat(mat, vec);
    }
}
export function rotate(n:number, axis:"x"|"y"|"z"):MatrixPipeAction{
    return function(mat:mat4){
        return utils.rotate(mat, n, axis);
    }
}
export class Transform{
    toLocal(origin: vec3) {
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(origin), this.inverse))
    }
    toGlobal(origin: vec3) {
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(origin), this.matrix))
    }
    toGlobalT(origin: vec3) {
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(origin), transpose(this.inverse)))
    }
    toLocalRay(ray:Ray):Ray
    {
        return {...ray, origin:this.toLocal(ray.origin), direction:(sub2(this.toLocal(ray.direction),getTranslation(this.inverse)))}
        //return {...ray, origin:this.toLocal(ray.origin)}
    }
    toGlobalRay(ray:Ray):Ray
    {
        return {...ray, origin:this.toGlobal(ray.origin)}
        //return {origin:this.toGlobal(ray.origin), direction:this.toGlobal(ray.direction)}
    }
    
    toGlobalHit(hit:Hit|undefined):Hit|undefined
    {
        if(hit)
        {

            return <Hit>{
                ... hit,
                p:this.toGlobal(hit.p),
                n:this.toGlobalT(hit.n),
                //n:normalize(hit.n),
                
            }
        }
        return undefined;
    }
    public inverse:GLMat.mat4
    constructor(public matrix:GLMat.mat4 = GLMat.mat4.create())
    {
        this.inverse = inverse(matrix);
        
        console.log("MAtrix", matrix, this.inverse)
    }
    static fromPipe(...actions:MatrixPipeAction[]):Transform
    {
        var mat = actions.reverse().reduce((old:mat4, v:MatrixPipeAction)=>v(old), identity());
        return new Transform(mat);
    }
    static scale = scale;
    static rotate = rotate;
    static translate = translate;
    static fromScaleAndTranslation(translation:vec3=[0,0,0], sx:number=1,sy:number=1,sz:number=1)
    {
        var scale = createMat4([sx,0,0], [0, sy,0], [0,0,sz], [0,0,0])
        var transl = createMat4([1,0,0], [0, 1,0], [0,0,1], translation)
        var mat = mulMat(transl,scale)
        return new Transform(mat);
    }
    static fromVec(translation:vec3=[0,0,0], v1:vec3, v2:vec3)
    {
        var v3 = cross(v1,v2);
        var mat = createMat4(v1, v2, v3, translation)
        //var transl = createMat4([1,0,0], [0, 1,0], [0,0,1], translation)
        //var mat = mulMat(transl,scale)
        return new Transform(mat);
    }

}

export class IntersectionTester{
    
    instances :Instance[] = [];
    Add(instance:Instance)
    {
        this.instances.push(instance);
        return;
        
        var boxAdj = instance.shape.BondingBox().Borders().map(instance.transform.toGlobal,instance.transform);
        var vmax = max(...boxAdj);
        var vmin = min(...boxAdj);
        var node:AccNode = {instance:instance, box: 
            new Box(vmin,vmax)
            //arg0.shape.BondingBox()
        };
        if(!this.root.instance)
        {
            this.root = node;
        }
        else
        {
            node.child2 = this.root;
            this.root = node
            var bmin = this.root.child2!.box!.bMin;
            var bmin = min(this.root.box!.bMin, this.root.child2!.box!.bMin);;
            var bmax = max(this.root.box!.bMax, this.root.child2!.box!.bMax);
            this.root.box = new Box(bmin, bmax)
            console.log("Box", this.root.box)

        }
    }
    generateStructure(progress:ProgressAction = DEFAULTPROGRESS){
        var centroids = this.instances.map(i=>i.transform.toGlobal(i.shape.BondingBox().Centroid()));
        var bmax = max(...centroids);
        var bmin = min(...centroids);
        var bbox = new Box(bmin, bmax);

        var res = this.divideInstances(this.instances, 0,this.instances.length, progress)
        if(res) this.root = res;
        console.log("Structure", this.root)

    }
    getBoundingBox(instance:Instance)
    {
        var bbox = instance.shape.BondingBox();

        var globalsborders = bbox.Borders().map(instance.transform.toGlobal, instance.transform);
        var newBBox =  new Box(min(...globalsborders), max(...globalsborders));
        //console.log("BoundBox Transf", instance, globalsborders, newBBox);
        return newBBox;
    }
    divideInstances(instances:Instance[], init: number = 0, end: number = 0, progress:ProgressAction = DEFAULTPROGRESS):AccNode|undefined{
        
        if(instances.length==0){
            return;
        }
        if(instances.length==1){
            return {box: this.getBoundingBox(instances[0]), instance: instances[0],};
        }

        //progress(end+init/2)
        var centroids = instances.map(i=>i.transform.toGlobal(i.shape.BondingBox().Centroid()));
        var bmax = max(...centroids);
        var bmin = min(...centroids);
        var bbox = new Box(bmin, bmax);
        
        var best = 0;
        var dx = bmax[0] - bmin[0]
        var dbest = dx;
        var dy = bmax[1] - bmin[1]
        if(dy>dbest)
        {
            best = 1;
            dbest = dy
        }
        var dz = bmax[2] - bmin[2]
        if(dz>dbest)
        {
            best = 2;
            dbest = dz
        }
        var sorted = instances.sort(sortBy);
        var half = Math.ceil(instances.length/2);
        var h1 = sorted.slice(0,half);
        var h2 = sorted.slice(half);

        //progress(end,end);
        //console.log("Init", init,end)
        //progress(0,end);
        progress(0,100);
        var n1 = this.divideInstances(h1, init, (init+end)/2, (i,n)=>progress((i*50/n),100));
        //progress(end,end);
        //console.log("Init mid", init,end)
        //progress((init+end)/2,end);
        progress(50,100);
        var n2 = this.divideInstances(h2, (init+end)/2, end, (i,n)=>progress(50+(i*50/n),100));
        
        //console.log("Init end", init,end)
        //progress(end,end);
        progress(100,100);

        
        //console.log("BoundBox Transf Join", n1, n2);
        
        return {box: new Box(
            min(n1!.box!.bMin, n2!.box!.bMin), 
            max(n1!.box!.bMax, n2!.box!.bMax), 
            ), 
            child1:n1, child2:n2};

        function sortBy(ia:Instance,ib:Instance){
            var v1 = (ia.shape.BondingBox().Centroid()[best]);
            var v2 = (ib.shape.BondingBox().Centroid()[best]);
            return v1-v2
        }
    }
    root:AccNode = {}
    Test(ray:Ray){

        if(TEST_BRUTE_FORCE) return this.TestForce(ray);
        /*
        var hit = this.root.box?.ComputeIntersection(ray);
        if(this.root.box && !hit)
        {
            //Not Hit
            return ;
        }
        */
        return this.TestNode(ray, this.root)
        
    }
    TestNode(ray:Ray, node?:AccNode, v = 0):Hit|undefined
    {        
        if(!node) return;
        
        if(verbose) console.log("MARK2::Computing Box intersections", ray, node);
        var hit = node.box?.ComputeIntersection(ray);
        
            

        if(this.root.box && !hit)
        {
            //Not Hit
            return ;
        }

        //console.log("Hit some 1")

        if((!node.child1) && (!node.child2))
        {
            if(!node.instance) {
                console.warn("No Child nor instance", node);
                return;
            }

            if(verbose) console.log("Computing intersections", ray, node);
            var tRay = node.instance!.transform.toLocalRay(ray);
            var tHit = node.instance!.shape.ComputeIntersection(tRay);
            //console.log("ComputeIntersection", thit);
            var hit = node.instance!.transform.toGlobalHit(tHit);
            if(hit) {
                if(verbose) console.log("MARK2::Computing Hit", ray, node, tRay, tHit, hit);
                hit.material = node.instance.material;
                hit.light = node.instance.light;
                hit.instanceRef = v;
                //if(node.instance.light) console.log("Node Light", ray, hit);
                //console.log("Hit some")
            }
            else{
                //console.log("Hit None", node.instance)
            }
            return hit;
        }

        var testRight = this.TestNode(ray, node.child1,v*2);
        var testLeft = this.TestNode(ray, node.child2,(v*2)+1);

        //testLeft = <Hit>{...testLeft, instanceRef:v};
        //testRight = <Hit>{...testRight, instanceRef:v};
        return this.CompareHits(this.SafeHit(testRight), this.SafeHit(testLeft));

    }

    TestForce(ray:Ray, v2:boolean =false){
        
        var bestHit:Hit|undefined = undefined; 
        this.instances.forEach(obj => {
            
            if(verbose) console.log("Computing intersections", ray, obj);
            var tRay = obj.transform.toLocalRay(ray);
            var thit = obj.shape.ComputeIntersection(tRay);
            //console.log("ComputeIntersection", thit);
            var hit = obj.transform.toGlobalHit(thit);
            
            if(hit) hit.t = getT(ray, hit!.p);
            if(v2)
                console.log("ComputeIntersection",ray, tRay, thit, hit, bestHit)
            if(verbose)console.log("Hit Object", hit, obj);

            
            //if(distance(hit?.p??[0,0,0], [2,1.5,2.9])<0.2)
            if(distance(hit?.p??[0,0,0], [2,1.5,2.9])<0.2)
            {
                //console.log("Hit", n, hit?.p, l,ml, distance(hit.p, [3,1.5,2.9]));
                //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
            }
            if(hit && !hit.backface &&(hit?.t > EPSILON) && (hit.t < (bestHit?.t??Infinity)))
            {
                hit.material = obj.material;
                hit.light = obj.light;
            
                bestHit = hit;
                if(verbose3)
                if(!ray.camera)
                    console.log("Hit Object", bestHit, obj);
                //console.log("Hit", bestHit);

            }
            
        });
        return bestHit;
    }

    CompareHits(h1?:Hit, h2?:Hit){
        if(DEBUG_TRACE_POINT && distance(h2?.p??[0,0,0], DEBUG_TRACE_POINT_COORDS)<0.04)
        {
            console.log("Hit CompareHits", h1, h2);
            //return [0,0,1]
            //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
        }
        if(!h1 && !h2) return;
        if(!h1) return h2;
        if(!h2) return h1;
        if(!h1.backface &&(h1.t > EPSILON) && (h1.t < (h2.t??Infinity)))
        {
            //console.log("Compare Hit 1")
            return h1;
        }
        return h2;
    }
    SafeHit(hit:Hit|undefined)
    {
        if(!hit || hit.t < EPSILON) return;
        return hit;
    }
}
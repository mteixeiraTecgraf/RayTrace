import { vec2, vec3, vec4 } from "gl-matrix";
import * as GLMat from  "gl-matrix";
import { Area, Box, Shape, Sphere } from "./Shapes";
import { add2, add3, createMat4, cross, distance, dot, getTranslation, inverse, length, max, min, minus, mul, mulMat, normalize, reflect, sampleBetween, sampleBetween2, scale, sub2, toVec3, toVec4, transpose, verbose, verbose2 } from "./utils";
import { DEBUG_TRACE_POINT, DEFAULT_AREA_SAMPLE_COUNT, FORCCE_HIT, LIGHT_FACTOR, LIMITS, SAMPLE_COUNT, TRACE_RAY_RECURSION_MAX, verbose3 } from "./config";
import { Material, PhongMaterial } from "./Material";


export const EPSILON = Math.pow(10,-5);

const setPixel = (myImageData:any, x:number, y:number, width:number, height:number, r:number, g:number, b:number, a:number = 255) => {

    const colorIndices = getColorIndicesForCoord(x, height-(y+1), width);
    const [redIndex, greenIndex, blueIndex, alphaIndex] = colorIndices;
    //film->SetPixelValue(i, j, glm::vec3(1.0f, 0.0f, 0.0f));
    myImageData.data[redIndex] = r;
    myImageData.data[greenIndex] = g;
    myImageData.data[blueIndex] = b;
    myImageData.data[alphaIndex] = a;
  }
  
  const getColorIndicesForCoord = (x:number, y:number, width:number) => {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
  };
export class Film{
    GetSampleCount()
    {
        return SAMPLE_COUNT;
    }
    GetRandom(){
        return Math.random();
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
        return this.Resolution[1]
    }
    get W(){
        return this.Resolution[0];
    }
    
    RenderImage(Context:CanvasRenderingContext2D){
        Context = Context ?? this.Context;
        if(Context){
            console.log("Data", this.Data)
            const myImageData = Context!.createImageData(this.W, this.H);
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
    constructor(public o:vec3, public u:vec3, public v: vec3, public w: vec3, public angle:number, public distance:number, public ratio:number)
    {
        this.lookAt(u,v,w,o);   
    }

    RotateX(rot:number)
    {
        this.u = vec3.rotateX([0,0,0],this.u, [0,0,0], Math.PI*rot/180)
        this.v = vec3.rotateX([0,0,0],this.v, [0,0,0], Math.PI*rot/180)
        this.w = vec3.rotateX([0,0,0],this.w, [0,0,0], Math.PI*rot/180)

        this.lookAt(this.u, this.v, this.w, this.o);
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
    abstract Radiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; } 
}
export class PontualLight implements Light{
    type:"PontualLight";
    Radiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; } {

        var rayo = p; 
        var rayd = sub2(this.Position,p);
        
        var ray = createRay(p, rayd, {addEps:true,normalizeDirection:true})

        //if(v2 || verbose2)console.log("Computing intersection with same light", p, ray);
        var hit2 = scene.ComputeIntersection(ray);
        //if(v2 || verbose2) console.log("Hit2", ray, hit2, hit.light, sub2(ls.Position,hit.p))
        if(hit2?.light != this
        /*&& (hit2?.material != this)*/
        )
        {
            //if(v2 || verbose3) console.log("Hit2 Found", hit, ray, hit2, hit.light, ls)
            return {li:vec3.create(), l:vec3.create()};
        }

        

        var l = normalize(sub2(this.Position, p))
        var r = distance(p,this.Position);
        var Li = scale(this.Potencia,1/(r*r*LIGHT_FACTOR))
        
        //console.log("Radiance", this.Potencia, l, r,Li, r, 1/(r*r*0.5));
        return {li:Li, l:l}
    }
    Potencia:vec3;
    constructor(public Position: vec3 = [0,0,0], public Intensidade: vec3 = [1,1,1]){
        this.Potencia = scale(this.Intensidade, 2*Math.PI)
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
        var l = scale(normalize(sub2(pos,p)),1/this.SAMPLE_COUNT); 
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
            var Li = scale(this.Potencia,(dot(minus(l),ns)/(r*r*LIGHT_FACTOR))*this.AreaPart)
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
                scale(this.ArestaI,(ni+this.random())/this.sqr_SAMPLE_COUNT), 
                scale(this.Arestaj,(nj+this.random())/this.sqr_SAMPLE_COUNT)
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
        rayo = add2(rayo, scale(rayd, EPSILON))
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
    p:vec3
};
export class Scene{

    constructor(private Film:Film, public camera:Camera, public ambientLight:vec3){}
    get W(){return this.Film.W}
    get H(){return this.Film.H}
    sample:vec2 = [0,0,]
    get Sample(){
        return this.sample;
    }
    Render(Context:CanvasRenderingContext2D){
        const film = this.Film
        const count = film.GetSampleCount();
        for(let i = 0; i<this.W;i++ )
        {
        
            console.log("Pixel", i)
            for(let j = 0; j<this.H;j++ )
            {
                var c:vec3 = [0,0,0]
                for(let s = 0; s<count; s++)
                {
                    
                    var sample:vec2 = film.GetSample(i,j);
                    this.sample = sample;
                    var ray:Ray = this.camera.GenerateRay(sample);
                    (<any>ray)['sample']=sample;
                    if(verbose2) console.log("Ray",i,j, ray)
                    c = add2(c,this.TraceRay(ray));
                    if(verbose2) console.log("Pixel", i,j,c)
                }
                film.SetPixelValue(i,j,scale(c, 1/count));
                
            }
        }
        this.Film.RenderImage(Context);
    }
    recursionCount = 0;
    TraceRay(ray: Ray): vec3 {
        if(this.recursionCount>=TRACE_RAY_RECURSION_MAX)return [0,0,0];
        this.recursionCount++;
        let c = this._TraceRay(ray);
        this.recursionCount--;
        return c;
    }
    _TraceRay(ray: Ray): vec3 {
        var hit = this.ComputeIntersection(ray);
        if (hit)
        {
            //console.log("Hit Some");
            if(hit.light)
            {
                var c:vec3 = [0,0,0];
                var r:number = hit.t;
                c = add2(this.ambientLight, scale(hit.light.Potencia,1/r*r));
                //c = hit.light.Potencia;
                //c = scale(c,255)
                
                return  c;
            }
            else if(hit.material)
            {
                if(DEBUG_TRACE_POINT && distance(ray?.origin??[0,0,0], [2,1.1,1.1])<0.08)
                {
                    console.log("Hit trace", ray, hit);
                    return [0,0,1]
                    //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
                }

                if(FORCCE_HIT) return <vec3>[1,0,0];
                
                if(verbose3)console.log("Hit Material", hit);
                var c = hit.material.Eval(this, hit, ray.origin);
                
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
        this.AddEntity({light, shape:new Area(light.Position, light.ArestaI, light.Arestaj), transform});
    }

    AddPonctualLight(light:PontualLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = 0.1;
        const position =light.Position;
        //const position:vec3 = [0,2,1]
        var transform = Transform.fromScaleAndTranslation(position,scale,scale,scale);
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity({light, shape:new Sphere(), transform});
        

    }
    //lightSources:Light[]=[    ]
    materials:Material[] = [
        new PhongMaterial([1,0,0]), 
        new PhongMaterial([0,1,0]),
        new PhongMaterial([0,0, 1]),
        new PhongMaterial([1,1,1]),
    ]
    
    AddEntity(arg0: Instance) {
        //this.obj.push(arg0);
        console.log("AreaAddEntity", arg0)
        this.instances.push(arg0)

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
    
    //obj:{material:Material,shape:Shape}[] =[]
    ComputeIntersection(ray: Ray):Hit|undefined {
        const v2 = sampleBetween2(this.Sample, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3]);
        var t = Infinity;
        var p:vec3 = [0,0,0];
        var n:vec3 = [0,0,0];
        var backface=false;
        var material:Material = new PhongMaterial([0,0,0]);
        var bestHit:Hit|undefined = undefined; 

        var hit = this.root.box?.ComputeIntersection(ray);
        if(!hit)
        {
            return ;
        }
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
        if(verbose3)console.log("Hit Object Final", bestHit);
        return bestHit;

        //var c = 
        var i = ray.origin[0]*this.W;
        var j = ray.origin[1]*this.H;
        
        var resMat = 0;
        if (i < (this.W / 2))
        {
            
            if (j < (this.H / 2))
            {
            //console.log("Teste", i);
                resMat = 0;
        
            }
            else resMat = 1; 
        }
        else{
           
            if (j < (this.H / 2))
                resMat = 2;   
            else 
                resMat = 3;  
        }
        //return {material:this.materials[resMat], p:[0,0,0], t:10, n:[0,0,0]}
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
type Instance = {material?:Material, light?:Light,shape:Shape, transform:Transform};
type AccNode = {box?:Box, child1?:AccNode, child2?:AccNode, instance?:Instance}

export class Transform{
    toLocal(origin: vec3) {
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(origin), this.inverse))
    }
    toGlobal(origin: vec3) {
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(origin), this.matrix))
    }
    toGlobalT(origin: vec3) {
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(origin), transpose(this.matrix)))
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
import { vec3 } from "gl-matrix";
import { Scene } from "./Scene";
import { distance, normalize, add2, add3, sub2, dot, minus, cross, length } from "./utils";
import * as utils from "./utils";
import { DEFAULT_AREA_SAMPLE_COUNT, FORCCE_HIT_OCL_MAT_CODE, LIGHT_FACTOR } from "./config";
import { Hit, createRay } from "./Primitive";
import { Sample } from "./Sampler";

export type LightInstanceSample = {light: Light,pdf:number}
export type LightPointSample = {s:vec3,ns:vec3,pdf:number}
export interface LightSample extends Sample { light: LightInstanceSample,  point:LightPointSample }
export abstract class Light{
    public Intensidade: vec3 = [1,1,1];
    public Potencia: vec3 = [1,1,1];
    abstract get SAMPLE_COUNT():number;
    abstract getSamplePoint(p: vec3):LightPointSample;
    Radiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; hitCode?:number } {
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
    abstract SampleRadiance(scene: Scene, p: vec3, n: vec3, i:number): { li: vec3; l: vec3; }
    
    protected reprocessRefraction(scene: Scene, l:vec3,hit2?:Hit,){
        var I = vec3.fromValues(1,1,10)
        while(hit2?.material?.IsTransparent())
        {
            //console.log("ReprocessRefraction", hit2)
            if(hit2.backface){
                //I = I
                //TODO ver melhor esta parte
            }
            let ray = createRay(hit2.p, l)
            var hitA = scene.ComputeIntersection(ray);
            hit2 = hitA ? hitA[0] : undefined;
            //console.log("ReprocessRefraction out", hit2)
        }
        return {hit:hit2, I};
    }
}
export class PontualLight extends Light{
    type:"PontualLight";
    get SAMPLE_COUNT(){
        return 1;
    }
    
    getSamplePoint(p: vec3):LightPointSample {
        return { s: this.Position, ns: sub2(p, this.Position), pdf: 1 };
    }
    SampleRadiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; hitCode?:number} {

        var rayo = p; 
        var rayd = sub2(this.Position,p);
        
        var ray = createRay(p, rayd, {addEps:true,normalizeDirection:true})

        //if(v2 || verbose2)console.log("Computing intersection with same light", p, ray);
        var hitA = scene.ComputeIntersection(ray);
        var hit2 = hitA ? hitA[0] : undefined;

        var hitCode = -1;
        if(FORCCE_HIT_OCL_MAT_CODE && hit2 && hit2.instanceRef>0   )
        {
            hitCode = hit2.instanceRef;
           //return <vec3>[1,0,1]
           //return [(hit2.instanceRef/4)%2,(hit2.instanceRef/2)%2,hit2.instanceRef%2]

        }
        var l = normalize(sub2(this.Position, p))

        let {hit,I} = this.reprocessRefraction(scene, l, hit2);
        //if(v2 || verbose2) console.log("Hit2", ray, hit2, hit.light, sub2(ls.Position,hit.p))
        if(hit?.light != this
        /*&& (hit2?.material != this)*/
        )
        {
            //if(v2 || verbose3) console.log("Hit2 Found", hit, ray, hit2, hit.light, ls)
            return {li:vec3.create(), l:vec3.create(), hitCode};
        }        

        var r = distance(p,this.Position);
        var Li = utils.scale(this.Potencia,1/(r*r*LIGHT_FACTOR))

        
        
        //console.log("Radiance", this.Potencia, l, r,Li, r, 1/(r*r*0.5));
        return {li:Li, l:l, hitCode}
    }
    //Potencia:vec3;
    constructor(public Position: vec3 = [0,0,0], Intensidade: vec3 = [1,1,1]){
        super();
        this.Intensidade = Intensidade;
        this.Potencia = utils.scale(this.Intensidade, 2*Math.PI)
    }

}
export class AreaLight extends Light{
    type:"AreaLight";
    //Potencia:vec3;
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
    
    getSamplePoint(p: vec3):LightPointSample {
    

        var Area = this.Area;
        var e1 = utils.scale(this.ArestaI, Math.random())
        var e2 = utils.scale(this.Arestaj, Math.random())

        return { s: add3(this.Position, e1, e2), ns: this.Normal, pdf: 1 / Area };


    }
    SampleRadiance(scene: Scene, p: vec3, n: vec3, i:number): { li: vec3; l: vec3; } {
        var ni = Math.ceil(i/this.sqr_SAMPLE_COUNT);
        var nj = (i % this.sqr_SAMPLE_COUNT);
        var {pos, normal:ns} = this.getSample(ni, nj)

        var rayo = p; 
        var l = utils.scale(normalize(sub2(pos,p)),1/this.SAMPLE_COUNT); 
        var ray = createRay(rayo, l, {addEps:true});

        //if(v2 || verbose2)console.log("Computing intersection with same light", p, ray);
        var hitA = scene.ComputeIntersection(ray);
        var hit = hitA ? hitA[0] : undefined;
        //if(v2 || verbose2) console.log("Hit2", hit)
        //console.log("Radiance", ray);
        //console.log("Radiance", ray, hit);
        
        let {hit:HitS,I} = this.reprocessRefraction(scene, l, hit);

        if(HitS?.light == this
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
    constructor(public Position: vec3 = [0,0,0], public ArestaI:vec3 = [1,0,0],public Arestaj:vec3 = [0, 1, 0], Intensidade: vec3 = [1,1,1]){
        super()
        this.Intensidade = Intensidade

    }

    Cross = cross(this.ArestaI,this.Arestaj);
    Area=  length(this.Cross);
    Normal = normalize(this.Cross);
    AreaPart = this.Area/this.SAMPLE_COUNT;

}
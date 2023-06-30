import { vec2, vec3 } from "gl-matrix";
import { add2, dot, normalize, sub2 } from "./utils";
import { Light } from "./Light";
import { Material, MaterialSample } from "./Material";
import { Box, Shape } from "./Shapes";
import { Transform } from "./Transform";
import * as utils from "./utils";

export type ProgressAction = (i:number,total:number)=>void
export var DEFAULTPROGRESS: ProgressAction = ()=>{}
export const EPSILON = Math.pow(10,-5);

export function calculatePoint(origin:vec3, direction:vec3, t:number, options:{addEps?:boolean, normalizeDirection?:boolean}={} ){
    return add2(origin, utils.scale(direction,t));
}
export function createRay(origin:vec3, direction:vec3, options:{addEps?:boolean, normalizeDirection?:boolean}={} ){
    var rayo = origin
    var rayd = direction
    if(options.addEps)
        rayo = add2(rayo, utils.scale(rayd, EPSILON))
    if(options.normalizeDirection)
        rayd = normalize(rayd);
    var ray:Ray = <Ray>{origin:rayo, direction:rayd, camera:false};
    return ray;
}

export interface RayGenerator {}
export type Ray = {origin:vec3, direction:vec3, camera:boolean, t?:number, generator:RayGenerator};
export function getT(ray:Ray, point: vec3)
{
    return dot(sub2(point, ray.origin), ray.direction);
}
export type Hit = {
    n:vec3;
    t: number;
    light?: Light;
    material?: Material;
    entity:EntityInstance;
    backface:boolean;
    forceOnVertex:boolean;
    instanceRef:number;
    context?:any;
    p:vec3,
    uv:vec2,
};
export interface BSDF{
    cosFact(v:vec3):number
    sample(wi:vec3, n:vec3):MaterialSample
    BRDF(wi:vec3, wo:vec3, hit: Hit):vec3;
}
export class Interaction{
    constructor(public hit:Hit){

    }
    specular:boolean
    BSDF:BSDF

    get p(){return this.hit.p}
    get n(){return this.hit.n}
    lastRay:Ray;
    primitive:EntityInstance
    static fromRayAndHit(ray:Ray, hit:Hit)
    {
        let int = new Interaction(hit);
        int.lastRay = ray
        return int;
    }
    static fromHit(hit:Hit)
    {
        return new Interaction(hit);
    }
    SpawnRayToDirection(d:vec3, considerEpsilon=false)
    {
        let ray=createRay(this.p, d,{addEps:considerEpsilon});
        ray.generator = this;
        this.lastRay = ray;
        return ray;
    }
    SpawnRayToPoint(p:vec3, considerEpsilon=false)
    {
        return this.SpawnRayToDirection(normalize(sub2(p, this.p)), considerEpsilon);
    }
    SqrDistance(p:vec3)
    {
        return utils.sqrLen(sub2(p,this.p))
    }
    ComputeScatteringFunctions(ray:Ray){
        return this.primitive.ComputeScatteringFunctions(this, ray);
    }
}




export type reqData = "p"|"n"|"t"|"backface"
export type RequiredHitData = Pick<Hit,reqData>
export type OptionalOtherData = Partial<Omit<Hit,reqData>>
export function createHit(data:RequiredHitData, other:OptionalOtherData = {}){
    return <Hit>{
        ...data,
        ...other
    }
}
export interface EntityInstance{
    name:string, 
    material?:Material, 
    light?:Light,
    shape:Shape, 
    //transform: Transform,
    ComputeIntersection(ray:Ray):Interaction|undefined;
    ComputeScatteringFunctions(interaction:Interaction,ray: Ray): {specular:boolean};
    BoundingBox():Box
    GlobalBorders():vec3[]
    Centroid():vec3;
};

class BasisPrimitive implements EntityInstance
{
    constructor(public name: string, public shape: Shape, 
        //public transform: Transform, 
        public material?: Material | undefined, public light?: Light | undefined)
    {

    }
    ComputeScatteringFunctions(interaction:Interaction,ray: Ray): {specular:boolean}{
        if(this.material)return this.material?.ComputeScatteringFunctions(interaction)
        return {specular:false}
    }
    // get transform(){
    //     return new Transform(utils.identity())
    // }
    ComputeIntersection(ray:Ray):Interaction|undefined
    {
        return this.shape.ComputeIntersection(ray);
        /*
        var tRay = this.transform.toLocalRay(ray);
        var tHit = this.shape.ComputeIntersection(tRay);
        //var tHit = node.instance!.ComputeIntersection(tRay);
        //console.log("ComputeIntersection", thit);
        var hit = this.transform.toGlobalHit(tHit);
        if(hit && hit.context) hit.context.test = {tRay,tHit};

        return hit;
        */
    }
    GetBorders():vec3[]
    {
        return  this.BoundingBox().Borders();
    }
    GlobalBorders():vec3[]
    {
        return this.GetBorders();
    }
    Centroid(){
        return this.BoundingBox().Centroid();
    }
    BoundingBox():Box
    {
        return this.shape.BondingBox()
    }
    
}
class GeometryPrimitive implements EntityInstance
{
    constructor(public name: string, public shape: Shape, public transform: Transform)
    {

    }
    material?: Material | undefined;
    light?: Light | undefined;
    // get transform(){
    //     return new Transform(utils.identity())
    // }
    ComputeIntersection(ray:Ray):Interaction|undefined
    {
        return this.shape.ComputeIntersection(ray);
    }
    ComputeScatteringFunctions(interaction:Interaction,ray: Ray){
        if(this.material)return this.material?.ComputeScatteringFunctions(interaction)
        return {specular:false}  
    }
    GlobalBorders():vec3[]
    {
        var bbox = this.BoundingBox();

        var globalsborders = bbox.Borders().map(this.transform.toGlobal, this.transform);
        return globalsborders;
    }
    Centroid(){
        return this.transform.toGlobal(this.BoundingBox().Centroid())
    }
    BoundingBox():Box{        
        return this.shape.BondingBox()
    }
    
}
class TransformPrimitive implements EntityInstance
{
    constructor(public name: string, public primitive:EntityInstance, public transform: Transform)
    {

    }
    get shape(){ 
        return this.primitive.shape
    }
    get material(){ 
        return this.primitive.material
    }
    get light(){ 
        return this.primitive.light
    }
    ComputeIntersection(ray:Ray):Interaction|undefined
    {        
        var tRay = this.transform.toLocalRay(ray);
        var intr = this.shape.ComputeIntersection(tRay);
        if(intr==undefined) return;
        if(intr.hit==undefined) return;
        //var tHit = node.instance!.ComputeIntersection(tRay);
        //console.log("ComputeIntersection", thit);
        var hit = this.transform.toGlobalHit(intr.hit);
        if(hit && hit.context) hit.context.test = {tRay,tHit:intr?.hit};

        if(this.name=="Direita" && utils.distance(ray.origin,[2, 0.5192414959505509, 2.78552891584705])<0.1) console.log("Compute Intersection", {ray, tRay, oldHit:intr!.hit, intr, hit,prim:this})
        intr.hit=hit!;
        intr.lastRay = ray;
        return intr;
    }
    ComputeScatteringFunctions(interaction:Interaction,ray: Ray){
        return this.primitive.ComputeScatteringFunctions(interaction, ray);
    }   
    GlobalBorders():vec3[]
    {
        var bbox = this.BoundingBox();

        var globalsborders = bbox.Borders().map(this.transform.toGlobal, this.transform);
        return globalsborders;
    }
    Centroid(){
        return this.transform.toGlobal(this.BoundingBox().Centroid())
    }
    BoundingBox():Box{        
        return this.shape.BondingBox()
    }
    
}

export type RequiredInstanceData = Pick<EntityInstance,"name"|"shape">&Partial<EntityInstance>
export type RequiredTInstanceData = Pick<EntityInstance,"name"|"shape">&Partial<EntityInstance>&{transform:Transform}
export function createTPrimitive(p:RequiredTInstanceData):EntityInstance
{
   // return p;
   if(p.transform)
   {
       return new TransformPrimitive(p.name, new BasisPrimitive(p.name, p.shape, p.material, p.light),p.transform);
    }
    return createPrimitive(p)
}
export function createPrimitive(p:RequiredInstanceData):EntityInstance
{
    return new BasisPrimitive(p.name, p.shape, p.material, p.light);
}
export function createTransformed(p:EntityInstance, transform:Transform):EntityInstance
{
   // return p;
    //return new BasisPrimitive(p.name, p.shape, p.transform, p.material, p.light);
    return new TransformPrimitive(p.name, p, transform);
}
//export function createPrimitive(p:EntityInstance):EntityInstance
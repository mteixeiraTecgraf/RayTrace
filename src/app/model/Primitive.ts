import { vec2, vec3 } from "gl-matrix";
import { add2, dot, normalize, sub2 } from "./utils";
import { Light } from "./Light";
import { Material } from "./Material";
import { Shape } from "./Shapes";
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
    var ray:Ray = {origin:rayo, direction:rayd, camera:false};
    return ray;
}

export type Ray = {origin:vec3, direction:vec3, camera:boolean};
export function getT(ray:Ray, point: vec3)
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
    context?:any;
    p:vec3,
    uv:vec2,
};
export interface EntityInstance{
    name:string, 
    material?:Material, 
    light?:Light,
    shape:Shape, 
    transform: Transform,
    //ComputeIntersection(ray:Ray):Hit|undefined;
};

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
    ComputeIntersection(ray:Ray):Hit|undefined
    {
        return this.shape.ComputeIntersection(ray);
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
    material?: Material | undefined;
    light?: Light | undefined;
    ComputeIntersection(ray:Ray):Hit|undefined
    {
        return this.shape.ComputeIntersection(ray);
    }
    
}
export function createPrimitive(p:EntityInstance):EntityInstance
{
    return p;
    return new GeometryPrimitive(p.name!, p.shape!, p.transform!)
}
//export function createPrimitive(p:EntityInstance):EntityInstance
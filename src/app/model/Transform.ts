import { mat4, vec3 } from "gl-matrix";
import { createMat4, cross, getTranslation, identity, inverse, mulMat, scaleMat, sub2, toVec3, toVec4, transpose } from "./utils";
import { Hit, Ray } from "./Primitive";
import * as GLMat from  "gl-matrix";
import * as utils from "./utils";

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
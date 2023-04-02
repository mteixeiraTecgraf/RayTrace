import { vec3 } from "gl-matrix";
import * as GLMat from "gl-matrix";

export const verbose = false;
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
export function normalize(v:vec3)
{
    return vec3.normalize([0,0,0], v);
}
export function inverse(v:GLMat.mat4)
{
    return GLMat.mat4.invert([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,], v);
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
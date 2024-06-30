import { vec3 } from "gl-matrix";

export class Sampler{

    get2D()
    {
        return [Math.random(), Math.random()];
    }
    getWithZ(z:number):vec3
    {
        var angle = Math.random()*Math.PI*2;
        var p2 = Math.sqrt(1-Math.pow(z,2))
        return [Math.cos(angle)*p2, Math.sin(angle)*p2, z];
    }
    getUnitaryHemisphere()
    {
        var z = Math.random();
        return this.getWithZ(z);
    }
    getUnitarySphere()
    {
        var z = Math.random();
        return this.getWithZ(z);
    }
    getDisk()
    {
        var rPart = Math.sqrt(Math.random());
        var theta = Math.PI*2*Math.random();
        var i2 = rPart*Math.cos(theta);
        var j2 = rPart*Math.sin(theta);
        //console.log([i2,j2], r, theta)
        return [i2,j2];
    }
    get1D():number
    {
        return Math.random();
    }
}



export interface Sample{s:vec3,pdf:number, n:vec3, wi:vec3}
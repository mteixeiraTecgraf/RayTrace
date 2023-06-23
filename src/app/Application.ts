import { Component, ElementRef, Injectable, OnInit, ViewChild } from '@angular/core';
import { vec3 } from 'gl-matrix';
import { AMBIENT_LIGHT, AreaLight, Camera, Film, PontualLight, Scene, Transform, rotate, scale, translate } from './model';
import { Box, Plane, Sphere, Vertex } from './model';
import { Material, PhongMaterial, PhongMetal, PhongDieletrics, TextureMaterial } from './model';
import { ANGLE, REPEAT_PX, RESOLUTION } from './model';
import { COLOR, VECS, add2 } from './model/utils';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { bufferTime, map, filter, tap} from 'rxjs/operators';
import { Observable, Subscription, Subject, firstValueFrom, from } from 'rxjs';
import { DEFAULTPROGRESS, ProgressAction } from './model/Primitive';

@Injectable({
 providedIn: 'root',
})
export class Application{
    constructor(private http:HttpClient){}
    static Start(){

    }
    
  scene:Scene;
  W = RESOLUTION[0];
  H = RESOLUTION[1];
  angle = ANGLE;
  initScene(ctx :CanvasRenderingContext2D, sceneNumber:number = 1){
    return new Observable<{i:number,j:number}>(a=>{
        this._initScene(ctx, sceneNumber, {progress:(i,j)=>{
            if((i*100/j)%10 == 0)
            {
                a.next({i,j});
  }
            if(i===j)
            {     
                console.log("complete")
                a.complete()
            }
        }})
    })
  }
  _initScene(ctx :CanvasRenderingContext2D, sceneNumber:number = 1,o:{progress:ProgressAction} = {progress:DEFAULTPROGRESS}){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    ctx.canvas.width = this.W*REPEAT_PX
    ctx.canvas.height = this.H*REPEAT_PX
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W ,this.H ], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = AMBIENT_LIGHT;
    //var dz = 1;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,0,0,],u,v,w,this.angle, 1, this.W/this.H );

    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    //this.prepareSimpleLightBackBoxScene(scene);
    
    var sceneFunction = undefined

    switch(sceneNumber)
    {
        case 1:
            sceneFunction  = this.scene1;
            break;
        case 2:
            sceneFunction = this.scene2;
            break;
        case 3:
            sceneFunction =  this.scene3;
            break;
        case 4:
            sceneFunction =  this.scene4;
            break;
        case 5:
            sceneFunction =  this.scene5;
            break;
            
    }

    if(sceneFunction)
    {
        sceneFunction = sceneFunction.bind(this)
        from(sceneFunction(scene)).subscribe(()=>{
            //await this.bunnysceneSimple(scene);
        scene.prepareScene();
                
            scene.Render(ctx, o);
            scene.ReportComputations();

        })
    }
    //subj.unsubscribe();
  }
  
  animate(ctx :CanvasRenderingContext2D){
    this.scene.camera.RotateOriginZ(-40)
    this.scene.camera.RotateZ(-40)
    //this.scene.camera.RotateX(15*Math.random()-7)
    this.scene.Render(ctx)
    /*
     this.ctx.fillStyle = 'red';
     const square = new Square(this.ctx);
     square.draw(0, 0, 10);
     const myImageData = this.ctx.getImageData(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
     console.log("myImageData", myImageData)
     //square.move(1,21)
     */
  }
  RotateX(ctx :CanvasRenderingContext2D, angle:number){
    this.scene.camera.RotateOriginX(angle)
    this.scene.camera.RotateX(angle)
    //this.scene.camera.RotateX(15*Math.random()-7)
    this.scene.Render(ctx)
  }
  RotateY(ctx :CanvasRenderingContext2D, angle:number){
    this.scene.camera.RotateOriginY(angle)
    this.scene.camera.RotateY(angle)
    //this.scene.camera.RotateX(15*Math.random()-7)
    this.scene.Render(ctx)
  }
  RotateZ(ctx :CanvasRenderingContext2D, angle:number){
    this.scene.camera.RotateOriginZ(angle)
    this.scene.camera.RotateZ(angle)
    //this.scene.camera.RotateX(15*Math.random()-7)
    this.scene.Render(ctx)
  }
  
  async testScene1(scene:Scene){

  }
  async scene1(scene:Scene){
    scene.AddPonctualLight(new PontualLight([0,-2,2],))   
    scene.AddPonctualLight(new PontualLight([-2,-0,2],))   
    this.addFloor(scene, Transform.fromPipe(
        translate([-0.5,-0.5,-1]),
        scale([10,10,0.1]),
      ));
    
    this.addSphere(scene, Transform.fromPipe(translate([0,0,1]))); 
    scene.camera.RotateX(-10);    
    scene.camera.addToOrigin([0,-2.0,1.5,])
  }
  async scene2(scene:Scene){
    this.addBox(scene, 
      //Transform.fromScaleAndTranslation([-1.5,0.8,0],1,1,1.8)
      Transform.fromPipe(scale([0.6,0.6,0.6]), rotate(-50,"z"),translate([0.3,1.4,0]))
    );
    this.addBox(scene, 
      //Transform.fromScaleAndTranslation([-1.5,0.8,0],1,1,1.8)
      Transform.fromPipe(scale([1,1,1.8]), rotate(50,"z"),translate([-1.1,0.5,0]))
    );
    this.boxSceneBase(scene);
    
    return;
    await this.addVertices(scene);
    
    this.addSphere(scene, Transform.fromPipe(
      scale([0.5,0.5,0.5]),
      translate([0.5,0.5,0.5]),

    ));
  }
  async scene3(scene:Scene){
    scene.camera.RotateX(-45)
    scene.camera.RotateZ(-0)
    scene.camera.addToOrigin([-0,-2.0,2.8,])
    scene.camera.addToOrigin([0,1.5,1.5]);
    this.SimpleLightScene(scene);
    this.addFloor(scene, Transform.fromPipe(
        translate([-0.5,-0.5,-1]),
        scale([10,10,0.1]),
      ));
      this.addBox(scene,
        Transform.fromPipe(
          translate([-3,-1,0]),
          //scale([10,10,0.1]),
          //rotate(10,"x"),
        ));
        this.addBox(scene,
          Transform.fromPipe(
            rotate(-30,"y"),
            translate([-1.5,0,0]),
            //scale([10,10,0.1]),
          )
        );
        this.addBox(scene,
          Transform.fromPipe(
            rotate(-45,"y"),
            translate([0.0,1,0]),
            //scale([10,10,0.1]),
          )
        );
        this.addBox(scene,
          Transform.fromPipe(
            rotate(-60,"y"),
            translate([1.5,0,0]),
            //scale([10,10,0.1]),
          )
        );
        this.addBox(scene,
          Transform.fromPipe(
            rotate(-90,"y"),
            translate([3.0,-1,0]),
            //scale([10,10,0.1]),
          )
        );
          this.addSphere(scene, Transform.fromPipe(scale([0.2,0.2,0.2])))
      /*
    this.addBox(scene,
      Transform.fromPipe(
        translate([-2,0,0]),
        //scale([10,10,0.1]),
        rotate(10,"x"),
      ));
      */
    //await this.addVertices(scene);
  }
  async boxSceneBase(scene:Scene){
    
    scene.camera.addToOrigin([0,-1.5,1.5,])
    //this.SimpleLightScene(scene);
    this.SimpleArea(scene)
    this.addCeil(scene)
    this.addBack(scene);
    this.addLateralReflective(scene);
    this.addLeft(scene);
    this.addFloor(scene);
    //this.addSpheres(scene);
    //await this.addVertices(scene);
    //await this.addTorus(scene);
  }
  async scene4(scene:Scene){
    scene.camera.addToOrigin([0,-2.0,1.2,])
    scene.camera.RotateX(-32.3);
    scene.camera.angle = 20;
    this.boxSceneBase(scene);
    this.addFloor(scene, Transform.fromPipe(
        translate([-0.5,-0.5,-1]),
        scale([10,10,0.1]),
      ));
    this.addSphere(scene, Transform.fromScaleAndTranslation([1,0,0.6],0.6,0.6,0.6), new PhongMetal(new PhongMaterial([1,0.6,0.6]), 0.2));
    await this.addBunny(scene,"bunny_simple2.off");
    this.addSphere(scene, Transform.fromPipe(scale([0.2,0.2,0.2])))
    this.scene.camera.RotateOriginZ(-40)
    this.scene.camera.RotateZ(-40)
  }
  async scene5(scene:Scene){
    scene.camera.addToOrigin([0,-2.0,1.2,])
    scene.camera.RotateX(-32.3);
    scene.camera.angle = 15;
    this.boxSceneBase(scene);
    this.addFloor(scene, Transform.fromPipe(
        translate([-0.5,-0.5,-1]),
        scale([10,10,0.1]),
      ));
    this.addSphere(scene, Transform.fromScaleAndTranslation([1,0,0.6],0.6,0.6,0.6), new PhongMetal(new PhongMaterial([0.6,0.6,0.6]), 0.9));
    await this.addBunny(scene,"bunny.off");
    this.addSphere(scene, Transform.fromPipe(scale([0.2,0.2,0.2])))
    this.scene.camera.RotateOriginZ(-40)
    this.scene.camera.RotateZ(-40)
    
  }
  async addSphere(scene: Scene, transform:Transform = new Transform(), material:Material = new PhongMaterial([1,0,0],[1,1,1], 20)) {
    //scaleMat(mat, [1,0,]);
    scene.AddEntity({name:"Sphere",material: material, shape:new Sphere(), 
      //[0,2,-1+dz], 1
      transform:transform,
      //transform:new Transform()
    })
  }
  private httpOptions = {
    headers: new HttpHeaders({
      'Accept': 'text/html, application/xhtml+xml, */*',
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    responseType: 'text'
  };
  async loadOff(filename:string)
  {
    var off = await firstValueFrom(this.http.get(`assets/${filename}`,{responseType:"text"}));
    //return off;
    var lines = off.split("\n");
    var [numV, numP] = lines[1].split(" ").map(Number);
    var vertexes = lines.slice(2,numV+2).map(s=>s.split(" ").map(Number) as vec3);
    var pol = lines.slice(2+numV,numP+2+numV).map(s=>s.split(" ").slice(1).map(Number) as [number,number,number]);

    return {v:vertexes,p:pol};
  }
  async addSpheres(scene: Scene) {
    
    this.addSphere(scene, Transform.fromPipe(
      translate([0,0,1]),
      scale([0.2,0.2,0.4]),
      rotate(45, "y"),
      translate([1,0.5,0]),

    ));
    this.addSphere(scene, Transform.fromPipe(
      translate([0,0,1]),
      scale([0.3,0.3,0.1]),
      //rotate(45, "y"),
      translate([1,1.5,0]),

    ));
  }

  async addTorus(scene: Scene) {
    var t = await this.loadOff("double_torus.off");
    await this.addMesh(scene, t.v, t.p, 
        Transform.fromPipe(
          scale([0.05,0.05,0.05]),
          rotate(-90,"x"),
          ))
  }
  async addBunny(scene: Scene, bunnyModel:string, transform:Transform = Transform.fromPipe(
                  scale([0.51,0.51,0.51]),
                  rotate(90,"x"),
                  rotate(60,"z"),
                  translate([-0.5,-0.2,0.51]),
                  )
    ) {
    var t = await this.loadOff(bunnyModel);
    await this.addMesh(scene, t.v, t.p, transform)
        
  }

  async addVertices(scene: Scene) {
    //const material = new PhongMaterial([0,1,0],[0,0,0]);
    //scene.AddEntity({name:"vertice",shape: new Vertex([0,0,0],[1,0,0],[0,1,1/2]), transform:new Transform(), material})
    
    //const material = new PhongMaterial([0,1,1],[0,0,0]);
    //scene.AddEntity({name:"vertice2",shape: new Vertex([1.9,1,0.1],[0.9,2,0.1],[0.9,1,0.1]), transform:new Transform(), material:material2})
    await this.addMesh(scene, [[-1,0,0],[-0.5,0.5,0], [-1.5,0.5,0], [-1,0.25,0.5]], [[0,1,2],[0,1,3],[1,2,3],[2,0,3]])
    await this.addMesh(scene, [
        //[0,0,0],[1,0,0], [1,1,0], [0,1,0],
        //[0,0,1],[1,0,1], [1,1,1], [0,1,1],
        ...this.createPlaneVertex([0,0,0],[1,0,0], [0,1,0]),
        ...this.createPlaneVertex([0,0,1],[1,0,0], [0,1,0]),
      ], [
        ...this.createPlaneVertexPoints(0,3,2,1),//down
        ...this.createPlaneVertexPoints(4,5,6,7),//up
        ...this.createPlaneVertexPoints(0,1,5,4),//front
        ...this.createPlaneVertexPoints(2,3,7,6),//back
        ...this.createPlaneVertexPoints(3,0,4,7),//left
        ...this.createPlaneVertexPoints(1,2,6,5),
      ],
      Transform.fromPipe(
        scale([0.4,0.4,0.4]),
        rotate( 135, "z"),
        rotate( 45, "y"),
        translate( [-1,0.8,1.8]),
      )
    )
  }
  createPlaneVertexPoints(...[v1,v2,v3,v4]:number[]):[number,number,number][]{
    return [[v1,v2,v4],[v3,v4,v2]]//down
  }
  createPlaneVertex(...[o,e1,e2]:vec3[]){
    const v1 = add2(o,e1);
    return [o,v1,add2(v1,e2), add2(o,e2)]
  }
  async addMesh(scene: Scene, vertexes:vec3[], polygon:[number,number,number][], transform:Transform = new Transform()) {
    const material2 = new PhongMaterial([0,1,1],[1,1,1],20);
    //const material2 = new PhongMetal(new PhongMaterial([0,1,1],[1,1,1],20),0);
    //const material2 = new TextureMaterial("/assets/brick-texture-png-23870.png");
    //await material2.waitLoad()
    //await material2.waitLoad();
    console.log("Mesh Start", vertexes, polygon);
    for(let p of polygon)
    {
      //console.log("Vertex", p, vertexes);
      scene.AddEntity({name:`vertice ${p[0]} ${p[1]} ${p[2]}`,shape: new Vertex(vertexes[p[0]],vertexes[p[1]], vertexes[p[2]]), transform:transform, material:material2})
    }
    console.log("Mesh Complete");
  }
  prepareBoxScene(scene:Scene){
    
    var material = new PhongMaterial([1,0,0], [0,0,0], 0.1);
    //rightwall mat
    var material2 = new PhongMaterial([1,1,1], [0.8,0.8,0.8],20);
    //rightwall mat
    var rightRedMat = new PhongMetal(new PhongMaterial([1,0,0], [1,0.3,0.3],10), 0.600);
    //leftwall mat
    var leftGreenMat = new PhongMetal(new PhongMaterial([0.4,1,0.4], [0,0,0],1), 0.600);
    var material6 = new PhongMaterial([0.2,0.2,0.2], [0.9,0.9,0.9],1);
    
    this.SimpleLightScene(scene);
    scene.AddEntity({name:"Caixa 1",material: material6, shape:new Box([0,0,0],[1,1,1]), 
      //[0,2,-1+dz], 1
      transform:Transform.fromScaleAndTranslation([-1.5,0.8,0],1,1,1.8)
      //transform:new Transform()
    })
    scene.AddEntity({name:"Piso",material: material2, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2,0,-0.1], 4,3,0.1)})
    //rightRed
    scene.AddEntity({name:"Direita",material: rightRedMat, shape:new Box(), transform:Transform.fromScaleAndTranslation([2,0,-0.1], 0.1,3,3.1)})
    //left green
    scene.AddEntity({name:"Esquerda",material: leftGreenMat, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.1,0,-0.1], 0.1,3,3.1)})
    //back
    scene.AddEntity({name:"Fundo",material: material2, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.0,2,-0.1], 4,0.1,3.2)})
    this.addCeil(scene);

  }
  SimpleArea(scene:Scene){
    var factor = 32
    var lightIntens = <vec3>[factor,factor,factor];
    scene.AddAreaLight(new AreaLight([-1.2,0.8,2.90],[0.5,0,0],[0,-0.5,0],lightIntens))
    scene.AddAreaLight(new AreaLight([1.0,0.8,2.90],[0.5,0,0],[0,-0.5,0],lightIntens))
  }
  SimpleLightScene(scene:Scene){
    var lightIntens = <vec3>[5,5,5];
    scene.AddPonctualLight(new PontualLight([0.25,0.2,2.97],lightIntens))    
    scene.AddPonctualLight(new PontualLight([-1.25,-1.2,2.97],lightIntens))     
  }
  prepareSimpleLightBackBoxScene(scene:Scene){
    
    this.SimpleLightScene(scene);
    this.addBack(scene);
    
  }
  readonly COLOR = COLOR.WHITE;
  addBack(scene:Scene){
    
    //rightwall mat
    var material2 = new PhongMaterial(this.COLOR, [0.8,0.8,0.8],20);
    //back
    scene.AddEntity({name:"Fundo",material: material2, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.0,2,-0.1], 4,0.1,3.2)})
    
  }
  addCeil(scene:Scene){
    //ceil mat
    var material5 = new PhongMaterial(this.COLOR, [0.6,0.6,0.6],10);
    //teto
    scene.AddEntity({name:"Teto",material: material5, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.0,0,3.0], 4,3,0.1)})

  }
  addFloor(scene:Scene, transform:Transform=Transform.fromScaleAndTranslation([-2,0,-0.1], 4,3,0.1)){
    //rightwall mat
    var material2 = new PhongMaterial(this.COLOR, [0.8,0.8,0.8],20);
    //piso
    scene.AddEntity({name:"Piso",material: material2, shape:new Box(), transform:
      transform
    })
   
  }
  simpleLightCeilScene(scene:Scene){
    
    this.SimpleLightScene(scene);
    this.addCeil(scene);

  }
  prepareSimpleLightLateralReflective(scene:Scene){
  
    this.SimpleLightScene(scene);
    this.addLateralReflective(scene);
  }
  addLateralReflective(scene:Scene){
    
    //rightwall mat
    var rightRedMat = new PhongMetal(new PhongMaterial([1,0,0], [1,0.3,0.3],10), 0.600);
    //rightRed
    scene.AddEntity({name:"Direita",material: rightRedMat, shape:new Box(), transform:Transform.fromScaleAndTranslation([2,0,-0.1], 0.1,3,3.1)})
    
  }
  addBox(scene:Scene, transform: Transform = new Transform())
  {
    var material6 = new PhongMaterial([1.0,1.0,1.0], [0.9,0.9,0.9],1);
    //var material6 = new PhongDieletrics(1.33); //TODO Test hit box ray inside
    
    scene.AddEntity({name:"Caixa 1",material: material6, shape:new Box([0,0,0],[1,1,1]), 
      //[0,2,-1+dz], 1
      transform:transform
      //transform:new Transform()
    })
  }
  addLeft(scene:Scene){
    
    //leftwall mat
    var leftGreenMat = new PhongMetal(new PhongMaterial([0.0,1,0.4], [0,0,0],1), 0.600);
    //left green
    scene.AddEntity({name:"Esquerda",material: leftGreenMat, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.1,0,-0.1], 0.1,3,3.1)})
        
  }

  prepareScene1(scene:Scene){
    
    //console.log("mfyImageData", myImageData)
  //this.ctx.putImageData(myImageData,0,0);
  //scene.testCameraPixels();
  var material = new PhongMaterial([1,0,0], [0,0,0], 0.1);
  //rightwall mat
  var material2 = new PhongMaterial([1,1,1], [0.8,0.8,0.8],20);
  //rightwall mat
  var rightRedMat = new PhongMetal(new PhongMaterial([1,0,0], [1,0.3,0.3],10), 0.600);
  //leftwall mat
  var leftGreenMat = new PhongMetal(new PhongMaterial([0.4,1,0.4], [0,0,0],1), 0.600);
  //ceil mat
  var material5 = new PhongMaterial([0.1,0.1,0.1], [0.6,0.6,0.6],10);
  var material6 = new PhongMaterial([0.2,0.2,0.2], [0.9,0.9,0.9],1);
  
  //scene.AddPonctualLight(new PontualLight([-0.5,0.3,0.8+dz]))
  scene.AddPonctualLight(new PontualLight([1.5,1.2,2.97],))    
  /*
  scene.AddPonctualLight(new PontualLight([-0.5,1,2.4],[0.25,0.25,0.25]))
  scene.AddPonctualLight(new PontualLight([0.5,1,2.4],[0.25,0.25,0.25]))
  scene.AddPonctualLight(new PontualLight([-0.5,0,2.4],[0.25,0.25,0.25]))
  scene.AddPonctualLight(new PontualLight([0.5,0,2.4],[0.25,0.25,0.25]))
  */
 //scene.AddAreaLight(new AreaLight([-0.5,1,2.4],[1,0,0],[0,-1,0]))

  //scene.AddPonctualLight(new PontualLight([0,1,1]))
  //scene.AddPonctualLight(new PontualLight([1,1,1], [1,0,0]))
  //scene.AddPonctualLight(new PontualLight([0,1,2],[0,1,0]))
  //return;
    //new Light([0,5,0]), 
  //scene.AddLight(new Light([2.5,0,10]),)

  /*
  scene.AddEntity({material: material, shape:new Sphere(), 
    //[0,2,-1+dz], 1
    transform:Transform.fromScaleAndTranslation([0,2,0.2+dz],1,1,1.2)
    //transform:new Transform()
  })
  */
  scene.AddEntity({name:"Caixa 1",material: material6, shape:new Box([0,0,0],[1,1,1]), 
    //[0,2,-1+dz], 1
    transform:Transform.fromScaleAndTranslation([-1.5,0.8,0],1,1,1.8)
    //transform:new Transform()
  })
  
  
  //scene.AddEntity({material: material, shape:new Sphere([-2,5,0], 1)})
  //scene.AddEntity({material: material, shape:new Sphere([0,5,0], 1)})
  //scene.AddEntity({material: material, shape:new Sphere([2,5,0], 1)})
  //scene.AddEntity({material: material, shape:new Sphere([-2,7,0], 1)})
  //scene.AddEntity({material: material, shape:new Sphere([0,7,0], 1)})
  ////scene.AddEntity({material: material, shape:new Sphere([-1,2,0], 1)})
  //scene.AddEntity({material: material, shape:new Sphere([3,5,0], 1)})
  

  //scene.AddEntity({material: material2, shape:new Plane([0,0,1], [0,0,-1+dz]), transform:new Transform()})
  //scene.AddEntity({material: material3, shape:new Plane([-1,0,0], [2,0,0]), transform:new Transform()})
  // scene.AddEntity({material: material4, shape:new Plane([1,0,0], [-2,0,0]), transform:new Transform()})
  // scene.AddEntity({material: material2, shape:new Plane([0,-1,0], [0,3,0]), transform:new Transform()})
  // scene.AddEntity({material: material5, shape:new Plane([0,0,-1], [0,0,4]), transform:new Transform()})
  scene.AddEntity({name:"Piso",material: material2, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2,0,-0.1], 4,3,0.1)})
  //rightRed
  scene.AddEntity({name:"Direita",material: rightRedMat, shape:new Box(), transform:Transform.fromScaleAndTranslation([2,0,-0.1], 0.1,3,3.1)})
  //left green
  scene.AddEntity({name:"Esquerda",material: leftGreenMat, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.1,0,-0.1], 0.1,3,3.1)})
  //back
  scene.AddEntity({name:"Fundo",material: material2, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.0,2,-0.1], 4,0.1,3.2)})
  //teto
  scene.AddEntity({name:"Teto",material: material5, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.0,0,3], 4,3,0.1)})


  }
  testScene2(ctx :CanvasRenderingContext2D){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    ctx.canvas.width = this.W
    ctx.canvas.height = this.H
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W* REPEAT_PX ,this.H* REPEAT_PX ], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = 0.6;
    var dz = 1;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,0,dz,],u,v,w,this.angle, 5, this.W/this.H );

    //camera.RotateX(-25.3);
    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    
    scene.AddPonctualLight(new PontualLight([0,2,dz]))
    scene.Render(ctx);
  }

  testScene3(ctx :CanvasRenderingContext2D){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
      this.angle = 100;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    ctx.canvas.width = this.W
    ctx.canvas.height = this.H
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W* REPEAT_PX ,this.H* REPEAT_PX ], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = 0.2;
    var dz = 0;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,0,dz,],u,v,w,this.angle, 5, this.W/this.H );

    camera.RotateX(-49.3);
    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    //var scene = new Scene(film, );
    
      //console.log("mfyImageData", myImageData)
    //this.ctx.putImageData(myImageData,0,0);
    //scene.testCameraPixels();
    var material = new PhongMaterial([1,0,0]);
    var material2 = new PhongMaterial([1,1,1]);
    //scene.AddLight({material: material, shape:new Sphere([0,3,0], 1)})
    //scene.AddLight(new Light([-0.5,1,-3]))
    //scene.AddLight(new Light([-0.5,2,1.5+dz]))
    //scene.AddLight(new Light([-0.6,0.8,-0.3+dz]))
    scene.AddPonctualLight(new PontualLight([0,1,-0+dz]))
    //return;
      //new Light([0,5,0]), 
    //scene.AddLight(new Light([2.5,0,10]),)
    
    scene.AddEntity({name:"Sphere",material: material, shape:new Sphere(), 
      //[0,2,-1+dz], 1
      transform:Transform.fromScaleAndTranslation([0,2,-1+dz],)
      //transform:new Transform()
    })
    
    
    //scene.AddEntity({material: material, shape:new Sphere([-2,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([0,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([2,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([-2,7,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([0,7,0], 1)})
    ////scene.AddEntity({material: material, shape:new Sphere([-1,2,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([3,5,0], 1)})
    scene.AddEntity({name:"Plane", material: material2, shape:new Plane([0,0,1], [0,0,-1+dz]), transform:new Transform()})
    //scene.AddEntity({material: material2, shape:new Plane([0,-1,0], [0,10,0])})
    scene.Render(ctx);
  }
}
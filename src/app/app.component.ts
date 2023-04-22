import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { glMatrix, mat2, vec3 } from 'gl-matrix';
import { AreaLight, Camera, Film, Light, PontualLight, Scene, Transform } from './model/Film';
import { Box, Plane, Sphere, Vertex } from './model/Shapes';
import { PhongMaterial, PhongMetal, TextureMaterial } from './model/Material';
import { ANGLE, REPEAT_PX, RESOLUTION } from './model/config';
import { add2 } from './model/utils';


const setPixel = (myImageData:any, x:number, y:number, width:number, height:number, r:number, g:number, b:number, a:number = 255) => {

  const colorIndices = getColorIndicesForCoord(x, height-y-1, width);
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
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'raytrace';
  @ViewChild('canvas', { static: true }) 
  canvas: ElementRef<HTMLCanvasElement>;
  ctx :CanvasRenderingContext2D;
  
  ngOnInit(): void {
    
    this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    //this.drawRect();
    this.initScene();
  }
  scene:Scene;
  W = RESOLUTION[0];
  H = RESOLUTION[1];
  angle = ANGLE;
  initScene(){
    this.testScene1();
  }
  
  async testScene1(){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    this.ctx.canvas.width = this.W*REPEAT_PX
    this.ctx.canvas.height = this.H*REPEAT_PX
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W ,this.H ], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = 0.6;
    var dz = 1;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,-2.0,0.5+dz,],u,v,w,this.angle, 1, this.W/this.H );

    //camera.RotateX(-25.3);
    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    //this.prepareSimpleLightBackBoxScene(scene);
    
    this.SimpleLightScene(scene);
    this.addCeil(scene)
    this.addBack(scene);
    this.addLateralReflective(scene);
    this.addLeft(scene);
    this.addFloor(scene);
    this.addBox(scene);
    await this.addVertices(scene);
    
    //this.prepareSimpleLightScene(scene);
    //this.prepareBoxScene(scene);
    //this.prepareScene1(scene);
    //var scene = new Scene(film, );
    //scene.AddEntity({material: material2, shape:new Plane([0,-1,0], [0,10,0])})
    scene.Render(this.ctx);
    scene.ReportComputations();
  }
  async addVertices(scene: Scene) {
    const material = new PhongMaterial([0,1,0],[0,0,0]);
    //scene.AddEntity({name:"vertice",shape: new Vertex([0,0,0],[1,0,0],[0,1,1/2]), transform:new Transform(), material})
    
    //const material2 = new PhongMaterial([0,1,1],[0,0,0]);
    //scene.AddEntity({name:"vertice2",shape: new Vertex([1.9,1,0.1],[0.9,2,0.1],[0.9,1,0.1]), transform:new Transform(), material:material2})
    await this.addMesh(scene, [[-1,0,0],[-0.5,0.5,0], [-1.5,0.5,0], [-1,0.25,0.5]], [[0,1,2],[0,1,3],[1,2,3],[2,0,3]])
    await this.addMesh(scene, [
      //[0,0,0],[1,0,0], [1,1,0], [0,1,0],
      //[0,0,1],[1,0,1], [1,1,1], [0,1,1],
      ...this.createPlaneVertex([1,1,0],[0.5,0.5,0], [-0.5,0.5,0]),
      ...this.createPlaneVertex([1,1,1],[0.5,0.5,0], [-0.5,0.5,0]),
    ], [
      ...this.createPlaneVertexPoints(0,3,2,1),//down
      ...this.createPlaneVertexPoints(4,5,6,7),//up
      ...this.createPlaneVertexPoints(0,1,5,4),//front
      ...this.createPlaneVertexPoints(2,3,7,6),//back
      ...this.createPlaneVertexPoints(3,0,4,7),//left
      ...this.createPlaneVertexPoints(1,2,6,5),
    ])
  }
  createPlaneVertexPoints(...[v1,v2,v3,v4]:number[]):[number,number,number][]{
    return [[v1,v4,v2],[v3,v2,v4]]//down
  }
  createPlaneVertex(...[o,e1,e2]:vec3[]){
    const v1 = add2(o,e1);
    return [o,v1,add2(v1,e2), add2(o,e2)]
  }
  async addMesh(scene: Scene, vertexes:vec3[], polygon:[number,number,number][]) {
    //const material2 = new PhongMaterial([0,1,1],[1,1,1],0.6);
    const material2 = new TextureMaterial("/assets/brick-texture-png-23870.png");
    await material2.waitLoad();
    for(let p of polygon)
    {
      scene.AddEntity({name:`vertice ${p[0]} ${p[1]} ${p[2]}`,shape: new Vertex(vertexes[p[0]],vertexes[p[1]], vertexes[p[2]]), transform:new Transform(), material:material2})
    }
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
  SimpleLightScene(scene:Scene){
    
    scene.AddPonctualLight(new PontualLight([1.5,1.2,2.97],))    
  }
  prepareSimpleLightBackBoxScene(scene:Scene){
    
    this.SimpleLightScene(scene);
    this.addBack(scene);
    
  }
  addBack(scene:Scene){
    
    //rightwall mat
    var material2 = new PhongMaterial([1,1,1], [0.8,0.8,0.8],20);
    //back
    scene.AddEntity({name:"Fundo",material: material2, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.0,2,-0.1], 4,0.1,3.2)})
    
  }
  addCeil(scene:Scene){
    //ceil mat
    var material5 = new PhongMaterial([0.1,0.1,0.1], [0.6,0.6,0.6],10);
    //teto
    scene.AddEntity({name:"Teto",material: material5, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2.0,0,3], 4,3,0.1)})

  }
  addFloor(scene:Scene){
    //rightwall mat
    var material2 = new PhongMaterial([1,1,1], [0.8,0.8,0.8],20);
    //piso
    scene.AddEntity({name:"Piso",material: material2, shape:new Box(), transform:Transform.fromScaleAndTranslation([-2,0,-0.1], 4,3,0.1)})
   
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
  addBox(scene:Scene)
  {
    var material6 = new PhongMaterial([0.2,0.2,0.2], [0.9,0.9,0.9],1);
    
    scene.AddEntity({name:"Caixa 1",material: material6, shape:new Box([0,0,0],[1,1,1]), 
      //[0,2,-1+dz], 1
      transform:Transform.fromScaleAndTranslation([-1.5,0.8,0],1,1,1.8)
      //transform:new Transform()
    })
  }
  addLeft(scene:Scene){
    
    //leftwall mat
    var leftGreenMat = new PhongMetal(new PhongMaterial([0.4,1,0.4], [0,0,0],1), 0.600);
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
  testScene2(){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    this.ctx.canvas.width = this.W
    this.ctx.canvas.height = this.H
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W* REPEAT_PX ,this.H* REPEAT_PX ], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = 0.2;
    var dz = 1;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,0,dz,],u,v,w,this.angle, 5, this.W/this.H );

    //camera.RotateX(-25.3);
    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    
    scene.AddPonctualLight(new PontualLight([0,2,dz]))
    scene.Render(this.ctx);
  }

  testScene3(){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
      this.angle = 100;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    this.ctx.canvas.width = this.W
    this.ctx.canvas.height = this.H
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
    scene.Render(this.ctx);
  }
  animate(){
    this.scene.camera.RotateX(15*Math.random()-7)
    this.scene.Render(this.ctx)
    /*
     this.ctx.fillStyle = 'red';
     const square = new Square(this.ctx);
     square.draw(0, 0, 10);
     const myImageData = this.ctx.getImageData(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
     console.log("myImageData", myImageData)
     //square.move(1,21)
     */
  }

  drawCircle(){
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(0, 0, 5, 5);
  }
}

export class Square {
  constructor(private ctx: CanvasRenderingContext2D) {}


  move(y: number, z: number) {
    const max = this.ctx.canvas.width / z;
    const canvas = this.ctx.canvas;
    let x = 0;
    const i = setInterval(() => {
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);      
      this.draw(x, y, z);
      x++;
      if (x >= max) {
        clearInterval(i);
      }
    }, 200);    
  }
  draw(x: number, y: number, z: number) {
    this.ctx.fillRect(z * x, z * y, z, z);
  }
}
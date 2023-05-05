import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';

import { Subject, from, interval, timer } from 'rxjs';
import { Application } from './Application';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'raytrace';
  @ViewChild('canvas', { static: true }) 
  canvas: ElementRef<HTMLCanvasElement>;
  ctx :CanvasRenderingContext2D;
  constructor(private application:Application, 
    private ref: ChangeDetectorRef, 
    private ngZone: NgZone ){    
  }
  
  progress = 0;
  progressSubj = new Subject<number>();
  progressObj = this.progressSubj.asObservable();
  ngOnInit(): void {
    
    //this.drawRect();
    
    //this.application.initScene(this.ctx);

  }
  reload(sceneNum:number){
    this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    var self = this;
    this.loading = true;
    this.ref.markForCheck();
    this.ref.detectChanges();
    this.rerenderProps[0]++;
    //this.progressSubj.next(10);
    this.progress = 0;
    //interval(1000).subscribe(i=>{
      setTimeout(
        ()=>{
              
          this.application.initScene(this.ctx, sceneNum).subscribe(
            {

      //() => console.log('success'),
      //(error) => console.log('error', error),
      next:(        a: { i: number; j: number; })=>{
        
        this.ngZone.run(()=>{
          //this.progressSubj.next(50);
          //console.log(a);
          //setTimeout(()=>{
            
            this.loading = false;
            this.progress++;
                    this.refresh(a)
                    this.ref.detectChanges();
            //}, 10);
            //this.loading = false;
            //this.progressSubj.next(i.i)
          })
          
        },
                error:(error)=>console.error("Error", error),
        complete:()=>{
          this.loading=false;
                  this.ref.detectChanges();
        }
              }
                );
      }, 1000
      )
    
    /*
    this.application.initScene(this.ctx, sceneNum)
    .subscribe(this.refresh.bind(this));
    */
  }
  loading = false;
  public rerenderProps: Array<number> = [1];
  refresh(v:{i:number,j:number}){
    //if((v.i*100/v.j)%10 == 0)
    {
      this.progress = (v.i*100/v.j);
      console.log("Pixel",v.i, v.i*100/v.j)
      //this.progressSubj.next(50);
      //this.progress = (50);
      this.rerenderProps[0]++;
      //this.progressSubj.next(v.i*100/v.j);
      //this.ref.markForCheck();
      //this.ref.detectChanges();
      
      //this.progress = i*100/j;
    }

  }
  animate(){
    this.application.animate(this.ctx)
  }
  rotateX(value:number){
    this.application.RotateX(this.ctx, value)
  }
  rotateY(value:number){
    this.application.RotateY(this.ctx, value)
  }
  rotateZ(value:number){
    this.application.RotateZ(this.ctx, value)
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
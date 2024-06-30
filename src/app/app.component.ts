import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';

import { Subject, from, interval, startWith, timer } from 'rxjs';
import { Application } from './Application';
import { NUM_CICLES } from './model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'raytrace';
  @ViewChildren("canvases") canvases: QueryList<ElementRef<HTMLCanvasElement>>;
  
  @ViewChild('canvas', { static: true }) 
  canvas: ElementRef<HTMLCanvasElement>;
  ctx :CanvasRenderingContext2D;
  ctxs :CanvasRenderingContext2D[];
  constructor(private application:Application, 
    private ref: ChangeDetectorRef, 
    private ngZone: NgZone ){    
  }
  get counts()
  {
    return Array(10).map((_,i)=>i)
  }
  progress = 0;
  progressSubj = new Subject<number>();
  progressObj = this.progressSubj.asObservable();
  ngOnInit(): void {
    
    //this.drawRect();
    
    //this.application.initScene(this.ctx);

  }
  runText(textBox:any){
    this.application.textBox = textBox
    console.log(textBox);
    this.reload(-1)
  }
  reload(sceneNum:number){
    console.log("Reload", sceneNum)
    this.totalPerf.totalCicles+=this.n;
    this.totalPerf.startWith();
    this.perf.startWith();
    //this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    this.ctxs = this.canvases.map(c=>c.nativeElement.getContext('2d') as CanvasRenderingContext2D);
    var self = this;
    this.loading = true;
    this.ref.markForCheck();
    this.ref.detectChanges();
    this.rerenderProps[0]++;
    //this.progressSubj.next(10);
    //interval(1000).subscribe(i=>{
      this.localCount = 0;
    let run = ()=>{
      this.perf.reset()
      this.progress = 0;
      this.totalPerf.startWith();
      this.application.initScene(this.ctxs, sceneNum).subscribe(
        {

          //() => console.log('success'),
          //(error) => console.log('error', error),
          next:(        a: { i: number; j: number; })=>{
            
            this.ngZone.run(()=>{this.angularzoneRefresh(a)})
              
            },
                    error:(error)=>console.error("Error", error),
            complete:()=>{
              
              this.totalPerf.add();
              this.perfSummary = this.totalPerf.toPrint();
              console.log("Step", this.perfSummary, this.totalPerf)

              this.loading=false;
              ++this.count;
              if(++this.localCount <this.n) setTimeout(run, 10)
                      this.ref.detectChanges();
            }
          }
            );
    }
    setTimeout(run, 10)
    
    /*
    this.application.initScene(this.ctx, sceneNum)
    .subscribe(this.refresh.bind(this));
    */
  }
  angularzoneRefresh(a: any){      
    this.loading = false;
    this.progress++;
        this.refresh(a)
        this.ref.detectChanges();
  }
  loading = false;
  public rerenderProps: Array<number> = [1];
  count = 0;
  localCount = 0;
  n = NUM_CICLES;
  first = false;
  
  totalPerf = new PerfCount(0)
  perfSummary: { current: string; average: string; elapsed: string; estimate: string; remaining: string; } = this.totalPerf.toPrint();
  perf = new PerfCount(this.n)
  refresh(v:{i:number,j:number}){
    //if((v.i*100/v.j)%10 == 0)
    this.perf.totalCicles = v.j;
    this.perf.mark(v.i);
    {
      let perc = (v.i/v.j);
      this.progress = (perc*100);
      let pf=this.perf.toPrint()
      console.log("Pixel",{i:v.i, percentual:this.progress}, pf)
      if(this.first) {
        setTimeout(()=>{
          //console.log("PerfUpdate")
          this.totalPerf.average = this.perf.estimate;
          this.totalPerf.currentTimeEl = this.perf.timeElapsed;
          this.totalPerf.timeElapsed = this.perf.timeElapsed;
          this.totalPerf.estimate = this.totalPerf.average*this.totalPerf.totalCicles;
          this.totalPerf.remaining = this.totalPerf.estimate-this.totalPerf.timeElapsed;
          this.perfSummary = this.totalPerf.toPrint();
          this.ref.detectChanges();
        }, 100)


      }
      
      this.perf.startWith()
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
class PerfCount{
  startTime: number = 0;
  lastTime: number = 0;
  timeElapsed: number = 0;
  cicles:number = 0
  average: number = 0;
  remaining: number = 0;
  estimate: number = 0;
  currentTimeEl: number=0;
  constructor(public totalCicles:number){}
  reset()
  {
    //console.log("Reset")
    this.cicles=0;
    this.timeElapsed = 0;
  }
  toPrint(){
    return {
      current:pretty(this.currentTimeEl),
      average:pretty(this.average),
      elapsed:pretty(this.timeElapsed),
      estimate:pretty(this.estimate), 
      remaining:pretty(this.remaining), 
    }
      
      function pretty(time:number)
      {
        let tins = time/1000;
        return `${Math.floor(tins/60)}m e ${tins%60}s`
      }
  }
  startWith(){
    this.startTime = performance.now();
  }
  add(){
    this.mark(this.cicles+1);
  }
  mark(cicle:number){
    this.cicles = cicle;
    let nowTime = performance.now();
    this.currentTimeEl = nowTime-this.startTime;
    this.lastTime = nowTime;
    //console.log("Old", this.timeElapsed)
    this.timeElapsed = this.timeElapsed + this.currentTimeEl;
    //console.log("New", this.timeElapsed, this.currentTimeEl)
    this.average = this.timeElapsed/this.cicles;
    this.estimate = this.average * this.totalCicles;
    this.remaining = this.average * (this.totalCicles-this.cicles);
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
import React, { Component } from 'react';
import logo from './logo.svg';
import appstyle from './App.css';
import Wheel from './wheel';

class App extends Component {
  constructor(props) {
	super(props);
	this.state = {history:[],SpinStart:null};
	this.wheel = null;
	this.StartWheelTest = this.StartWheelTest.bind(this);
	this.AddResult = this.AddResult.bind(this);
  }
  
  componentDidMount() {
	/* Allows CSS to determine size of canvas */
	this.canvas.width = this.canvas.clientWidth;
	this.canvas.height = this.canvas.clientHeight;
	this.wheel = new Wheel(this.canvas, this.AddResult);
	
    this.canvas.addEventListener('mousedown', e => this.handleStart(e));
    this.canvas.addEventListener('mouseup', e => this.handleEnd(e));
    this.canvas.addEventListener('mousemove', e => this.handleMove(e));
    this.canvas.addEventListener('touchstart', e => this.handleStart(e));
    this.canvas.addEventListener('touchend', e => this.handleEnd(e));
    this.canvas.addEventListener('touchmove', e => this.handleMove(e));
  }	
  
  handleStart(evt){
	if(this.state.SpinStart != null) return;
	
	var SpinStart = {	time:new Date(),
					sx:evt.clientX,
					sy:evt.clientY,
					fx:0,
					fy:0,
					timerid:null,
	};
	if(evt.type === "mousedown"){
		SpinStart.sx = evt.clientX;
		SpinStart.sy = evt.clientY;
	}else if(evt.type === "touchstart"){
		SpinStart.sx = evt.targetTouches[0].pageX;
		SpinStart.sy = evt.targetTouches[0].pageY;
	} 
	
	this.setState({SpinStart:SpinStart});
  }
  
  handleEnd(evt){
	if(this.state.SpinStart == null) return;
	var SpinStart = this.state.SpinStart;
	clearTimeout(SpinStart.timerid);
	
	var xdist = Math.abs(SpinStart.fx - SpinStart.sx);
	var ydist = Math.abs(SpinStart.fy - SpinStart.sy);

	var CurrentTime = new Date();
	var mill = 3000 - (CurrentTime - SpinStart.time);
	if(mill < 0) mill = 0;
	else{
		mill = mill/3000;
	}
	
	//Set power level
	//1 min to 15 max
	var powerlevel = (mill) * 10 + xdist/this.canvas.width * 2.5 + ydist/this.canvas.height * 2.5
		
	this.wheel.animation.spins = powerlevel;
	this.wheel.startAnimation();
	this.setState({SpinStart:null});
  }
  
  handleMove(evt){
	if(this.state.SpinStart == null) return;

	var SpinStart = this.state.SpinStart;
	if(evt.type === "mousemove"){
		SpinStart.fx = evt.clientX;
		SpinStart.fy = evt.clientY;
	}else if(evt.type === "touchmove"){
		SpinStart.fx = evt.targetTouches[0].pageX;
		SpinStart.fy = evt.targetTouches[0].pageY;
	}
	
	clearTimeout(SpinStart.timerid);
	SpinStart.timerid = setTimeout(this.handleEnd,3000); 
	this.setState({SpinStart:SpinStart});
  }
  
  AddResult(value){
	var array = this.state.history;
	if(array.length > 4) array.slice(1);
	array.push(value);
	this.setState({history:array});
  }
    
  StartWheelTest(){
    this.wheel.animation.spins = 0.1;
	this.wheel.startAnimation();	
  }
  
  ListHistory(){
	return this.state.history.map((el, index) => <p key={index}>{el}</p>)
  }
  
  render() { 
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to Wheel Spin</h1>
        </header>
    
		<div className="App-WheelContianer">
			<button onClick={this.StartWheelTest}>Test</button>
			<img className="App-WheelMarker" src={require('./marker.png')} />
			<canvas style={{width:500,height:500}} ref={canvas => this.canvas = canvas} />
			<div className="App-WheelHistory">
				<p>History</p>
				<div>
				{this.ListHistory()}
				</div>
			</div>
		</div>
      </div>
    );
  }
}

export default App;

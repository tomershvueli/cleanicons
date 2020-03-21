import React, { Component } from 'react';
import './App.css';
import { Dropdown } from 'semantic-ui-react'
const icons = require("./utils/icons");

class App extends Component {

  constructor(props) {
    super(props);

    this.canvas = React.createRef();

    this.state = {
      icon: "star", // TODO random
      color: "#ff004f",
      size: "100px",
      transparentBg: true,
      bgColor: ""
    };

    this.drawCanvasContent = this.drawCanvasContent.bind(this);
    this.downloadIcon = this.downloadIcon.bind(this);
    this.handleSizeChange = this.handleSizeChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleBackgroundColorChange = this.handleBackgroundColorChange.bind(this);
    this.handleTransparentBgToggle = this.handleTransparentBgToggle.bind(this);
  }

  componentDidMount() {
    const font = '900 48px "Font Awesome 5 Free"';

    document.fonts.load(font).then((_) => {
      this.drawCanvasContent();
    });
  }

  faUnicode(name) {
    var testI = document.createElement('i');
    var char;
  
    testI.className = 'fa fa-' + name;
    document.body.appendChild(testI);
  
    char = window.getComputedStyle( testI, ':before' )
             .content.replace(/'|"/g, '');

    testI.remove();
  
    return char;
  }

  drawCanvasContent() {
    if (this.canvas.current) {
      console.log("drawing")
      const canvas = this.canvas.current;
      const ctx = canvas.getContext("2d");
      const canvasWidth = 1024;
      const canvasHeight = 1024;

      const font = `900 ${canvasWidth}px "Font Awesome 5 Free"`;
      const textString = this.faUnicode(this.state.icon),//'\uF063',
        textWidth = ctx.measureText(textString).width;

      // Clear canvas first
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      ctx.font = font;

      // Background
      if (!this.state.transparentBg) {
        ctx.fillStyle = this.state.bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // var data = "data:image/svg+xml,"+"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>" +
      //            "<foreignObject width='100%' height='100%'>" +
      //              "<div xmlns='http://www.w3.org/1999/xhtml' style='font-size:240px'>" +
      //                "<div xmlns='http://www.w3.org/1999/xhtml'>aaaa</div>" +
      //              "</div>" +
      //            "</foreignObject>" +
      //          "</svg>"
      //       ;

      //       var img = new Image();

      //       img.src = data;
            
      const dpr = window.devicePixelRatio;

      ctx.fillStyle = this.state.color;
      ctx.fillText(textString, (canvasWidth/2) - (textWidth / 2), canvasHeight - (canvasHeight / 8));
      // canvas.width = canvasWidth * window.devicePixelRatio;
      // canvas.height = canvasHeight * window.devicePixelRatio;
      ctx.scale = dpr;
      canvas.style.width = `${canvasWidth / dpr}px`;
      canvas.style.height = `${canvasHeight / dpr}px`;
      
  //     var img = new Image();
  //     img.onload = function() {
  //       console.log("loaded")
  //       const height = img.height; //600;
  //       const width = img.width; //600;
  //       // debugger
  //         // ctx.drawImage(img, 0, 0);
  //         ctx.imageSmoothingEnabled = false
  //         canvas.width = width * window.devicePixelRatio;
  // canvas.height = height * window.devicePixelRatio;
  // canvas.style.width = `${width}px`;
  // canvas.style.height = `${height}px`;
  // ctx.drawImage(
  //   img, 0, 0, 
  //   width * window.devicePixelRatio, 
  //   height * window.devicePixelRatio
  // );
  //     }

      // ctx.translate(canvas.width / 2, canvas.height / 2);
      //       ctx.scale(0.4, 0.4);
      // img.src = "http://localhost:3000/solid/ad.svg";
      // img.src = "https://upload.wikimedia.org/wikipedia/en/0/09/Circle_Logo.svg";
    }
  }

  downloadIcon(e) {
    e.preventDefault();

    const canvas = this.canvas.current;

    canvas.toBlob(function(blob) {
      // blob ready, download it
      let link = document.createElement('a');
      link.download = 'example.png';
  
      link.href = URL.createObjectURL(blob);
      link.click((e) => {
        e.preventDefault();
      });
  
      // delete the internal blob reference, to let the browser clear memory from it
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  }

  handleSizeChange(e) {
    this.setState({
      size: e.target.value
    });
  }

  handleColorChange(e) {
    this.setState({
      color: e.target.value
    });
  }

  handleBackgroundColorChange(e) {
    this.setState({
      bgColor: e.target.value
    });
  }

  handleTransparentBgToggle() {
    this.setState({
      transparentBg: !this.state.transparentBg
    });
  }

  render() {
    this.drawCanvasContent();

    return (
      <div className="App">
        <header className="App-header">
          CleanIcons.app
        </header>
        <div id="main-wrap">
          <div id="adjust-wrap" className="col">
            <form name="adjust-form" onSubmit={this.downloadIcon}>
              <label>
                Icon:
                {/* <Dropdown
                  placeholder='Select Icon'
                  fluid
                  search
                  selection
                  options={icons}
                /> */}
              </label>
              <label>
                Size:
                <input type="range" min="1" max="512" step="1" value={this.state.size} onChange={this.handleSizeChange} />
              </label>
              <label>
                Color:
                <input type="color" value={this.state.color} onChange={this.handleColorChange} />
              </label>
              <label>
                Background Color:
                <input type="checkbox" checked={this.state.transparentBg} onChange={this.handleTransparentBgToggle} />
                {!this.state.transparentBg &&
                  <input type="color" value={this.state.bgColor} onChange={this.handleBackgroundColorChange} />
                }
              </label>
              <input type="submit" value="Download!" />
            </form>
          </div>
          <div id="preview-wrap" className="col">
            <canvas id="canvas" width="1024" height="1024" ref={this.canvas}></canvas>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

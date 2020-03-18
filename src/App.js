import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
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

    // Chrome 76+ won't load the font
    // until it's needed by the ducument (i.e one of the characters is displayed)
    // or explicitely loaded through FontFaceSet API.
    document.fonts.load(font).then((_) => {
      this.drawCanvasContent();
    });
  }

  drawCanvasContent() {
    if (this.canvas.current) {
      console.log("drawing")
      const canvas = this.canvas.current;
      const ctx = canvas.getContext("2d");
      const canvasWidth = canvas.width;

      const font = `900 ${canvasWidth}px "Font Awesome 5 Free"`;
      const textString = '\uF063',
        textWidth = ctx.measureText(textString).width;

      // Clear canvas first
      ctx.clearRect(0, 0, canvasWidth, canvas.height);

      ctx.font = font;

      // Background
      if (!this.state.transparentBg) {
        ctx.fillStyle = this.state.bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvas.height);
      }

      ctx.fillStyle = this.state.color;
      ctx.fillText(textString, (canvasWidth/2) - (textWidth / 2), canvas.height - (canvas.height / 8));
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
              <label>Icon:</label>
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
            <canvas id="canvas" width={this.state.size} height={this.state.size} ref={this.canvas}></canvas>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

import React, { Component } from 'react';
import './App.css';
import Select, { createFilter, components } from 'react-select';

var opentype = require('opentype.js');

class App extends Component {

  constructor(props) {
    super(props);

    this.canvas = React.createRef();

    this.state = {
      icon: "glass-martini", // TODO random
      color: "#ff004f",
      size: "100px",
      transparentBg: true,
      fontFamily: "Font Awesome 5 Free",
      bgColor: "",
      unicode: "",
      icons: []
    };

    this.loadFonts = this.loadFonts.bind(this);
    this.drawCanvasContent = this.drawCanvasContent.bind(this);
    this.downloadIcon = this.downloadIcon.bind(this);
    this.handleIconChange = this.handleIconChange.bind(this);
    this.handleSizeChange = this.handleSizeChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleBackgroundColorChange = this.handleBackgroundColorChange.bind(this);
    this.handleTransparentBgToggle = this.handleTransparentBgToggle.bind(this);
  }

  componentDidMount() {
    const fontAwesomeRegular = '900 48px "Font Awesome 5 Free"';
    const fontAwesomeBrand = '900 48px "Font Awesome 5 Brands"';

    document.fonts.load(fontAwesomeRegular, fontAwesomeBrand).then((_) => {
      this.drawCanvasContent();
    });

    this.loadFonts();
  }

  async loadFonts() {
    const fonts = [await this.loadFont('fonts/fa-solid-900.ttf'), await this.loadFont('fonts/fa-brands-400.ttf')];

    let tempIcons = [];

    for (let font of fonts) {
      const fontFamily = font.names.preferredFamily.en;
      for (const glyph in font.glyphs.glyphs) {
        if (font.glyphs.glyphs.hasOwnProperty(glyph)) {
          const element = font.glyphs.glyphs[glyph];
          const baseClass = (fontFamily === 'Font Awesome 5 Free') ? 'fas' : 'fab';

          if (element.unicode) {
            // We're looking at a 'real' icon
            const icon = {
              key: element.id,
              value: element.name,
              label: element.name,
              fontFamily,
              unicode: element.unicode,
              icon: element.name,
              baseClass
            }
            tempIcons.push(icon);
          } 
        }
      }
    }

    tempIcons.sort((a, b) => a.value > b.value);

    this.setState({
      icons: tempIcons
    });
  }

  // Fix for opentype async/await, https://github.com/opentypejs/opentype.js/issues/406
  async loadFont(url) {
    return await new Promise(
      (resolve, reject) => opentype.load(
        url, (err, font) => err ? reject(err) : resolve(font)
      )
    )
  }

  formatUnicode(unicode) {
    unicode = unicode.toString(16);
    if (unicode.length > 4) {
        return ("000000" + unicode.toUpperCase()).substr(-6)
    } else {
        return ("0000" + unicode.toUpperCase()).substr(-4)
    }
  }

  drawCanvasContent() {
    if (this.canvas.current) {
      console.log("drawing")
      const canvas = this.canvas.current;
      const ctx = canvas.getContext("2d");
      const canvasWidth = 1024;
      const canvasHeight = 1024;

      const font = `900 ${canvasWidth}px "${this.state.fontFamily}"`;
      const textString = String.fromCharCode(parseInt(this.state.unicode, 16)),//this.faUnicode(this.state.icon),//'\uF063',
        textWidth = ctx.measureText(textString).width;

      // Clear canvas first
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      ctx.font = font;

      // Background
      if (!this.state.transparentBg) {
        ctx.fillStyle = this.state.bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const dpr = window.devicePixelRatio;

      ctx.fillStyle = this.state.color;
      ctx.fillText(textString, (canvasWidth/2) - (textWidth / 2), canvasHeight - (canvasHeight / 8));
      // canvas.width = canvasWidth * window.devicePixelRatio;
      // canvas.height = canvasHeight * window.devicePixelRatio;
      ctx.scale = dpr;
      canvas.style.width = `${canvasWidth / dpr}px`;
      canvas.style.height = `${canvasHeight / dpr}px`;
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

  handleIconChange(e) {
    const unicode = this.formatUnicode(e.unicode)
    this.setState({
      icon: e.value,
      fontFamily: e.fontFamily,
      unicode
    });
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

  customSingleValue(props) {
    delete props.innerProps.onMouseMove;
    delete props.innerProps.onMouseOver;
    const {data, innerProps, isFocused, ...otherProps} = props;
    const newProps = {innerProps: {...innerProps}, ...otherProps};
    return (
      <components.Option {...newProps} className="select-option">
        {props.children}{data.icon && <i className={`${data.baseClass} fa-${data.icon}`} />}
      </components.Option>
    );
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
                <Select
                  filterOption={createFilter({ ignoreAccents: false })} // this makes all the difference!
                  onChange={this.handleIconChange}
                  options={this.state.icons}
                  components={ {Option: this.customSingleValue } }
                />
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
              <i className="fas fa-star"></i>
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

import React, { Component } from 'react';
import './IconPreview.css';
import Select, { createFilter, components } from 'react-select';
import { Grid, Segment, Form, Button, Checkbox, Input, Label } from 'semantic-ui-react';

const opentype = require('opentype.js');

const MAX_CANVAS_SIZE = 1024;
const FONTS = [
  {
    preferredFamily: "Font Awesome 5 Free",
    fontFamily: "Font Awesome 5 Free Solid",
    path: "fonts/fa-solid-900.ttf",
    baseClass: "fas"
  },
  {
    preferredFamily: "Font Awesome 5 Brands",
    fontFamily: "Font Awesome 5 Brands Regular",
    path: "fonts/fa-brands-400.ttf",
    baseClass: "fab"
  }
];

class IconPreview extends Component {

  constructor(props) {
    super(props);

    this.canvas = React.createRef();

    this.state = {
      icon: { },
      color: "#ff0078",
      size: 512,
      margin: 20,
      transparentBg: true,
      bgColor: "#ffffff",
      icons: [],
      fontsLoaded: false
    };

    this.loadFonts = this.loadFonts.bind(this);
    this.drawCanvasContent = this.drawCanvasContent.bind(this);
    this.downloadIcon = this.downloadIcon.bind(this);
    this.handleIconChange = this.handleIconChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleTransparentBgToggle = this.handleTransparentBgToggle.bind(this);
  }

  componentDidMount() {
    const fontsLoadPromises = [];
    for (let font of FONTS) {
      const load = document.fonts.load(`900 48px "${font.preferredFamily}"`);
      fontsLoadPromises.push(load);
    }

    // Load up both fonts before we start to render the canvas
    const loadFonts = Promise.all(fontsLoadPromises);
    loadFonts.then((_) => {
      this.loadFonts();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.size === this.state.size) {
      this.drawCanvasContent();
    }
  }

  async loadFonts() {
    const fonts = [];
    for (let font of FONTS) {
      const load = await this.loadFont(font.path);
      fonts.push(load);
    }

    let tempIcons = [], defaultIcon;

    for (let font of fonts) {
      const fontFamily = font.names.fontFamily.en;
      const fontPreferred = font.names.preferredFamily.en;

      for (const glyph in font.glyphs.glyphs) {
        if (font.glyphs.glyphs.hasOwnProperty(glyph)) {
          const element = font.glyphs.glyphs[glyph];
          const baseClass = FONTS.find(font => font.fontFamily === fontFamily).baseClass;

          if (element.unicode) {
            // We're looking at a 'real' icon
            const icon = {
              ...element,
              key: element.index,
              value: element.name,
              label: element.name,
              fontFamily: fontPreferred,
              baseClass
            }
            tempIcons.push(icon);

            // Set our default 'font-awesome' glyph
            if (element.name === "font-awesome") {
              defaultIcon = icon;
            }
          } 
        }
      }
    }

    tempIcons.sort((a, b) => a.value > b.value);

    this.setState({
      icons: tempIcons,
      fontsLoaded: true,
      icon: defaultIcon
    });

    this.drawCanvasContent();
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

  drawCanvasContent(isDownloadCanvas = false) {
    let curCanvas;
    if (!isDownloadCanvas && this.canvas.current) {
      curCanvas = this.canvas.current;
    } else if (isDownloadCanvas) {
      curCanvas = document.createElement('canvas');
    }

    const { icon, size, margin, color, transparentBg, bgColor } = this.state;
    const dpr = window.devicePixelRatio;
    let canvasSize = document.getElementById("canvas-wrap").getBoundingClientRect().width * dpr;
    canvasSize = (canvasSize > MAX_CANVAS_SIZE) ? MAX_CANVAS_SIZE : canvasSize;

    if (curCanvas) {
      const ctx = curCanvas.getContext("2d");
      const canvasWidth = (isDownloadCanvas) ? size : canvasSize;
      const canvasHeight = canvasWidth;
      const marginMultiplier = (isDownloadCanvas) ? 1 : dpr;
      const sizeToMatch = canvasWidth - (margin * marginMultiplier * 2);
      curCanvas.width = curCanvas.height = canvasWidth;

      // Clear canvas first
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Background
      if (!transparentBg) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (!isDownloadCanvas) {
        // Create transparent 'checkered' background, only if it's the display canvas
        const patternCanvas = document.createElement('canvas');
        const patternContext = patternCanvas.getContext('2d');
        patternCanvas.width = 40;
        patternCanvas.height = 40;
        patternContext.fillStyle = "#d5d5d5";
        patternContext.fillRect(0,0,20,20);
        patternContext.fillRect(20,20,20,20);
        const pattern = ctx.createPattern(patternCanvas, "repeat");
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const textString = String.fromCharCode(parseInt(this.formatUnicode(icon.unicode), 16));

      const font = `900 ${sizeToMatch}px "${icon.fontFamily}"`;
      ctx.font = font;
      const measure = ctx.measureText(textString);

      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(textString, (canvasWidth/2) - (measure.width / 2), canvasHeight / 2);

      ctx.scale = dpr;
      curCanvas.style.width = `${canvasWidth / dpr}px`;
      curCanvas.style.height = `${canvasHeight / dpr}px`;

      // The returned canvas object will only be used by the downloadIcon method, otherwise ignored
      return curCanvas;
    }
  }

  downloadIcon(e) {
    e.preventDefault();

    const canvas = this.drawCanvasContent(true);
    const { icon, size, color } = this.state;
    const cleanColor = color.replace('#', '');
    const downloadFileName = `CleanIcons_${icon.value}_${size}px_${cleanColor}.png`;

    let link = document.createElement('a');
    link.download = downloadFileName;

    link.href = canvas.toDataURL("image/png")
    link.click((e) => {
      e.preventDefault();
    });

    // Delete the internal blob reference, to let the browser clear memory from it
    URL.revokeObjectURL(link.href);
  }

  handleIconChange(icon) {
    this.setState({
      icon
    });
  }

  handleInputChange(e) {
    const target = e.target;
    const { value, name } = target;
    this.setState({
      [name]: value
    });
  }

  handleTransparentBgToggle() {
    this.setState(prevState => ({
      transparentBg: !prevState.transparentBg
    }));
  }

  customOptionComponent(props) {
    delete props.innerProps.onMouseMove;
    delete props.innerProps.onMouseOver;
    const {data, innerProps, isFocused, ...otherProps} = props;
    const newProps = {innerProps: {...innerProps}, ...otherProps};
    return (
      <components.Option {...newProps} className="select-option">
        {props.children}
        {data.value && <span className="icon-wrap"><span className={`${data.baseClass} fa-${data.value}`} /></span>}
      </components.Option>
    );
  }

  render() {
    const { fontsLoaded, icons, icon, size, margin, color, transparentBg, bgColor } = this.state;

    return (
      <Grid columns={2} stackable>
        <Grid.Column>
          <Segment
            textAlign="left"
          >
            <Form name="adjust-form" onSubmit={this.downloadIcon} size="large" loading={!fontsLoaded}>
              <Form.Field>
                <label>
                  Icon:
                  <Select
                    loading={fontsLoaded}
                    filterOption={createFilter({ ignoreAccents: false })}
                    onChange={this.handleIconChange}
                    options={icons}
                    value={icon}
                    components={ {Option: this.customOptionComponent } }
                  />
                </label>
              </Form.Field>
              <Form.Field>
                <label>
                  Margin: <span id="icon-margin">{margin}px</span>
                  <Input type="range" min="-20" max="100" step="1" value={margin} name="margin" onChange={this.handleInputChange} />
                </label>
              </Form.Field>
              <Form.Field>
                  <Input label="Color:" type="text" className="color-input" value={color} name="color" onChange={this.handleInputChange}>
                    <Label color="teal">Color:</Label>
                    <input type="text" name="color" value={color} />
                    <input type="color" name="color" value={color} />
                  </Input>
              </Form.Field>
              <Form.Field>
                  <Checkbox checked={transparentBg} className="transparent-bg-input" onChange={this.handleTransparentBgToggle} label="Transparent Background" />
                  {!transparentBg &&
                    <Input label="Background Color:" type="text" className="color-input" value={bgColor} name="bgColor" onChange={this.handleInputChange}>
                      <Label color="teal">Background Color:</Label>
                      <input type="text" value={bgColor} />
                      <input type="color" value={bgColor} />
                    </Input>
                  }
              </Form.Field>
              <Form.Field>
                <Label color="teal" size="big">
                  Size: <span id="icon-size">{size}px<br /><small>Adjusting size won't update preview, and only affects the downloading of the icon.</small></span>
                  <Input type="range" name="size" min="32" max={MAX_CANVAS_SIZE} step="1" value={size} onChange={this.handleInputChange} />
                </Label>
              </Form.Field>
              <Form.Field inline className="center">
                <Button type="submit" size="big" color="teal">Download! <i className="fas fa-arrow-down" /></Button>
              </Form.Field>
            </Form>
          </Segment>
        </Grid.Column>
        <Grid.Column
          textAlign="center"
        >
          <div id="canvas-wrap">
            {fontsLoaded &&
              <canvas id="canvas" width={0} height={0} ref={this.canvas}></canvas>
            }
          </div>
        </Grid.Column>
      </Grid>
    );
  }
}

export default IconPreview;

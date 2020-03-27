import React, { Component } from 'react';
import './IconPreview.css';
import Select, { createFilter, components } from 'react-select';
import { Grid, Segment, Form, Button, Checkbox, Input, Label } from 'semantic-ui-react';

const opentype = require('opentype.js');

const CANVAS_SIZE = 1024;
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
    const boundingBoxX = icon.xMax - icon.xMin;
    const boundingBoxY = icon.yMax - icon.yMin;
    const tallerThanWide = boundingBoxY > boundingBoxX;

    if (curCanvas) {
      console.log("drawing")
      const ctx = curCanvas.getContext("2d");
      const canvasWidth = (isDownloadCanvas) ? size : CANVAS_SIZE;
      const canvasHeight = canvasWidth;
      const marginMultiplier = (isDownloadCanvas) ? 1 : dpr;
      const sizeToMatch = canvasWidth - (margin * marginMultiplier * 2);
      curCanvas.width = curCanvas.height = canvasWidth;
      let curFontSize = canvasWidth;

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

      let sizedToFit, textWidth, step = 5;

      do {
        const font = `900 ${curFontSize}px "${icon.fontFamily}"`;
        ctx.font = font;
        const measure = ctx.measureText(textString);
        textWidth = measure.width;
        if (measure.actualBoundingBoxRight) {
          // We're on a browser that supports bounding box
          if (tallerThanWide) {
            // Check that our y bounding box matches our height
            const yBoundingBox = Math.floor(measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent);
            const diff = yBoundingBox - sizeToMatch;
            if (Math.abs(diff) < 10) {
              // When we get closer to the actual size we need, let's lower the step
              // With a step of 1, there were some cases (backspace, school) where this would create an infinite loop between a bounding box size of 1023 and 1025, so half step :)
              step = .5;
            }
            if (diff < 0) {
              curFontSize += step;
            } else if (diff > 0) {
              curFontSize -= step;
            } else {
              sizedToFit = true;
            }
          } else {
            // Check that our x bounding box matches our width
            const xBoundingBox = Math.floor(measure.actualBoundingBoxRight + measure.actualBoundingBoxLeft);
            const diff = xBoundingBox - sizeToMatch;
            if (Math.abs(diff) < 10) {
              step = .5;
            }
            if (diff < 0) {
              curFontSize += step;
            } else if (diff > 0) {
              curFontSize -= step;
            } else {
              sizedToFit = true;
            }
          }
        } else {
          // We don't support bounding box, this is as good as we're gonna get
          sizedToFit = true;
        }
      } while (!sizedToFit);

      // TODO draw margin, be sure to fit to size, https://stackoverflow.com/questions/20551534/size-to-fit-font-on-a-canvas
      // https://jsfiddle.net/tomers13/km43p5bv/
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(textString, (canvasWidth/2) - (textWidth / 2), canvasHeight / 2);

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
    const downloadFileName = `CleanIcons_${icon.label}_${size}px_${cleanColor}.png`;

    canvas.toBlob(function(blob) {
      let link = document.createElement('a');
      link.download = downloadFileName;
  
      link.href = URL.createObjectURL(blob);
      link.click((e) => {
        e.preventDefault();
      });
  
      // Delete the internal blob reference, to let the browser clear memory from it
      URL.revokeObjectURL(link.href);
    }, 'image/png');
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
        <span className="icon-wrap">{data.label && <i className={`${data.baseClass} fa-${data.label}`} />}</span>
      </components.Option>
    );
  }

  render() {
    this.drawCanvasContent();

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
                  <Input type="range" min="0" max="100" step="1" value={margin} name="margin" onChange={this.handleInputChange} />
                </label>
              </Form.Field>
              <Form.Field>
                  <Input label="Color:" type="text" className="color-input" value={color} name="color" onChange={this.handleInputChange}>
                    <Label color="teal">Color:</Label>
                    <input type="text" value={color} />
                    <input type="color" value={color} />
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
                  <Input type="range" min="32" max={CANVAS_SIZE} step="1" value={size} name="size" onChange={this.handleInputChange} />
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
          {fontsLoaded &&
            <canvas id="canvas" width={0} height={0} ref={this.canvas}></canvas>
          }
        </Grid.Column>
      </Grid>
    );
  }
}

export default IconPreview;

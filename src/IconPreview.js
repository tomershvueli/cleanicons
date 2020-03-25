import React, { Component } from 'react';
import './IconPreview.css';
import Select, { createFilter, components } from 'react-select';
import { Grid, Segment, Form, Button, Checkbox, Input, Label } from 'semantic-ui-react';

const opentype = require('opentype.js');

class IconPreview extends Component {

  constructor(props) {
    super(props);

    this.canvas = React.createRef();

    this.state = {
      icon: {
        label: "font-awesome",
        unicode: "F2B4",
        fontFamily: "Font Awesome 5 Brands",
      },
      color: "#ff004f",
      size: 512,
      margin: 0,
      transparentBg: true,
      bgColor: "#ffffff",
      icons: [],
      fontsLoaded: false
    };

    this.loadFonts = this.loadFonts.bind(this);
    this.drawCanvasContent = this.drawCanvasContent.bind(this);
    this.downloadIcon = this.downloadIcon.bind(this);
    this.handleIconChange = this.handleIconChange.bind(this);
    this.handleSizeChange = this.handleSizeChange.bind(this);
    this.handleMarginChange = this.handleMarginChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleBackgroundColorChange = this.handleBackgroundColorChange.bind(this);
    this.handleTransparentBgToggle = this.handleTransparentBgToggle.bind(this);
  }

  componentDidMount() {
    const fontAwesomeRegular = '900 48px "Font Awesome 5 Free"';
    const fontAwesomeBrand = '900 48px "Font Awesome 5 Brands"';

    document.fonts.load(fontAwesomeRegular, fontAwesomeBrand).then((_) => {
      this.setState({
        fontsLoaded: true
      });

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
              ...element,
              key: element.id,
              value: element.name,
              label: element.name,
              fontFamily,
              unicode: element.unicode,
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

  drawCanvasContent(isDownloadCanvas = false) {
    let curCanvas;
    if (!isDownloadCanvas && this.canvas.current) {
      curCanvas = this.canvas.current;
    } else if (isDownloadCanvas) {
      curCanvas = document.createElement('canvas');
    }

    const { icon, size, color, transparentBg, bgColor } = this.state;
    const boundingBoxX = icon.xMax - icon.xMin;
    const boundingBoxY = icon.yMax - icon.yMin;
    const tallerThanWide = boundingBoxY > boundingBoxX;

    if (curCanvas) {
      console.log("drawing")
      const ctx = curCanvas.getContext("2d");
      const canvasWidth = (isDownloadCanvas) ? size : 1024;
      const canvasHeight = (isDownloadCanvas) ? size : 1024;
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

      const dpr = window.devicePixelRatio;

      const textString = String.fromCharCode(parseInt(icon.unicode, 16));

      let sizedToFit, textWidth, canvasHeightOffset = 0, step = 5;

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
            const diff = yBoundingBox - canvasHeight;
            if (Math.abs(diff) < 10) {
              step = .5;
            }
            if (diff < 0) {
              curFontSize += step;
            } else if (diff > 0) {
              curFontSize -= step;
            } else {
              // canvasHeightOffset = yBoundingBox / 2;
              sizedToFit = true;
            }
          } else {
            // Check that our x bounding box matches our width
            const xBoundingBox = Math.floor(measure.actualBoundingBoxRight + measure.actualBoundingBoxLeft);
            const diff = xBoundingBox - canvasWidth;
            if (Math.abs(diff) < 10) {
              step = .5;
            }
            if (diff < 0) {
              curFontSize += step;
            } else if (diff > 0) {
              curFontSize -= step;
            } else {
              canvasHeightOffset = icon.yMin / 2;
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
      const yPos = canvasHeight - (canvasHeight / 8) - canvasHeightOffset;
      ctx.fillText(textString, (canvasWidth/2) - (textWidth / 2), yPos);

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
    const downloadFileName = `CleanIcons_${icon}_${size}px_${cleanColor}.png`;

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
    const unicode = this.formatUnicode(icon.unicode);
    this.setState({
      icon: {
        ...icon,
        unicode
      }
    });
  }

  handleSizeChange(e) {
    this.setState({
      size: e.target.value
    });
  }

  handleMarginChange(e) {
    this.setState({
      margin: e.target.value
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
                    filterOption={createFilter({ ignoreAccents: false })}
                    onChange={this.handleIconChange}
                    options={icons}
                    defaultInputValue={icon.label}
                    components={ {Option: this.customOptionComponent } }
                  />
                </label>
              </Form.Field>
              <Form.Field>
                <label>
                  Size: <span id="icon-size">{size}px</span>
                  <Input type="range" min="32" max="1024" step="1" value={size} onChange={this.handleSizeChange} />
                </label>
              </Form.Field>
              <Form.Field hidden>
                <label>
                  Margin: <span id="icon-margin">{margin}px</span>
                  <Input type="range" min="0" max="50" step="1" value={margin} onChange={this.handleMarginChange} />
                </label>
              </Form.Field>
              <Form.Field>
                  <Input label="Color:" type="text" className="color-input" value={color} onChange={this.handleColorChange}>
                    <Label>Color:</Label>
                    <input type="text" value={color} />
                    <input type="color" value={color} />
                  </Input>
              </Form.Field>
              <Form.Field>
                  <Checkbox checked={transparentBg} className="transparent-bg-input" onChange={this.handleTransparentBgToggle} label="Transparent Background" />
                  {!transparentBg &&
                    <Input label="Background Color:" type="text" className="color-input" value={bgColor} onChange={this.handleBackgroundColorChange}>
                      <Label>Background Color:</Label>
                      <input type="text" value={bgColor} />
                      <input type="color" value={bgColor} />
                    </Input>
                  }
              </Form.Field>
              <Form.Field inline className="center">
                <Button type="submit" size="big" color="teal">Download! <i className="fas fa-arrow-down" /></Button>
              </Form.Field>
            </Form>
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <canvas id="canvas" width="1024" height="1024" ref={this.canvas}></canvas>
        </Grid.Column>
        <Segment>
        All 3rd party brands, trademarks, trade-, product- and corporate-names, logos and other properties belong to their respective owners. By using our services, you agree not to violate any licenses and copyright laws.
        </Segment>
      </Grid>
    );
  }
}

export default IconPreview;

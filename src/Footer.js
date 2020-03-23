import React, { Component } from 'react';
import './Footer.css';

const worlds = ["🌍", "🌏", "🌎"];

class Footer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      worldIndex: 0
    };

    this.spinTheGlobe = this.spinTheGlobe.bind(this);
  }

  componentDidMount() {
    this.spinTheGlobeTimer = setInterval(this.spinTheGlobe, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.spinTheGlobeTimer);
  }

  spinTheGlobe() {
    this.setState((prevState) => ({
      worldIndex: prevState.worldIndex === (worlds.length - 1) ? 0 : prevState.worldIndex + 1
    }));
  }

  render() {
    return (
      <footer>
        <p>
          Made by <a href="http://tomer.shvueli.com?ref=cleanicons" target="_blank" rel="noopener noreferrer">Tomer</a> from all around the <a href="http://wherethehellaretomerandmichelle.com?ref=cleanicons" target="_blank" rel="noopener noreferrer"><span role="img" aria-label="World">{worlds[this.state.worldIndex]}</span></a>
        </p>
      </footer>
    );
  }
}
export default Footer;
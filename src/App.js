import React, { Component } from 'react';
import { Header, Container } from 'semantic-ui-react';
import './App.css';

import IconPreview from './IconPreview';
import Footer from './Footer';

class App extends Component {

  render() {
    return (
      <div className="App">
        <Container>
          <Header
            id="app-header"
            as="h1"
            textAlign="left"
            dividing
          >
            <i className="fas fa-adjust" />leanIcons
          </Header>
          <IconPreview />
        </Container>
        <Footer />
      </div>
    );
  }
}

export default App;

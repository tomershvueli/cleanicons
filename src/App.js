import React, { Component } from 'react';
import { Header, Container, Menu } from 'semantic-ui-react';
import './App.css';

import IconPreview from './IconPreview';
import Footer from './Footer';

class App extends Component {

  render() {
    return (
      <div className="App">
        <Container
          id="app-header"
        >
          <Menu pointing secondary>
            <Menu.Item header>
              <Header
                id="brand"
                textAlign="left"
                as="h1"
              >
                <i className="fas fa-adjust" />leanIcons
              </Header>
            </Menu.Item>
            <Menu.Menu position='right'>
              <Menu.Item
                name="github-link"
                id="github-link-wrap"
              >
                <a href="https://github.com/tomershvueli/cleanicons">
                  <i className="fab fa-github"></i>
                </a>
              </Menu.Item>
            </Menu.Menu>
          </Menu>
          <IconPreview />
        </Container>
        <Footer />
      </div>
    );
  }
}

export default App;

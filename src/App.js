import React, { Component } from 'react';
import { Header, Container, Menu, Segment } from 'semantic-ui-react';
import './App.css';

import IconPreview from './IconPreview';
import KoFi from './KoFi';
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
                Cleanicons
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
              <Menu.Item>
                <KoFi color="#00b5ad" id="D1D41JRJE" label="Buy me a Coffee" />
              </Menu.Item>
            </Menu.Menu>
          </Menu>
          <IconPreview />
          <Segment>
            All 3rd party brands, trademarks, trade-, product- and corporate-names, logos and other properties belong to their respective owners. By using this service, you agree not to violate any licenses and copyright laws.
          </Segment>
        </Container>
        <Footer />
      </div>
    );
  }
}

export default App;

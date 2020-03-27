import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'

// Only track analytics in production
if (process.env.NODE_ENV === 'production') {
  const instance = createInstance({
    urlBase: "https://analytics.brillicity.com/",
    siteId: 11,
  });

  ReactDOM.render(
    <MatomoProvider value={instance}>
      <App env={process.env.NODE_ENV} />
    </MatomoProvider>,
    document.getElementById('root')
  );
} else {
  ReactDOM.render(
    <App env={process.env.NODE_ENV} />,
    document.getElementById('root')
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

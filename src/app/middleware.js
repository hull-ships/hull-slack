// @flow

import { applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import loggerMiddleware from 'redux-logger';

// import createRavenMiddleware from 'raven-for-redux';

// const trackingMiddleware = () => next => action => {
//   trackFSAction(action);
//   return next(action);
// };

export default applyMiddleware(
  thunkMiddleware,
  promiseMiddleware,
  loggerMiddleware
);

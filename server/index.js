import express       from 'express';
import bodyParser    from 'body-parser';
import path          from 'path';

import notificationsHandler  from 'hull/lib/notif-handler';

import updateUser    from './update-user';
import updateSegment from './update-segment';

const handler = notificationsHandler({
  events: {
    'user_report:update' : updateUser,
    'users_segment:update' : updateSegment
  }
});
 
module.exports = function(config={}) {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.post('/notify', handler);
  app.use(express.static(path.resolve(__dirname, '..', 'dist')));
  app.use(express.static(path.resolve(__dirname, '..', 'assets')));
  app.get('/manifest.json', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '..', 'manifest.json'));
  });
  app.listen(config.port)

  return app;
}




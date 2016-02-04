import { resolve } from 'path';
import { readFileSync } from 'fs';
import minimist from 'minimist';

module.exports = function config(env=process.env, options=minimist(process.argv)) {

  var defaults = {
    port: env.PORT || 8082
  };

  var cfg = {}, filename = options.f || env.CONFIG_FILE;

  if (filename) {
    cfg = JSON.parse(readFileSync(resolve(filename)));
  }

  return {...defaults, ...cfg};
}

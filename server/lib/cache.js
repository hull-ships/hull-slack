const cache = {};

const TTL = 1000 * 900; // 15min

function expired(d) {
  if (!d) { return true; }
  return new Date().getTime() > d + TTL;
}

export default function (id, string, hull) {
  if (!string || !id || !hull) {
    let message = '';
    if (!string) { message += ' No String'; }
    if (!id) { message += 'No Id'; }
    if (!hull) { message += 'No Hull'; }
    return Promise.reject(new Error(`Invalid Config ${message}`));
  }
  const cacheKey = `${id}-${string}`;
  const cached = cache[cacheKey];

  if (cached && !expired(cached.d)) {
    return Promise.resolve(cached.res);
  }

  return hull.get(string).then((res) => {
    cache[cacheKey] = { d: new Date().getTime(), res };
    return res;
  });
}

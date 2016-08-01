import queries from "./queries";

/**
 * return { events, pagination }
*/
module.exports = function fetchEvent({ hull, search }) {
  const { id } = search;
  let params = {};

  params = queries.eventId(id);

  console.log('FETCHING', search)
  return hull.post("search/events", params)
  .then(({ pagination = {}, data = [] }) => {
    console.log('FETCHING RESPONSE', data)
    if (!data.length) return Promise.reject();
    return { events: data, pagination };
  }, (err) => console.log(err));
};

import Hull from "hull";
import _ from "lodash";
import fetchEvent from "../hull/fetch-event";
import fetchUser from "../hull/fetch-user";
import formatEventProperties from "../lib/format-event-properties";
import userPayload from "../lib/user-payload";

module.exports = function interactiveMessage(bot, message) {
  const { actions, callback_id, original_message } = message;
  const [action] = actions;
  const { name, value } = action;
  const hull = new Hull(bot.config.hullConfig);
  if (name === "trait") {
    try {
      hull.as(callback_id).traits(JSON.parse(value));
      bot.reply(message, "User Updated :thumbsup:");
    } catch (e) {
      console.log(e);
    }
  } else if (name === "expand") {
    if (value === "event") {
      const index = _.findIndex(original_message.attachments, a => a.callback_id === callback_id);
      const attachement = { ...original_message.attachments[index] };
      const attachments = [...original_message.attachments];
      attachments[index] = attachement;
      return fetchEvent({ hull, search: { id: callback_id } })
      .then(({ events }) => {
        const [event = {}] = events;
        const { props } = event;
        attachement.fields = formatEventProperties(props);
        attachement.actions = [];
        bot.replyInteractive(message, { ...original_message, attachments });
      }).
      catch(err => console.log(err));
    }

    if (value === "traits" || value === "events") {
      return fetchUser({ hull, search: { id: callback_id } })
      .then((results) => bot.replyInteractive(message, userPayload({ ...results, hull, group: value })));
    }
  }
  return true;
};


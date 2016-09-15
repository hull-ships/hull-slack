import _ from "lodash";
import getTeamChannels from "./get-channels";

function inviteBot(bot, token, channel) {
  const user = bot.config.bot_id;
  return bot.api.channels.invite({ token, channel, user })
  .then((botRes) => {
    console.log("Invite Bot", botRes);
    return channel;
  }, err => {
    console.log("Invite Bot error", err);
    return channel;
  });
}
function createChannels(bot, token, channelsToJoin = []) {
  return _.map(channelsToJoin, channel => {
    const { name } = channel;
    return bot.api.channels.create({ token, name })
    .then(() => channel.id);
  });
}

function getNotifyChannels(teamChannels, notifyChannelsNames) {
  return _.filter(teamChannels, channel => _.includes(notifyChannelsNames, channel.name));
}

function getBotChannels(teamChannels) {
  return _.filter(teamChannels, { is_member: true });
}

function getChannelsToJoin(teamChannels, notifyChannels) {
  return _.filter(teamChannels, channel => (_.includes(notifyChannels, channel.name) && channel.is_member === false));
}


export default function ({ hull, bot, notifyChannelNames, token }) {
  return getTeamChannels(bot)
  .then(teamChannels => {
    const notifyChannels = getNotifyChannels(teamChannels, notifyChannelNames);
    const channelsToJoin = getChannelsToJoin(teamChannels, notifyChannelNames);

    hull.logger.debug("slack.getTeamChannels.setup", { notifyChannels, channelsToJoin });

    function _inviteBot() {
      return Promise
      .all(_.map(notifyChannels, channel => inviteBot(bot, token, channel.id)))
      .catch(err => hull.logger.error("slack.bot.invite.error", { message: err.message }));
    }

    return Promise
    .all(createChannels(bot, token, channelsToJoin))

    .then(
      () => _inviteBot
      , err => {
        hull.logger.error("slack.createChannels.error", { message: err.message });
        return _inviteBot();
      }
    )

    .then(
      () => teamChannels
      , err => {
        hull.logger.error("slack.inviteBot.error", { message: err.message });
        console.log(err);
        return teamChannels;
      }
    );
  }, err => hull.logger.error("slack.getTeamChannels.error", { message: err.message }));
}

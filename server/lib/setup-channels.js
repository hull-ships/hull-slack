import _ from "lodash";
import getTeamChannels from "./get-team-channels";

function inviteBot(bot, token, channels) {
  const user = bot.config.bot_id;
  return Promise.all(_.map(channels, (channel) => {
    return new Promise((resolve, reject) => {
      bot.api.channels.invite({ token, channel: channel.id, user }, function inviteDone(err) {
        if (err) return reject(err);
        return resolve(channel);
      });
    });
  }));
}

function createChannels(bot, token, channelsToJoin = []) {
  return Promise.all(_.map(channelsToJoin, (name) => {
    return new Promise((resolve, reject) => {
      bot.api.channels.create({ token, name }, function channelCreated(err, channel = {}) {
        if (err) return reject(err);
        return resolve(channel.id);
      });
    });
  }));
}

function getNotifyChannels(teamChannels, notifyChannelsNames) {
  return _.filter(teamChannels, channel => _.includes(notifyChannelsNames, channel.name));
}

function getChannelsToJoin(teamChannels, channels) {
  return _.filter(teamChannels, channel => (_.includes(channels, channel.name) && channel.is_member === false));
}

function getChannelsToCreate(teamChannels, channels) {
  return _.filter(channels, channel => !_.includes(_.map(teamChannels, 'name'), channel));
}


export default function ({ hull, bot, app_token, channels }) {
  return getTeamChannels(bot)
  .then((teamChannels) => {
    const notifyChannels = getNotifyChannels(teamChannels, channels);
    const channelsToJoin = getChannelsToJoin(teamChannels, channels);
    const channelsToCreate = getChannelsToCreate(teamChannels, channels);

    hull.logger.info("channelSetup.start", { channels, teamChannels: _.map(teamChannels, 'id'), notifyChannels, channelsToJoin });

    return createChannels(bot, app_token, channelsToCreate)
    .catch(err => hull.logger.error("channelSetup.create.error", { error: err }))

    .then(() => inviteBot(bot, app_token, channelsToJoin))
    .catch(err => hull.logger.error("channelSetup.invite.error", { error: err }))

    .then(() => teamChannels);
  }, err => hull.logger.error("channelSetup.error", { error: err }));
}

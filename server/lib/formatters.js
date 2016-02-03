import _ from 'lodash';
import ObjectID from "bson-objectid";
import humanize from './humanize';

function noop(value){
  return value;
}

function getFormatter(f, trait){
  return _.find((f.format||{}), (o)=>{ return o.pattern.test(trait); }) || noop;
}

function fromPrefix(group, prefix, fallback='User Details'){
  return (_.find(group, { prefix })||{}).name || fallback;
}


module.exports = {

  resolve(groups={}, hull, f, formatter={}){
    const { group } = formatter;
    const groupNameFromPrefix = fromPrefix.bind(null, group||{});
    return _.map(groups, (fields, name)=>{
      if(ObjectID.isValid(name)){
        return hull.get(name).then((section={})=>{
          return f(fields, `${humanize(section.type)}: ${section.name}`);
        }, (err)=>{
          console.log('err', err);
        });
      }
      return Promise.resolve(f(fields, groupNameFromPrefix(name)));
    });
  },

  reduce(user, f){
    return _.reduce(user, function(groups, value, trait){
      if(f.hide && f.hide.test(trait)) { return groups; }

      const key = trait.split('_')[0];
      let name;
      let hide;
      if (ObjectID.isValid(key)){
        name = key;
        trait = trait.replace(`${key}_`, '')
      } else {
        const { prefix, name, hide } = _.find((f.group||[]), (o)=>{ return trait.indexOf(`${o.prefix}_`)===0; }) || {};
        if (!!hide) { return groups };
        if (!!prefix) { trait = trait.replace(`${prefix}_`, '') }  //means we found a valid group
      }

      if (!name) { name = 'user' }

      trait = f.rename && f.rename[trait] || trait;

      _.set(groups, `${name}.${humanize(trait)}`, getFormatter(trait)(value));
      return groups;
    }, {});
  }
}

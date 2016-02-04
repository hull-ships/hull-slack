import _ from 'lodash';
import ObjectID from "bson-objectid";
import humanize from './humanize';

function noop(value){
  return value;
}

function getFormatter(f, trait){
  return (_.find((f.format||{}), (o)=>{
      return o.pattern.test(trait);
    })||{}).format || noop;
}

module.exports = {
  resolve(groups={}, hull, f){
    return _.map(groups, (fields, name)=>{
      if(ObjectID.isValid(name)){
        return hull.get(name).then((section={})=>{
          return f(fields, name, section);
        }, (err)=>{
          console.log('err', err);
        });
      }
      return Promise.resolve(f(fields, name));
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

      _.set(groups, `${name}.${trait}`, getFormatter(f, trait)(value));
      return groups;
    }, {});
  }
}

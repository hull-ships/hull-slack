// @flow
/* eslint-disable no-use-before-define */

export type Group = {};

export type Account = {
  domain: string,
  external_id: string,
  traits: Group
};

export type User = {
  first_name: string,
  last_name: string,
  domain: string,
  email: string,
  external_id: string,
  id: string,
  last_seen_at: string,
  traits: Group,
  picture: string
};

export type Subject = User | Account;

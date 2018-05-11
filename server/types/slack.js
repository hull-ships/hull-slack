// @flow
/* eslint-disable no-use-before-define */
export type Field = {
  title: string,
  value: string,
  short: boolean
};

export type Attribute = {
  author_name?: string,
  mrkdwn_in?: Array<string>,
  color?: string,
  text?: string,
  fallback?: string,
  fields?: ?Array<Field> | null
};

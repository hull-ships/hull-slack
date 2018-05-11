// @flow

// import type {
//   THullAccountAttributes,
//   THullAccountIdent,
//   THullAccount,
//   THullAttributeName,
//   THullAttributeValue,
//   THullAttributesChanges,
//   THullConnector,
//   THullEvent,
//   THullObjectAttributes,
//   THullObjectIdent,
//   THullObject,
//   THullReqContext,
//   THullRequest,
//   THullSegment,
//   THullSegmentsChanges,
//   THullUserAttributes,
//   THullUserChanges,
//   THullUserIdent,
//   THullUserUpdateMessage,
//   THullUser,
// } from "hull";

/* Outgoing messages */
export type Transaction = {|
  action: "success" | "skip" | "error",
  message: string,
  id: string,
  type: "user" | "account",
  data: {}
|};

export type TraitsPayload = {};

export type TraitsContext = {
  source: string
};

export type Claim = {
  id?: string,
  external_id?: string
};

export type UserClaim = Claim & {
  email?: string,
  anonymous_id: string | Array<string>
};
export type AccountClaim = Claim & {
  domain?: string
};

export type ShipSettings = { [string]: any };

export type Ship = {
  id?: string,
  private_settings: ShipSettings,
  settings?: ShipSettings
};

export type SmartNotifierResponse = {
  in: Number,
  at: Number
} & (
  | {
      type: "next",
      size: Number
    }
  | {
      type: "reply"
    }
);
export type AttributeValue =
  | string
  | null
  | number
  | boolean
  | Array<AttributeValue>;
export type Segment = {
  name: string,
  id: string
};

export type Account = {
  [attribute_name: string]: AttributeValue,
  id: string,
  external_id?: string,
  domain?: string
};
export type User = {
  [attribute_name: string]: AttributeValue,
  id: string,
  external_id?: string,
  "traits_group/id"?: string,
  domain?: string,
  domain?: string,
  email: string | null,
  anonymous_id: Array<string>,
  account: {}
};

export type Subject = User | Account;

export type EventContext = {
  location?: {},
  page?: {
    referrer?: string
  },
  referrer?: {
    url: string
  },
  os?: {},
  useragent?: string,
  ip?: string | number
};
export type Event = {
  name: string,
  anonymous_id: string | null,
  event_id: string,
  created_at: string,
  event_source: string,
  event: string,
  context: EventContext,
  properties: {
    [string]: AttributeValue
  }
};
export type ChangeObject = [AttributeValue, AttributeValue];

export type Changes = {
  user: {
    [string]: ChangeObject
  },
  account: {
    [string]: ChangeObject
  },
  segments: {
    [string]: ChangeObject
  }
};

export type Configuration = {|
  id: string,
  secret: string,
  organization: string
|};

type LoggerMethod = (logger: string, data?: any) => void;

type Logger = {
  log: LoggerMethod,
  info: LoggerMethod,
  debug: LoggerMethod,
  error: LoggerMethod
};

type HullConnectorOptions = {
  hostSecret: string,
  port: number
};

type MiddlewareConfig = {
  hostSecret: string,
  fetchShip?: boolean,
  cacheShip?: boolean
};

export type Client = {
  configuration: () => Configuration,
  logger: Logger,
  asUser: UserClaim => Client & {
    track: (string, {}) => void,
    traits: (TraitsPayload, ?TraitsContext) => void,
    account: AccountClaim => Client
  },
  asAccount: AccountClaim => Client & {
    traits: (TraitsPayload, ?TraitsContext) => void
  }
};

export type Hull = Configuration => Client;
// Connector: HullConnectorOptions => any,
// Middleware: MiddlewareConfig => void

export type Message = {};

export type Context = {
  smartNotifierResponse?: {
    setFlowControl: SmartNotifierResponse => void
  },
  metric: {
    increment: (metric: string, count?: number) => void
  },
  ship: Ship,
  client: Client
};
export type AccountMessage = {
  account_segments: Array<Segment>,
  account: Account
};
export type UserMessage = {
  changes: Changes,
  user_segments: Array<Segment>,
  events: Array<Event>,
  user: User,
  account: Account | {}
};

export type Bot = {};

export type ConnectSlackParams = {|
  hull: Hull,
  ship: Ship,
  force?: boolean
|};

export type ServerOptions = {
  hostSecret: string,
  clientID: string,
  clientSecret: string,
  devMode: boolean,
  port: number | string,
  ngrok: {
    subdomain: string
  },
  Hull: Hull,
  clientConfig: {
    firehoseUrl: ?string
  }
};

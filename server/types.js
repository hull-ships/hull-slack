// @flow

export type Bot = {};

export type ServerOptions = {
  port: number,
  hostSecret: string,
  clientID: string,
  clientSecret: string,
  Hull: Hull,
  devMode: boolean,
};

export type SmartNotifierResponse = {|
  type: "next" | "retry",
  in: number,
  inTime: number,
  size: number,
|};

export type HullConfiguration = {|
  id: string,
  secret: string,
  organization: string,
|};

export type ShipSettings = { [string]: any };

export type Ship = {
  id?: string,
  private_settings: ShipSettings,
  settings?: ShipSettings,
};

export type HullConnectorOptions = {
  port: number,
  hostSecret: string,
};

export type User = {
  id: string,
};

export type Hull = HullConfiguration => HullClient;

export type UserClaim = {
  id?: string,
  email?: string,
  anonymous_id?: string,
};

export type AccountClaim = {
  id?: string,
  domain?: string,
  anonymous_id?: string,
};

export type LoggerMethod = (logger: string, data?: {}) => void;

export type Logger = {
  log: LoggerMethod,
  info: LoggerMethod,
  debug: LoggerMethod,
  error: LoggerMethod,
};

export type HullClient = {
  Middleware: ({
    hostSecret: string,
    fetchShip?: boolean,
    cacheShip?: boolean,
  }) => void,
  Connector: HullConnectorOptions => any,
  configuration: () => HullConfiguration,
  logger: Logger,
  asUser: UserClaim => HullUserClient,
  asAccount: AccountClaim => HullAccountClient,
};

export type HullAccountClient = HullClient & {
  traits: (properties: {}, context: {}) => void,
};

export type HullUserClient = HullClient & {
  track: (name: string, properties: {}, context: {}) => void,
  traits: (properties: {}, context: {}) => void,
  account: AccountClaim => HullAccountClient,
};

export type HullContext = {
  client: Hull,
  ship: Ship,
  smartNotifierResponse: {
    setFlowControl: SmartNotifierResponse => void,
  },
  metric: {
    increment: (metric: string, count?: number) => void,
  },
};

export type ConnectSlackParams = {|
  hull: Hull,
  ship: Ship,
  force?: boolean,
|};

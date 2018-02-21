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

export class Hull {
  constructor(config: HullConfiguration) {}
  Middleware: ({
    hostSecret: string,
    fetchShip?: boolean,
    cacheShip?: boolean,
  }) => void;
  Connector: HullConnectorOptions => any;
  configuration: () => HullConfiguration;
  logger: {
    info: LoggerMethod,
    debug: LoggerMethod,
    error: LoggerMethod,
  };
  asUser: User => Hull;
}

export type LoggerMethod = (string, ?{}) => void;

export type HullContext = {
  client: Hull,
  ship: Ship,
  smartNotifierResponse: {
    setFlowControl: SmartNotifierResponse => void,
  },
  metric: {
    increment: (string, ?number) => void,
  },
};

export type ConnectSlackParams = {|
  hull: Hull,
  ship: Ship,
  force?: boolean,
|};

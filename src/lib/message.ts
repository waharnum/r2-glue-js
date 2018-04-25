const PROTOCOL_NAME = 'r2-glue-js';
const PROTOCOL_VERSION = '1.0.0';

export interface IMessage {
  readonly protocol?: string;
  readonly version?: string;
  readonly namespace?: string;
  // tslint:disable-next-line:no-reserved-keywords
  readonly type: string;
  readonly parameters: {}[];
  readonly transitId?: string;
}

export class Message implements IMessage {
  // tslint:disable-next-line:no-reserved-keywords
  public readonly type: string;
  public readonly parameters: {}[];
  public readonly protocol: string;
  public readonly version: string;
  public readonly transitId?: string;

  // tslint:disable-next-line:no-reserved-keywords
  constructor(message: IMessage, transitID?: string) {
    this.type = message.type;
    this.parameters = message.parameters;
    this.protocol = PROTOCOL_NAME;
    this.version = PROTOCOL_VERSION;
    this.transitId = transitID;
  }

  public static validate(message: IMessage): boolean {
    return !!message.protocol && message.protocol === name;
  }
}

export interface IMessageEvent extends MessageEvent {
  readonly data: IMessage;
}
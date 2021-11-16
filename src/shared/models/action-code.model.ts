import { Decorator, Query, Table } from '@serverless-seoul/dynamorm';

export interface IToken {
  code: string;
  action: string;
  ttl: number;
  data?: unknown;
}

@Decorator.Table({
  name: `STIToken.${process.env.STAGE || 'dev'}`,
})
export class TokenModel extends Table implements IToken {
  @Decorator.HashPrimaryKey('code')
  public static readonly primaryKey: Query.HashPrimaryKey<TokenModel, string>;

  @Decorator.FullGlobalSecondaryIndex('action', 'source')
  public static readonly ActionIndex: Query.FullGlobalSecondaryIndex<
    TokenModel,
    string,
    string
  >;

  @Decorator.Writer()
  public static readonly writer: Query.Writer<TokenModel>;

  @Decorator.Attribute({ name: 'code' })
  public code: string;

  @Decorator.Attribute({ name: 'action' })
  public action: string;

  @Decorator.Attribute({ name: 'source' })
  public source: string;

  @Decorator.Attribute({ name: 'ttl' })
  public ttl: number;

  @Decorator.Attribute({ name: 'seq' })
  public seq: number;

  @Decorator.Attribute({ name: 'data' })
  public data: unknown;

  @Decorator.Attribute({ name: 'lastUpdatedAt' })
  public lastUpdatedAt: string = new Date().toISOString();
}

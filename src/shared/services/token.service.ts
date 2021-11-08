import { Injectable, NotFoundException } from '@nestjs/common';

import type { IToken } from '../models/action-code.model';
import { TokenModel } from '../models/action-code.model';
import { GeneratorService } from './generator.service';

export type Code = string;

export type SourceType = 'email';

@Injectable()
export class TokenService {
  constructor(private readonly generatorService: GeneratorService) {}

  async createToken(
    action: string,
    sourceType: SourceType,
    sourceData: string,
    ttl: number,
    data?: unknown,
  ): Promise<Code> {
    const source = `${sourceType}:${sourceData}`;

    const res = await TokenModel.ActionIndex.query({
      hash: action,
      range: ['beginsWith', source],
      limit: 1,
    });

    let doc: TokenModel;

    if (res.records.length > 0) {
      doc = res.records[0];
    } else {
      const code = this.generatorService.uuid();
      doc = new TokenModel();
      doc.code = code;
      doc.action = action;
      doc.source = source;
      doc.data = data;
    }

    doc.ttl = ttl;

    await doc.save();

    return doc.code;
  }

  async extendToken(code: string, ttl: number): Promise<void> {
    const doc = await TokenModel.primaryKey.get(code);

    if (doc === null) {
      throw new NotFoundException();
    }

    doc.ttl = Math.max(ttl, doc.ttl);
    await doc.save();
  }

  async validateToken(code: string): Promise<boolean> {
    const doc = await TokenModel.primaryKey.get(code);

    return doc !== null;
  }

  async getToken(code: string): Promise<IToken | null> {
    return TokenModel.primaryKey.get(code);
  }

  async terminateToken(code: string): Promise<void> {
    const doc = await TokenModel.primaryKey.get(code);

    if (doc !== null) {
      await doc.delete();
    }
  }
}

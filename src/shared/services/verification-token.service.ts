import { Injectable, NotFoundException } from '@nestjs/common';

import type { TokenType } from '../../common/constants/token.type';
import { TooManyVerificationException } from '../../exceptions/too-many-retry-verification.exception';
import type { VerificationTokenDto } from '../dto/verification-token.dto';
import type { IToken } from '../models/action-code.model';
import { TokenModel } from '../models/action-code.model';
import { ApiConfigService } from './api-config.service';
import { GeneratorService } from './generator.service';

export type Code = string;

export enum SourceType {
  EMAIL = 'email',
}

@Injectable()
export class VerificationTokenService {
  constructor(
    private readonly configService: ApiConfigService,
    private readonly generatorService: GeneratorService,
  ) {}

  async createToken(
    action: TokenType,
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
      doc.seq = 0;
      doc.data = data;
    }

    if (doc.seq >= this.configService.verificationTokenRetryMax) {
      throw new TooManyVerificationException();
    }

    doc.seq++;
    doc.ttl = ttl;

    await doc.save();

    return doc.code;
  }

  async extendToken(token: string, ttl: number): Promise<VerificationTokenDto> {
    const doc = await TokenModel.primaryKey.get(token);

    if (doc === null) {
      throw new NotFoundException();
    }

    doc.ttl = Math.max(ttl, doc.ttl);
    await doc.save();

    return {
      action: doc.action,
      data: doc.data,
    };
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

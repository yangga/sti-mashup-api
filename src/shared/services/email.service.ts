import { Injectable } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { InjectAwsService } from 'nest-aws-sdk';
import { v1 as uuid } from 'uuid';

import { ApiConfigService } from './api-config.service';

export type Email = string;

type EmailType = 'template';

interface IEmailPayloadToSes {
  action: 'email';
  data: {
    emailType: EmailType;
    destination: {
      to: Email[];
      cc?: Email[];
    };
    source: Email;
    emailData: IEmailDataTemplate;
  };
}

export interface IEmailDataTemplate {
  template: string;
  templateData: unknown;
}

export interface IEmailPayload {
  destination: {
    to: Email[];
    cc?: Email[];
  };
  source: Email;
  template: string;
  templateData: unknown;
}

@Injectable()
export class EmailService {
  constructor(
    private configService: ApiConfigService,
    @InjectAwsService(SQS) private readonly sqs: SQS,
  ) {}

  async email(param: IEmailPayload): Promise<void> {
    const data: IEmailPayloadToSes = {
      action: 'email',
      data: {
        emailType: 'template',
        destination: param.destination,
        source: param.source,
        emailData: {
          template: param.template,
          templateData: param.templateData,
        },
      },
    };

    await this.sqs
      .sendMessage({
        QueueUrl: this.configService.emailSqsUrl,
        MessageGroupId: 'email',
        MessageBody: JSON.stringify(data),
        MessageDeduplicationId: uuid(),
      })
      .promise();
  }
}

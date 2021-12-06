import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import mime from 'mime-types';

import type { IFile } from '../../interfaces';
import { ApiConfigService } from './api-config.service';
import { GeneratorService } from './generator.service';

export enum S3FileCategory {
  PROJECT_PIC = 'project-pic',
  USER_PIC = 'user-pic',
}

@Injectable()
export class AwsS3Service {
  private readonly s3: AWS.S3;

  constructor(
    public configService: ApiConfigService,
    public generatorService: GeneratorService,
  ) {
    const awsS3Config = configService.awsConfig.s3;

    const options: AWS.S3.Types.ClientConfiguration = {
      apiVersion: awsS3Config.bucketApiVersion,
      region: awsS3Config.bucketRegion,
    };

    this.s3 = new AWS.S3(options);
  }

  async upload(category: S3FileCategory, file: IFile): Promise<string> {
    const fileName = this.generatorService.fileName(
      <string>mime.extension(file.mimetype),
    );
    const key = `${category}/${fileName}`;
    await this.s3
      .putObject({
        Bucket: this.configService.awsConfig.s3.bucketName,
        Body: file.buffer,
        ACL: 'public-read',
        Key: key,
        ContentType: file.mimetype,
      })
      .promise();

    return key;
  }

  async delete(key: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.configService.awsConfig.s3.bucketName,
        Key: key,
      })
      .promise();
  }
}

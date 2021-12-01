import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

import { UserSettingsEntity } from '../user-settings.entity';

@EntityRepository(UserSettingsEntity)
export class UserSettingsRepository extends Repository<UserSettingsEntity> {}

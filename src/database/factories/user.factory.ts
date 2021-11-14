import { define } from 'typeorm-seeding';

import { RoleType } from '../../common/constants/role-type';
import { UserEntity } from '../../modules/user/user.entity';

define(UserEntity, (faker) => {
  const gender = faker.random.number(1);
  const username = faker.name.firstName(gender);
  const email = faker.internet.email(username, username);

  const user = new UserEntity();
  user.username = username;
  user.email = email;
  user.role = RoleType.USER;
  user.password = '111111';

  return user;
});

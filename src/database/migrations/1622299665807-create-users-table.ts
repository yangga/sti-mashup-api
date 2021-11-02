import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1622299665807 implements MigrationInterface {
  name = 'createUsersTable1622299665807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    create table users
    (
        id bigint auto_increment,
        created_at datetime default CURRENT_TIMESTAMP not null,
        updated_at datetime default current_timestamp not null,
        first_name varchar(128) not null,
        last_name varchar(128) not null,
        role enum('USER', 'ADMIN') default 'USER' not null,
        email varchar(256) not null,
        password varchar(1024) not null,
        phone varchar(80) null,
        avatar varchar(1024) null,
        constraint users_pk
            primary key (id)
    )`);

    await queryRunner.query(`
    create unique index users_email_uindex
	on users (email)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `users`');
    await queryRunner.query('DROP INDEX `users_email_uindex`');
  }
}

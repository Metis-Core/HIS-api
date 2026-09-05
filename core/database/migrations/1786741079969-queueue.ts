import { MigrationInterface, QueryRunner } from "typeorm";

export class Queueue1786741079969 implements MigrationInterface {
    name = 'Queueue1786741079969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" ADD "insuranceProvider" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "insurancePolicyNumber" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "insurancePolicyNumber"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "insuranceProvider"`);
    }

}

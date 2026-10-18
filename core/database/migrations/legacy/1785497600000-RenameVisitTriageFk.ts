import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns the manually named triage FK with TypeORM's expected constraint name
 * so future `migration:generate` runs do not keep emitting a rename-only diff.
 */
export class RenameVisitTriageFk1785497600000 implements MigrationInterface {
  name = 'RenameVisitTriageFk1785497600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "visits" RENAME CONSTRAINT "FK_visits_triageId" TO "FK_7991a9a36d0c39c15164868f512"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "visits" RENAME CONSTRAINT "FK_7991a9a36d0c39c15164868f512" TO "FK_visits_triageId"`,
    );
  }
}

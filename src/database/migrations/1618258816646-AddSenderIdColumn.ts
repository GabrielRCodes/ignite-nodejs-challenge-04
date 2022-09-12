import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddSenderIdColumn1618258816646 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("statements", "type", new TableColumn({
            name: "type",
            type: "enum",
            enum: ["deposit", "withdraw", "transfer"]
        }));

        await queryRunner.addColumn("statements", new TableColumn({
            name: "sender_id",
            type: "uuid",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("statements", "type", new TableColumn({
            name: "type",
            type: "enum",
            enum: ["deposit", "withdraw"]
        }));

        await queryRunner.dropColumn("statements", "sender_id");
    }

}

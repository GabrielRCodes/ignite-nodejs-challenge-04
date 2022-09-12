import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Get balance", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    // const id = uuidV4();
    const password = await hash("1234", 8);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('11aa7822-7e41-4746-8edc-67e3da62bf05', 'User 01', 'user01@test.com', '${password}', 'now()', 'now()')
    `);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('22bb7822-7e41-4746-8edc-67e3da62bf05', 'User 02', 'user02@test.com', '${password}', 'now()', 'now()')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("should be able to get account balance", async () => {
    /* --- User 01 --- */
    const responseToken01 = await request(app).post("/api/v1/sessions")
    .send({
      email: "user01@test.com",
      password: "1234",
    });
    const { token } = responseToken01.body;

    await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 300,
      description: "Depositing $300",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 100,
      description: "Withdrawing $100",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    await request(app).post(`/api/v1/statements/transfer/22bb7822-7e41-4746-8edc-67e3da62bf05`)
    .send({
      amount: 100,
      description: "Test transfer $100",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    /* --- User 02 --- */
    const responseToken02 = await request(app).post("/api/v1/sessions")
    .send({
      email: "user02@test.com",
      password: "1234",
    });

    // console.log(responseToken02.body.token);

    await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 200,
      description: "Depositing $200",
    })
    .set({
      Authorization: `Bearer ${responseToken02.body.token}`,
    });

    await request(app).post(`/api/v1/statements/transfer/11aa7822-7e41-4746-8edc-67e3da62bf05`)
    .send({
      amount: 150,
      description: "Test transfer $150",
    })
    .set({
      Authorization: `Bearer ${responseToken02.body.token}`,
    });

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`,
    });

    // console.log(response.body);

    expect(response.status).toBe(200);
  });
});
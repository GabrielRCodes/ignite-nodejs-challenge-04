import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Create statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("1234", 8);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('${id}', 'Name Test', 'name@test.com', '${password}', 'now()', 'now()')
    `);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('bf057822-7e41-4746-8edc-67e3da62cb20', 'User Test', 'user@test.com', '${password}', 'now()', 'now()')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("should be able to create a deposit statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "name@test.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 300,
      description: "Depositing $300",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should be able to create a withdraw statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "name@test.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 100,
      description: "Withdrawing $100",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should not be able to create a withdraw statement when the account has insufficient funds", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "name@test.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 300,
      description: "Withdrawing $300",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(400);
  });

  it("should be able to create a transfer", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "name@test.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const response = await request(app).post(`/api/v1/statements/transfer/bf057822-7e41-4746-8edc-67e3da62cb20`)
    .send({
      amount: 100,
      description: "Test transfer $100",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should not be able to create a transfer statement when the account has insufficient funds", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "name@test.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const response = await request(app).post(`/api/v1/statements/transfer/bf057822-7e41-4746-8edc-67e3da62cb20`)
    .send({
      amount: 200,
      description: "Test error transfer $200",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(400);
  });
});
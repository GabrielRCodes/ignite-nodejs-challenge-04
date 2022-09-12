import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Get statement operation", () => {
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
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("should be able to get a statement operation", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "name@test.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const statement = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 300,
      description: "Depositing $300",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const response = await request(app).get(`/api/v1/statements/${statement.body.id}`)
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(200);
  });

  it("should not be able to get a non-existing statement operation", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "name@test.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const response = await request(app).get(`/api/v1/statements/${uuidV4()}`)
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(404);
  });
});
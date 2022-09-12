import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("Create a user", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("should be able to create a new user", async () => {
    const user = await createUserUseCase.execute({
      name: "Name User",
      email: "user@email.com",
      password: "1234",
    });

    expect(user).toHaveProperty("id");
  });

  it("should not be able to create a user with an existent email", async () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "Name First User",
        email: "user@email.com",
        password: "1234",
      });

      await createUserUseCase.execute({
        name: "Name Second User",
        email: "user@email.com",
        password: "4321",
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
})
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let getBalanceUseCase: GetBalanceUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

describe("Get the balance", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  });

  it("should be able to get the user account balance", async () => {
    const user01 = await createUserUseCase.execute({
      name: "User 01",
      email: "user01@test.com",
      password: "1234"
    })
    
    const user02 = await createUserUseCase.execute({
      name: "User 02",
      email: "user02@test.com",
      password: "1234"
    })

    /* --- Statements User 01 --- */
    await createStatementUseCase.execute({
      user_id: user01.id as string,
      type: OperationType.DEPOSIT,
      amount: 200,
      description: "Depositing $200",
    });

    await createStatementUseCase.execute({
      user_id: user01.id as string,
      type: OperationType.WITHDRAW,
      amount: 30,
      description: "Withdrawing $30",
    });

    await createStatementUseCase.execute({
      user_id: user02.id as string,
      sender_id: user01.id as string,
      type: OperationType.TRANSFER,
      amount: 50,
      description: "Transfer $50 to User 02",
    });

    /* --- Statements User 02 --- */
    await createStatementUseCase.execute({
      user_id: user02.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Depositing $100",
    });

    await createStatementUseCase.execute({
      user_id: user01.id as string,
      sender_id: user02.id as string,
      type: OperationType.TRANSFER,
      amount: 100,
      description: "Transfer $100 to User 01",
    });

    const result = await getBalanceUseCase.execute({
      user_id: user01.id as string
    });

    // console.log(result);

    expect(result).toHaveProperty("balance");
    expect(result.balance).toBeGreaterThan(0);
  });

  it("should not be able to get the account balance from an inexistent user", () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "inexistentId"
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
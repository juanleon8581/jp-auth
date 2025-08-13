export class RegisterDto {
  constructor(
    public readonly name: string,
    public readonly lastname: string,
    public readonly email: string,
    public readonly password: string
  ) {}

  static create(props: { [key: string]: any }): [string?, RegisterDto?] {
    const { name, lastname, email, password } = props;

    if (!name || !lastname || !email || !password) return ["Invalid Data"];

    return [, new RegisterDto(name, lastname, email, password)];
  }
}

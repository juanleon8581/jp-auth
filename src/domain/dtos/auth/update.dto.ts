export class UpdateUserDto {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly lastname?: string,
    public readonly password?: string
  ) {}

  static create(props: { [key: string]: any }): [string?, UpdateUserDto?] {
    const { id, name, lastname, password } = props;

    if (!id || (!name && !lastname && !password)) return ["Invalid Data"];

    return [undefined, new UpdateUserDto(id, name, lastname, password)];
  }
}

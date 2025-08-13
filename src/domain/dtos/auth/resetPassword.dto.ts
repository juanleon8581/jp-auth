export class ResetPasswordDto {
  constructor(public readonly email: string) {}

  static create(props: { [key: string]: any }): [string?, ResetPasswordDto?] {
    const { email } = props;

    if (!email) return ["Invalid Data"];

    return [undefined, new ResetPasswordDto(email)];
  }
}

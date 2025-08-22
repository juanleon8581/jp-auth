import { z } from "zod";
import { RegisterDto } from "@/domain/dtos/auth/register.dto";
import globalStrings from "@/config/strings/global.strings.json";
import { NAME_LASTNAME_REGEX, SECURE_PASSWORD_REGEX } from "@/config/regex/validations.regex";

const { REGISTER_VALIDATION, DATA_VALIDATION } = globalStrings.ERRORS;

const registerSchema = z.object({
  name: z.string()
    .min(2, REGISTER_VALIDATION.NAME.MIN_LENGTH)
    .max(50, REGISTER_VALIDATION.NAME.MAX_LENGTH)
    .regex(NAME_LASTNAME_REGEX, REGISTER_VALIDATION.NAME.INVALID_FORMAT),
  
  lastname: z.string()
    .min(2, REGISTER_VALIDATION.LASTNAME.MIN_LENGTH)
    .max(50, REGISTER_VALIDATION.LASTNAME.MAX_LENGTH)
    .regex(NAME_LASTNAME_REGEX, REGISTER_VALIDATION.LASTNAME.INVALID_FORMAT),
  
  email: z.string()
    .email(REGISTER_VALIDATION.EMAIL.INVALID_FORMAT)
    .max(100, REGISTER_VALIDATION.EMAIL.MAX_LENGTH)
    .toLowerCase(),
  
  password: z.string()
    .min(8, REGISTER_VALIDATION.PASSWORD.MIN_LENGTH)
    .max(128, REGISTER_VALIDATION.PASSWORD.MAX_LENGTH)
    .regex(SECURE_PASSWORD_REGEX, REGISTER_VALIDATION.PASSWORD.INVALID_FORMAT)
});

export class RegisterValidator {

  static validate(data: {[key:string]:any}): [string?, RegisterDto?] {
    try {
      const validatedData = registerSchema.parse(data);
      
      const registerDto = new RegisterDto(
        validatedData.name,
        validatedData.lastname,
        validatedData.email,
        validatedData.password
      );
      
      return [undefined, registerDto];
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return [errorMessages, undefined];
      }
      
      return [DATA_VALIDATION.UNKNOWN_VALIDATION_ERROR, undefined];
    }
  }
}
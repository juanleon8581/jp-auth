import { RegisterValidator } from "../register.validator";
import { RegisterDto } from "@/domain/dtos/auth/register.dto";
import globalStrings from "@/config/strings/global.strings.json";

const { REGISTER_VALIDATION, DATA_VALIDATION } = globalStrings.ERRORS;

describe("RegisterValidator", () => {
  const validData = {
    name: "Juan",
    lastname: "Pérez",
    email: "juan.perez@example.com",
    password: "SecurePass123!",
  };

  describe("validate", () => {
    it("should validate correct data successfully", () => {
      const [error, dto] = RegisterValidator.validate(validData);

      expect(error).toBeUndefined();
      expect(dto).toBeInstanceOf(RegisterDto);
      expect(dto?.name).toBe(validData.name);
      expect(dto?.lastname).toBe(validData.lastname);
      expect(dto?.email).toBe(validData.email.toLowerCase());
      expect(dto?.password).toBe(validData.password);
    });

    it("should convert email to lowercase", () => {
      const dataWithUppercaseEmail = {
        ...validData,
        email: "JUAN.PEREZ@EXAMPLE.COM",
      };

      const [error, dto] = RegisterValidator.validate(dataWithUppercaseEmail);

      expect(error).toBeUndefined();
      expect(dto?.email).toBe("juan.perez@example.com");
    });

    describe("name validation", () => {
      it("should reject name with less than 2 characters", () => {
        const invalidData = { ...validData, name: "J" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.NAME.MIN_LENGTH);
        expect(dto).toBeUndefined();
      });

      it("should reject name with more than 50 characters", () => {
        const invalidData = { ...validData, name: "J".repeat(51) };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.NAME.MAX_LENGTH);
        expect(dto).toBeUndefined();
      });

      it("should reject name with invalid characters", () => {
        const invalidData = { ...validData, name: "Juan123" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.NAME.INVALID_FORMAT);
        expect(dto).toBeUndefined();
      });

      it("should accept name with accents and spaces", () => {
        const validDataWithAccents = { ...validData, name: "José María" };
        const [error, dto] = RegisterValidator.validate(validDataWithAccents);

        expect(error).toBeUndefined();
        expect(dto?.name).toBe("José María");
      });

      it("should accept name with ñ character", () => {
        const validDataWithÑ = { ...validData, name: "Niño" };
        const [error, dto] = RegisterValidator.validate(validDataWithÑ);

        expect(error).toBeUndefined();
        expect(dto?.name).toBe("Niño");
      });
    });

    describe("lastname validation", () => {
      it("should reject lastname with less than 2 characters", () => {
        const invalidData = { ...validData, lastname: "P" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.LASTNAME.MIN_LENGTH);
        expect(dto).toBeUndefined();
      });

      it("should reject lastname with more than 50 characters", () => {
        const invalidData = { ...validData, lastname: "P".repeat(51) };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.LASTNAME.MAX_LENGTH);
        expect(dto).toBeUndefined();
      });

      it("should reject lastname with invalid characters", () => {
        const invalidData = { ...validData, lastname: "Pérez123" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.LASTNAME.INVALID_FORMAT);
        expect(dto).toBeUndefined();
      });

      it("should accept lastname with accents and spaces", () => {
        const validDataWithAccents = { ...validData, lastname: "García López" };
        const [error, dto] = RegisterValidator.validate(validDataWithAccents);

        expect(error).toBeUndefined();
        expect(dto?.lastname).toBe("García López");
      });
    });

    describe("email validation", () => {
      it("should reject invalid email format", () => {
        const invalidData = { ...validData, email: "invalid-email" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.EMAIL.INVALID_FORMAT);
        expect(dto).toBeUndefined();
      });

      it("should reject email with more than 100 characters", () => {
        const longEmail = "a".repeat(90) + "@example.com";
        const invalidData = { ...validData, email: longEmail };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.EMAIL.MAX_LENGTH);
        expect(dto).toBeUndefined();
      });

      it("should accept valid email formats", () => {
        const validEmails = [
          "test@example.com",
          "user.name@domain.co.uk",
          "user+tag@example.org",
          "user123@test-domain.com",
        ];

        validEmails.forEach((email) => {
          const testData = { ...validData, email };
          const [error, dto] = RegisterValidator.validate(testData);

          expect(error).toBeUndefined();
          expect(dto?.email).toBe(email.toLowerCase());
        });
      });
    });

    describe("password validation", () => {
      it("should reject password with less than 8 characters", () => {
        const invalidData = { ...validData, password: "Short1!" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.PASSWORD.MIN_LENGTH);
        expect(dto).toBeUndefined();
      });

      it("should reject password with more than 128 characters", () => {
        const longPassword = "A".repeat(130) + "a1@"; // 133 characters total
        const invalidData = { ...validData, password: longPassword };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.PASSWORD.MAX_LENGTH);
        expect(dto).toBeUndefined();
      });

      it("should reject password without lowercase letter", () => {
        const invalidData = { ...validData, password: "PASSWORD123!" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.PASSWORD.INVALID_FORMAT);
        expect(dto).toBeUndefined();
      });

      it("should reject password without uppercase letter", () => {
        const invalidData = { ...validData, password: "password123!" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.PASSWORD.INVALID_FORMAT);
        expect(dto).toBeUndefined();
      });

      it("should reject password without number", () => {
        const invalidData = { ...validData, password: "Password!" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.PASSWORD.INVALID_FORMAT);
        expect(dto).toBeUndefined();
      });

      it("should reject password without special character", () => {
        const invalidData = { ...validData, password: "Password123" };
        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toContain(REGISTER_VALIDATION.PASSWORD.INVALID_FORMAT);
        expect(dto).toBeUndefined();
      });

      it("should accept valid passwords with different special characters", () => {
        const validPasswords = [
          "SecurePass123!",
          "MyPassword1@",
          "StrongPass2#",
          "ValidPass3$",
          "GoodPass4%",
          "TestPass5*",
          "NewPass6?",
          "SafePass7&",
        ];

        validPasswords.forEach((password) => {
          const testData = { ...validData, password };
          const [error, dto] = RegisterValidator.validate(testData);

          expect(error).toBeUndefined();
          expect(dto).toBeInstanceOf(RegisterDto);
          expect(dto?.password).toBe(password);
        });
      });
    });

    describe("missing fields", () => {
      it("should reject when name is missing", () => {
        const { name, ...dataWithoutName } = validData;
        const [error, dto] = RegisterValidator.validate(dataWithoutName);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });

      it("should reject when lastname is missing", () => {
        const { lastname, ...dataWithoutLastname } = validData;
        const [error, dto] = RegisterValidator.validate(dataWithoutLastname);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });

      it("should reject when email is missing", () => {
        const { email, ...dataWithoutEmail } = validData;
        const [error, dto] = RegisterValidator.validate(dataWithoutEmail);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });

      it("should reject when password is missing", () => {
        const { password, ...dataWithoutPassword } = validData;
        const [error, dto] = RegisterValidator.validate(dataWithoutPassword);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });
    });

    describe("multiple validation errors", () => {
      it("should return multiple error messages when multiple fields are invalid", () => {
        const invalidData = {
          name: "J",
          lastname: "P",
          email: "invalid-email",
          password: "weak",
        };

        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toBeDefined();
        expect(error).toContain("name");
        expect(error).toContain("lastname");
        expect(error).toContain("email");
        expect(error).toContain("password");
        expect(dto).toBeUndefined();
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", () => {
        const [error, dto] = RegisterValidator.validate({});

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });

      it("should handle null values", () => {
        const invalidData = {
          name: null,
          lastname: null,
          email: null,
          password: null,
        };

        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });

      it("should handle undefined values", () => {
        const invalidData = {
          name: undefined,
          lastname: undefined,
          email: undefined,
          password: undefined,
        };

        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });

      it("should handle non-string values", () => {
        const invalidData = {
          name: 123,
          lastname: true,
          email: [],
          password: {},
        };

        const [error, dto] = RegisterValidator.validate(invalidData);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });

      it("should handle malformed data gracefully", () => {
        const malformedData = {
          name: { invalid: "object" },
          lastname: ["invalid", "array"],
          email: 123,
          password: true,
        };

        const [error, dto] = RegisterValidator.validate(malformedData);

        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
      });
    });
  });
});

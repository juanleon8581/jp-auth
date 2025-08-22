import {
  NAME_LASTNAME_REGEX,
  SECURE_PASSWORD_REGEX,
  EMAIL_BASIC_REGEX,
  PHONE_INTERNATIONAL_REGEX,
  POSTAL_CODE_REGEX,
  URL_REGEX,
} from "../validations.regex";

describe("Validation Regex", () => {
  describe("NAME_LASTNAME_REGEX", () => {
    it("should match valid names with letters only", () => {
      const validNames = ["Juan", "María", "José", "Ana", "Carlos", "Sofía"];

      validNames.forEach((name) => {
        expect(NAME_LASTNAME_REGEX.test(name)).toBe(true);
      });
    });

    it("should match names with accents", () => {
      const namesWithAccents = [
        "José",
        "María",
        "Ángel",
        "Mónica",
        "Andrés",
        "Inés",
      ];

      namesWithAccents.forEach((name) => {
        expect(NAME_LASTNAME_REGEX.test(name)).toBe(true);
      });
    });

    it("should match names with ñ character", () => {
      const namesWithÑ = ["Niño", "Peña", "Muñoz", "Ibáñez"];

      namesWithÑ.forEach((name) => {
        expect(NAME_LASTNAME_REGEX.test(name)).toBe(true);
      });
    });

    it("should match names with spaces", () => {
      const namesWithSpaces = [
        "José María",
        "Ana Sofía",
        "Juan Carlos",
        "María José",
        "Luis Miguel",
      ];

      namesWithSpaces.forEach((name) => {
        expect(NAME_LASTNAME_REGEX.test(name)).toBe(true);
      });
    });

    it("should match uppercase and lowercase combinations", () => {
      const mixedCaseNames = [
        "JUAN",
        "maría",
        "José",
        "ANA SOFÍA",
        "luis miguel",
      ];

      mixedCaseNames.forEach((name) => {
        expect(NAME_LASTNAME_REGEX.test(name)).toBe(true);
      });
    });

    it("should reject names with numbers", () => {
      const namesWithNumbers = [
        "Juan123",
        "María2",
        "José1",
        "Ana3Sofía",
        "123Luis",
      ];

      namesWithNumbers.forEach((name) => {
        expect(NAME_LASTNAME_REGEX.test(name)).toBe(false);
      });
    });

    it("should reject names with special characters", () => {
      const namesWithSpecialChars = [
        "Juan@",
        "María!",
        "José#",
        "Ana$Sofía",
        "Luis%Miguel",
        "Carlos&",
        "Sofía*",
        "Pedro+",
      ];

      namesWithSpecialChars.forEach((name) => {
        expect(NAME_LASTNAME_REGEX.test(name)).toBe(false);
      });
    });

    it("should reject empty strings", () => {
      expect(NAME_LASTNAME_REGEX.test("")).toBe(false);
    });
  });

  describe("SECURE_PASSWORD_REGEX", () => {
    it("should match passwords with all required components", () => {
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
        expect(SECURE_PASSWORD_REGEX.test(password)).toBe(true);
      });
    });

    it("should match passwords with minimum requirements", () => {
      const minimalPasswords = ["Aa1!", "Bb2@", "Cc3#", "Dd4$"];

      minimalPasswords.forEach((password) => {
        expect(SECURE_PASSWORD_REGEX.test(password)).toBe(true);
      });
    });

    it("should reject passwords without lowercase letters", () => {
      const passwordsWithoutLowercase = [
        "PASSWORD123!",
        "MYPASS1@",
        "STRONG2#",
        "VALID3$",
      ];

      passwordsWithoutLowercase.forEach((password) => {
        expect(SECURE_PASSWORD_REGEX.test(password)).toBe(false);
      });
    });

    it("should reject passwords without uppercase letters", () => {
      const passwordsWithoutUppercase = [
        "password123!",
        "mypass1@",
        "strong2#",
        "valid3$",
      ];

      passwordsWithoutUppercase.forEach((password) => {
        expect(SECURE_PASSWORD_REGEX.test(password)).toBe(false);
      });
    });

    it("should reject passwords without numbers", () => {
      const passwordsWithoutNumbers = [
        "Password!",
        "MyPass@",
        "Strong#",
        "Valid$",
      ];

      passwordsWithoutNumbers.forEach((password) => {
        expect(SECURE_PASSWORD_REGEX.test(password)).toBe(false);
      });
    });

    it("should reject passwords without special characters", () => {
      const passwordsWithoutSpecialChars = [
        "Password123",
        "MyPass1",
        "Strong2",
        "Valid3",
      ];

      passwordsWithoutSpecialChars.forEach((password) => {
        expect(SECURE_PASSWORD_REGEX.test(password)).toBe(false);
      });
    });

    it("should accept various special characters", () => {
      const specialChars = ["@", "$", "!", "%", "*", "?", "&"];

      specialChars.forEach((char) => {
        const password = `Password123${char}`;
        expect(SECURE_PASSWORD_REGEX.test(password)).toBe(true);
      });
    });

    it("should reject empty strings", () => {
      expect(SECURE_PASSWORD_REGEX.test("")).toBe(false);
    });
  });

  describe("EMAIL_BASIC_REGEX", () => {
    it("should match valid email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "user123@test-domain.com",
        "simple@test.io",
        "user_name@example.net",
      ];

      validEmails.forEach((email) => {
        expect(EMAIL_BASIC_REGEX.test(email)).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "user.example.com",
        "user@@example.com",
        "user @example.com",
        "user@ example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(EMAIL_BASIC_REGEX.test(email)).toBe(false);
      });
    });

    it("should reject empty strings", () => {
      expect(EMAIL_BASIC_REGEX.test("")).toBe(false);
    });
  });

  describe("PHONE_INTERNATIONAL_REGEX", () => {
    it("should match valid international phone numbers", () => {
      const validPhones = [
        "+1234567890",
        "+521234567890",
        "+34123456789",
        "+441234567890",
        "+81234567890",
      ];

      validPhones.forEach((phone) => {
        expect(PHONE_INTERNATIONAL_REGEX.test(phone)).toBe(true);
      });
    });

    it("should reject invalid phone numbers", () => {
      const invalidPhones = [
        "+0123456789", // starts with 0 after +
        "0123456789", // no + sign
        "1234567890", // no + sign
        "+12", // too short
        "+123456789012345678", // too long
        "+12-345-6789", // contains hyphens
        "+12 345 6789", // contains spaces
        "abc123456789", // contains letters
        "++1234567890", // double plus
        "+", // just plus sign
      ];

      invalidPhones.forEach((phone) => {
        expect(PHONE_INTERNATIONAL_REGEX.test(phone)).toBe(false);
      });
    });

    it("should reject empty strings", () => {
      expect(PHONE_INTERNATIONAL_REGEX.test("")).toBe(false);
    });
  });

  describe("POSTAL_CODE_REGEX", () => {
    it("should match valid postal codes", () => {
      const validPostalCodes = [
        "1234",
        "12345",
        "123456",
        "1234567",
        "12345678",
        "123456789",
        "1234567890",
      ];

      validPostalCodes.forEach((code) => {
        expect(POSTAL_CODE_REGEX.test(code)).toBe(true);
      });
    });

    it("should reject invalid postal codes", () => {
      const invalidPostalCodes = [
        "123", // too short
        "12345678901", // too long
        "ABCD", // contains letters
        "12-34", // contains hyphen
        "12 34", // contains space
        "12.34", // contains dot
        "A1B2C3", // mixed letters and numbers
      ];

      invalidPostalCodes.forEach((code) => {
        expect(POSTAL_CODE_REGEX.test(code)).toBe(false);
      });
    });

    it("should reject empty strings", () => {
      expect(POSTAL_CODE_REGEX.test("")).toBe(false);
    });
  });

  describe("URL_REGEX", () => {
    it("should match valid HTTP URLs", () => {
      const validHttpUrls = [
        "http://example.com",
        "http://www.example.com",
        "http://example.com/path",
        "http://example.com/path?query=value",
        "http://example.com:8080",
        "http://subdomain.example.com",
      ];

      validHttpUrls.forEach((url) => {
        expect(URL_REGEX.test(url)).toBe(true);
      });
    });

    it("should match valid HTTPS URLs", () => {
      const validHttpsUrls = [
        "https://example.com",
        "https://www.example.com",
        "https://example.com/path",
        "https://example.com/path?query=value",
        "https://example.com:443",
        "https://api.example.com/v1/users",
      ];

      validHttpsUrls.forEach((url) => {
        expect(URL_REGEX.test(url)).toBe(true);
      });
    });

    it("should match URLs with paths and queries", () => {
      const complexUrls = [
        "https://example.com/path",
        "https://api.example.com/users",
        "https://example.com/search",
        "https://subdomain.example.com/api",
        "http://example.com/dashboard",
      ];

      complexUrls.forEach((url) => {
        expect(URL_REGEX.test(url)).toBe(true);
      });
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = [
        "ftp://example.com", // wrong protocol
        "example.com", // missing protocol
        "http://", // missing domain
        "http://example", // missing TLD
        "http:// example.com", // space in URL
        "https://example .com", // space in domain
      ];

      invalidUrls.forEach((url) => {
        expect(URL_REGEX.test(url)).toBe(false);
      });
    });

    it("should reject empty strings", () => {
      expect(URL_REGEX.test("")).toBe(false);
    });
  });

  describe("Regex properties", () => {
    it("should have all regex patterns as RegExp objects", () => {
      expect(NAME_LASTNAME_REGEX).toBeInstanceOf(RegExp);
      expect(SECURE_PASSWORD_REGEX).toBeInstanceOf(RegExp);
      expect(EMAIL_BASIC_REGEX).toBeInstanceOf(RegExp);
      expect(PHONE_INTERNATIONAL_REGEX).toBeInstanceOf(RegExp);
      expect(POSTAL_CODE_REGEX).toBeInstanceOf(RegExp);
      expect(URL_REGEX).toBeInstanceOf(RegExp);
    });

    it("should have global flag disabled for all patterns", () => {
      expect(NAME_LASTNAME_REGEX.global).toBe(false);
      expect(SECURE_PASSWORD_REGEX.global).toBe(false);
      expect(EMAIL_BASIC_REGEX.global).toBe(false);
      expect(PHONE_INTERNATIONAL_REGEX.global).toBe(false);
      expect(POSTAL_CODE_REGEX.global).toBe(false);
      expect(URL_REGEX.global).toBe(false);
    });
  });
});

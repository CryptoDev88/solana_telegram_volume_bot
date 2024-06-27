import Validator from 'validator';
import isEmpty from 'is-empty';

interface LoginInput {
  email: string;
  password: string;
}

export const validateLoginInput = (data: LoginInput) => {
  let errors: { [key: string]: string } = {};
  data.email = !isEmpty(data.email) ? data.email.trim() : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  if (Validator.isEmpty(data.email)) {
    errors.email = "ID field is required";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password2: string;
}

export const validateRegisterInput = (data: RegisterInput) => {
  let errors: { [key: string]: string } = {};
  data.name = !isEmpty(data.name) ? data.name.trim() : "";
  data.email = !isEmpty(data.email) ? data.email.trim() : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.password2 = !isEmpty(data.password2) ? data.password2 : "";
  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }
  if (Validator.isEmpty(data.email)) {
    errors.email = "ID field is required";
  }
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }
  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Confirm password field is required";
  }
  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "Password must be at least 6 characters";
  }
  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Passwords must match";
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};

interface UpdateUserInput {
  name: string;
  email: string;
}

export const validateUpdateUserInput = (data: UpdateUserInput) => {
  let errors: { [key: string]: string } = {};
  data.name = !isEmpty(data.name) ? data.name.trim() : "";
  data.email = !isEmpty(data.email) ? data.email.trim() : "";
  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }
  if (Validator.isEmpty(data.email)) {
    errors.email = "ID field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

interface UpdateGroupInput {
  name: string;
  email: string;
}

export const validateUpdateGroupInput = (data: UpdateGroupInput) => {
  let errors: { [key: string]: string } = {};
  data.name = !isEmpty(data.name) ? data.name.trim() : "";
  data.email = !isEmpty(data.email) ? data.email.trim() : "";
  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }
  if (Validator.isEmpty(data.email)) {
    errors.email = "ID field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
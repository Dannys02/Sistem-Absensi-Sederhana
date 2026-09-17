const Joi = require("joi");

const createStudent = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.base": "Nama harus berupa teks",
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal harus terdiri dari {#limit} karakter",
    "any.required": "Nama wajib diisi",
  }),
  email: Joi.string().email().required().messages({
    "string.base": "Email harus berupa teks",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "any.required": "Email wajib diisi",
  }),
  password: Joi.string().min(6).required().messages({
    "string.base": "Password harus berupa teks",
    "string.empty": "Password tidak boleh kosong",
    "string.min": "Password minimal harus terdiri dari {#limit} karakter",
    "any.required": "Password wajib diisi",
  }),
  classId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "Class ID harus berupa teks",
      "string.empty": "Class ID tidak boleh kosong",
      "string.pattern.base": "Class ID harus berupa Mongo ID yang valid",
      "any.required": "Class ID wajib diisi",
    }),
  nis: Joi.string().required().messages({
    "string.base": "NIS harus berupa teks",
    "string.empty": "NIS tidak boleh kosong",
    "any.required": "NIS wajib diisi",
  }),
});

const updateStudent = Joi.object({
  name: Joi.string().min(3).messages({
    "string.base": "Nama harus berupa teks",
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal harus terdiri dari {#limit} karakter",
  }),
  email: Joi.string().email().messages({
    "string.base": "Email harus berupa teks",
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
  }),
  password: Joi.string().min(6).allow("").messages({
    "string.base": "Password harus berupa teks",
    "string.min": "Password minimal harus terdiri dari {#limit} karakter",
  }),
  classId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.base": "Class ID harus berupa teks",
      "string.empty": "Class ID tidak boleh kosong",
      "string.pattern.base": "Class ID harus berupa Mongo ID yang valid",
    }),
  nis: Joi.string().messages({
    "string.base": "NIS harus berupa teks",
    "string.empty": "NIS tidak boleh kosong",
  }),
});

const validateCreateStudent = (req, res, next) => {
  const { error, value } = createStudent.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  req.body = value;
  next();
};

const validateUpdateStudent = (req, res, next) => {
  const { error, value } = updateStudent.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  req.body = value;
  next();
};

module.exports = { validateCreateStudent, validateUpdateStudent };
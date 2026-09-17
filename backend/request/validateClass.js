const Joi = require("joi");

const createClass = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.base": "Nama harus berupa teks",
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal harus terdiri dari {#limit} karakter",
    "any.required": "Nama wajib diisi",
  }),
});

const updateClass = Joi.object({
  name: Joi.string().min(3).messages({
    "string.base": "Nama harus berupa teks",
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal harus terdiri dari {#limit} karakter",
  }),
});

const validateCreateClass = (req, res) => {
  const { error, value } = createClass.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.body = value;
};

const validateUpdateClass = (req, res) => {
  const { error, value } = updateClass.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.body = value;
};

module.exports = { validateCreateClass, validateUpdateClass };

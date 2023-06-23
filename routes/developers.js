const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");

const Joi = require("joi");

const jwt = require("jsonwebtoken");

const secretKey = "proyek-soa";

async function register(req, res) {
  const input = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .required()
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])/),
    confirmPassword: Joi.string().required().valid(Joi.ref("password")),
  });

  try {
    await input.validateAsync(req.body);
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let uploadktp = req.file.filename;

    if (uploadktp == null) {
      return res.status(400).json({ error: "Harus Upload KTP!" });
    }
    const existed = await prisma.developer.findUnique({
      where: {
        email: email,
      },
    });

    // return res.status(200).json({ p:uploadktp });
    if (existed) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (password == confirmPassword) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.developer.create({
        data: {
          name: name,
          email: email,
          password: hashedPassword,
          uploadKTP: uploadktp,
        },
      });

      const data = {
        name: name,
        email: email,
      };

      return res.status(200).json({
        message: "User created successfully",
        data: data,
        KTP: uploadktp
      });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
  const input = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  try {
    await input.validateAsync(req.body);

    let email = req.body.email;
    let password = req.body.password;

    const developer = await prisma.developer.findUnique({
      where: {
        email: email,
      },
    });
    if (!developer) {
      return res.status(404).send({ error: "Developer not found" });
    }

    const validPassword = await bcrypt.compare(password, developer.password);

    if (!validPassword) {
      return res.status(400).send({ error: "Invalid password" });
    }

    const payload = {
      id: developer.id,
      name: developer.name,
      email: developer.email,
      // exp: Math.floor(Date.now() / 1000) + 2147483647,
    };

    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    return res.status(200).send({
      message: "Login Succesfully",
      email: email,
      token: token,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  register,
  login,
};

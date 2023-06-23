const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Joi = require("joi");

const jwt = require("jsonwebtoken");

const secretKey = "proyek-soa";

async function insert_user(req, res) {
  const input = Joi.object({
    customId: Joi.string().required(),
    name: Joi.string().required(),
  });
try {
  await input.validateAsync(req.body);
} catch (error) {
  return res.status(400).json({ error: error.message });
}
  try {

    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let adminLogin = await prisma.developer.findUnique({
      where: {
        email: payload.email
      }
    })


    let customId = req.body.customId;
    let name = req.body.name;

    const existed = await prisma.user.findUnique({
      where: {
        userStatus: {
          customId: customId,
          developerId: adminLogin.id
        },
      },
    });
    if (existed) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await prisma.user.create({
      data: {
        customId: customId,
        name: name,
        developerId: adminLogin.id,
      },
    });

    return res.status(200).json({
      message: "User created successfully",
      customId: customId,
      name: name,
    });
  } catch (error) {
    return res.status(401).json({ message: "your auth token is invalid" , error: error.message});
  }
}

async function select_user(req, res) {
  const input = Joi.object({
    customId: Joi.string(),
  });

  try {
    await input.validateAsync(req.params);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let adminLogin = await prisma.developer.findUnique({
      where: {
        email: payload.email
      }
    })


    let customId = req.params.customId;
    if (!customId) {
      const user = await prisma.user.findMany();
      if (user.length <= 0) {
        return res.status(400).json({ error: "User is empty" });
      }

      return res.status(200).json(user);
    } else {
      const user = await prisma.user.findUnique({
        where: {
          userStatus: {
            customId: customId,
            developerId: adminLogin.id
          },
        },
      });
      if (!user) {
        return res.status(404).json({ error: `user with UID ${customId} not found` });
      }

      return res.status(200).json(user);
    }
  } catch (error) {
    return res.status(401).json({ message: "your auth token is invalid" });
  }
}


async function delete_user(req, res) {
  const input = Joi.object({
    customId: Joi.string().required(),
  });
  try {
    
    await input.validateAsync(req.params);
  } catch (error) {
    
    return res.status(400).json({ error: error.message });
  }
  try {
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let adminLogin = await prisma.developer.findUnique({
      where: {
        email: payload.email
      }
    })

    let customId = req.params.customId;

    const user = await prisma.user.findUnique({
      where: {
        userStatus: {
          customId: customId,
          developerId: adminLogin.id
        },
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ error: `user with Id ${customId} not found` });
    }

    await prisma.user.delete({
      where: {
        customId: customId,
      },
      // data: {
      //   deletedAt: new Date(),
      //   deleted: true,
      // },
    });

    return res.status(200).json({
      message: `user with Id ${customId} deleted successfully`,
      user: user,
    });
  } catch (error) {
    return res.status(401).json({ message: "your auth token is invalid" });
  }
}

async function update_user(req, res) {
  const input = Joi.object({
    oldCustomId: Joi.string().required(),
    newCustomId: Joi.string().required(),
    name: Joi.string().required(),
  });
try {
  await input.validateAsync({
    oldCustomId: req.params.oldCustomId,
    newCustomId: req.body.newCustomId,
    name: req.body.name,
  });
} catch (error) {
  return res.status(400).json({ error: error.message });
}
  try {
    
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let adminLogin = await prisma.developer.findUnique({
      where: {
        email: payload.email
      }
    })


    let oldCustomId = req.params.oldCustomId;
    let newCustomId = req.body.newCustomId;
    let name = req.body.name;


    const oldExisted = await prisma.user.findUnique({
      where: {
        userStatus: {
          customId: oldCustomId,
          developerId: adminLogin.id
        },
      },
    });
    if (!oldExisted) {
      return res.status(400).json({ error: "User is not exists" });
    }

    const newExisted = await prisma.user.findUnique({
      where: {
        userStatus: {
          customId: newCustomId,
          developerId: adminLogin.id
        },
      },
    });
    if (newExisted) {
      return res.status(400).json({ error: "User Id is taken exists" });
    }

    const user = await prisma.user.update({
      where: {
        customId: oldCustomId,
      },
      data: {
        customId: newCustomId,
        name: name,
        developerId: adminLogin.id,
      },
    });

    return res.status(200).json({
      message: "User updated successfully",
      customId: newCustomId,
      name: name,
    });
  } catch (error) {
    return res.status(401).json({ message: "your auth token is invalid", error: error.message });
  }
}

module.exports = {
  insert_user,
  delete_user,
  select_user,
  update_user,
};

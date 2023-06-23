const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const Joi = require("joi");

const axios = require("axios");

const jwt = require("jsonwebtoken");

const secretKey = "proyek-soa";

async function insert_pinnedLocation(req, res) {
  const input = Joi.object({
    customId: Joi.string().required(),
    locName: Joi.string().required(),
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  });
  try {
    await input.validateAsync(req.query);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let customId = req.query.customId;
    let locName = req.query.locName;
    let lat = req.query.lat;
    let lng = req.query.lng;

    let adminLogin = await prisma.developer.findUnique({
      where: {
        email: payload.email,
      },
    });
    let user = await prisma.user.findUnique({
      where: {
        userStatus: {
          customId: customId,
          developerId: adminLogin.id,
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // let locationName = await prisma.pinnedLocation.findUnique({
    //   where: {
    //     userCustomId_latitude_longitude: `${customId}_${lat}_${lng}`,
    //   },
    // });
    // console.log(locationName);
    // if (locationName) {
    //   return res.status(400).json({ error: "Location already pinned" });
    // }

    let location = await prisma.pinnedLocation.create({
      data: {
        userCustomId: customId,
        locationName: locName,
        latitude: lat,
        longitude: lng,
        userCustomId_latitude_longitude: `${customId}_${lat}_${lng}`,
      },
    });
    return res.status(200).json({
      message: "pinned location added",

      locationName: locName,
      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    return res
      .status(401)
      .json({ error: "your auth token is invalid", error: error.message });
  }
}

async function select_pinnedLocation(req, res) {
  const input = Joi.object({
    customId: Joi.string().required(),
  });

  try {
    await input.validateAsync(req.query);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);
    let customId = req.query.customId;

    let user = await prisma.user.findUnique({
      where: {
        userStatus: {
          customId: customId,
          developerId: payload.id,
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "Location not found" });
    }
    let location = await prisma.pinnedLocation.findMany({
      where: {
        userCustomId: customId,
      },
    });
    if (location.length <= 0) {
      return res.status(404).json({ error: "No pinned location found" });
    }
    return res.status(200).json(location);
  } catch (error) {
    return res
      .status(401)
      .json({ message: "your auth token is invalid", error: error.message });
  }
}

async function delete_pinnedLocation(req, res) {
  const input = Joi.object({
    id: Joi.number().required(),
  });

  try {
    await input.validateAsync(req.params);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let id = req.params.id;

    const existed = await prisma.pinnedLocation.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!existed) {
      return res
        .status(404)
        .json({ error: `Location with Id ${id} not found` });
    }

    await prisma.pinnedLocation.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).json({
      message: `Location with Id ${id} deleted successfully`,
      Location: existed,
    });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "your auth token is invalid", error: error.message });
  }
}

async function update_pinnedLocation(req, res) {
  const input = Joi.object({
    id: Joi.number().required(),
    locationName: Joi.string().required(),
  });

  try {
    await input.validateAsync({
      id: req.params.id,
      locationName: req.body.locationName,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let id = req.params.id;
    let name = req.body.locationName;

    const existed = await prisma.pinnedLocation.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!existed) {
      return res
        .status(404)
        .json({ error: `Location with Id ${id} not found` });
    }

    await prisma.pinnedLocation.update({
      where: {
        id: parseInt(id),
      },
      data: {
        locationName: name,
      },
    });
    const newData = await prisma.pinnedLocation.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return res.status(200).json({
      message: `Location with Id ${id} updated successfully`,
      "Old Location Name": existed.locationName,
      "New Data": newData,
    });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "your auth token is invalid", error: error.message });
  }
}

async function get_distance(req, res) {
  const input = Joi.object({
    destination: Joi.string().required(),
    origin: Joi.string().required(),
  });

  try {
    
    await input.validateAsync({
      destination: req.query.destination,
      origin: req.query.origin,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    let payload = jwt.verify(req.header("x-auth-token"), secretKey);

    let origin = req.query.origin;
    let destination = req.query.destination;
    const apikey = "AIzaSyAEULlrKtvVDbwB9PQ_rlTowLshlUhBw6M";
    axios
      .get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?units=metrics&origins=${origin}&destinations=${destination}&key=${apikey}`
      )
      .then((response) => {
        return res.status(200).json({
          origin: response.data.origin_addresses[0],
          destination: response.data.destination_addresses[0],
          distance: response.data.rows[0].elements[0].distance.text,
          ETA: response.data.rows[0].elements[0].duration.text,
        });
      })
      .catch((error) => {
        return res.status(400).json({ error: error.message });
      });
  } catch (error) {
    return res.status(400).json({ message: "your auth token is invalid", error: error.message });
  }
}

module.exports = {
  insert_pinnedLocation,
  select_pinnedLocation,
  delete_pinnedLocation,
  update_pinnedLocation,
  get_distance,
};

/*

*/

const { faker } = require("@faker-js/faker/locale/id_ID");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require('bcrypt')


async function deleteAll() {
  await prisma.pinnedLocation.deleteMany();
  await prisma.developer.deleteMany();
  await prisma.user.deleteMany();
}

async function developer() {
  for (let i = 0; i < 5; i++) {
    let firstName = faker.name.firstName();
    let lastName = faker.name.lastName();
    let email = firstName + "." + lastName + "@gmail.com";
    const developer = await prisma.developer.create({
      data: {
        name: firstName + " " + lastName,
        email: email,
        password: bcrypt.hashSync(faker.internet.password(), 10),
        apiKey: faker.datatype.uuid(),
      },
    });
  }
}

async function user() {
  for (let i = 0; i < 5; i++) {
    let name = faker.name.firstName();
    const user = await prisma.user.create({
      data: {
        name: name,
        developerId: (i+1),
        customId: (i+1).toString(),
      },
    });
  }
}

async function pinnedLocation() {
  for (let i = 0; i < 5; i++) {
    let locationName = faker.address.street();
    let latitude = faker.address.latitude();
    let longitude = faker.address.longitude();
    const pinnedLocation = await prisma.pinnedLocation.create({
      data: {
        userCustomId: (i+1).toString(),
        locationName: locationName,
        latitude: latitude,
        longitude: longitude,
        userCustomId_latitude_longitude: (i+1).toString() + "_" + latitude + "_" + longitude,
      },
    });
    
  }
  
  // const pinnedLocation = await prisma.pinnedLocation.create({
  //   data: {
  //     userCustomId: 1,
  //     locationName: "Home",
  //     latitude: faker.address.latitude(),
  //     longitude: faker.address.longitude(),
  //   }
  // })
}

async function main() {
  await deleteAll();
  await developer();
  await user();
  await pinnedLocation();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

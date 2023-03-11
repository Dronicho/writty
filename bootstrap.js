const { PrismaClient } = require('@prisma/client');

const client = new PrismaClient();

const main = async () => {
  const posts = await client.post.findMany();
  console.log(posts);
};

main().finally(() => {
  client.$disconnect();
});

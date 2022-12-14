import { createClient } from "redis";

const redisUrl =
  process.env.NODE_ENV !== "production"
    ? `redis://localhost:6379`
    : process.env.REDIS_URL;
const redisClient = createClient({
  url: redisUrl,
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected...");
    redisClient.set("welcome", "Welcome to the Phantom Notepad!");
  } catch (err: any) {
    console.log(err.message);
    process.exit(1);
  }
};

connectRedis();

redisClient.on("error", (err) => console.log(err));

export default redisClient;

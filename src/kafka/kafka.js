import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "reddit-backend",
  brokers: ["reddit_kafka:9092"],
});

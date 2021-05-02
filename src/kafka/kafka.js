import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "reddit-kafka-backend",
  brokers: ["reddit_kafka:9092"],
});

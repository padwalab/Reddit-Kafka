import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "reddit-kafka-backend",
  brokers: ["reddit_kafka:9092", "reddit_kafka_2:9092"],
});

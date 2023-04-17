import 'dotenv/config';
import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';
import {fetchSubstitutionChanges} from "./data";
import cron from 'node-cron';
import config from "./config";
import {put} from "./database";
import {RegisterBody, registerBodySchema} from "./schema";
import {pushToAll} from "./push";

const fastify = Fastify({ logger: true });

async function check() {
  fastify.log.info('Checking for updates');
  const changedDates = (await fetchSubstitutionChanges(true))
    .filter((changes) => changes.changedClasses.length !== 0);
  console.log(changedDates);
  if (changedDates.length === 0) {
    fastify.log.info('No changes');
    return;
  }
  fastify.log.info('Sending notification');
  await pushToAll({
    changedDates: changedDates.map((changes) => ({
      date: changes.date.toString(),
      changedClasses: changes.changedClasses,
      wasEmpty: changes.wasEmpty,
    })),
  });
}

async function start() {
  fastify.log.info('Loading initial substitution data');
  await fetchSubstitutionChanges(true);

  await fastify.register(FastifyCors, {
    origin: config.corsWhitelist
  });

  fastify.put<{
    Body: RegisterBody;
  }>('/register', {
    schema: {
      body: registerBodySchema,
    },
  }, async (request, reply) => {
    await put({
      tri: 'v-lo',
      ...request.body,
    });
    reply.status(201);
  });

  fastify.log.info('Starting...');
  await fastify.listen({
    port: config.port,
    host: '0.0.0.0',
  });

  cron.schedule(config.checkCron, () => {
    check().catch((error) => {
      fastify.log.error('Error checking for substitutions changes');
      fastify.log.error(error);
    });
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

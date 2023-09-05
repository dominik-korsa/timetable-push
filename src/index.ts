import 'dotenv/config';
import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';
import {fetchSubstitutionChanges} from "./data.js";
import cron from 'node-cron';
import config from "./config.js";
import {put} from "./database.js";
import {RegisterBody, registerBodySchema} from "./schema.js";
import {pushToAll} from "./push.js";

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

  setTimeout(check, 5000);

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

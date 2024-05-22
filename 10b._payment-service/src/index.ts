import { ApolloServer } from '@apollo/server';
import { gql } from 'apollo-server';
import { createServer } from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';

import Query from './resolvers/Query';
import Mutation from './resolvers/Mutation';
import Subscription from './resolvers/Subscription';
import Book from "./resolvers/Book";
import Author from "./resolvers/Author";
import Payment from "./resolvers/Payment"; // Import the Payment resolver

const app = express();
const httpServer = createServer(app);

const schemaPath = path.resolve('src/graphql/schema.graphql');
const schemaFile = fs.readFileSync(schemaPath, 'utf8');
const typeDefs = gql(schemaFile);

const resolvers = {
  Query,
  Mutation: {
    ...Mutation,
    ...Payment.Mutation, // Merge Payment Mutation
  },
  Subscription,
  Book,
  Author,
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer({ schema }, wsServer);  

const server = new ApolloServer({ 
  schema,
  introspection: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      }
    }
  ],
});

await server.start();

app.use('/graphql', cors<cors.CorsRequest>(), express.json(), expressMiddleware(server));

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Resolvers } from '../types'; // Make sure to have types file if using, otherwise skip this import

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

const PaymentResolvers: Resolvers = {
  Mutation: {
    async createPaymentIntent(parent, { amount, currency }, context, info) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency,
        });
        return {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          clientSecret: paymentIntent.client_secret,
        };
      } catch (error) {
        throw new Error(`Failed to create payment intent: ${error.message}`);
      }
    },
  },
};

export default PaymentResolvers;

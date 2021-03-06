"use strict";
const logger = require("../../logwrapper");
const accountAccess = require("../../common/account-access");
const twitchClient = require("../client");

const { PubSubClient } = require("twitch-pubsub-client");

/**@type {PubSubClient} */
let pubSubClient;

/**@type {Array<import("twitch-pubsub-client").PubSubListener>} */
let listeners = [];

/**
 *
 * @param {PubSubClient} pubSubClient
 */
async function removeListeners(pubSubClient) {
    if (pubSubClient) {
        try {
            const userListener = pubSubClient.getUserListener(
                accountAccess.getAccounts().streamer.userId
            );
            if (userListener) {
                for (const listener of listeners) {
                    userListener.removeListener(listener);
                    listener.remove();
                }
            }
        } catch (error) {
            //silently fail
        }
    } else {
        for (const listener of listeners) {
            try {
                listener.remove();
            } catch (error) {
                logger.debug("failed to remove pubsub listener without client", error);
            }
        }
    }
    listeners = [];
}

async function disconnectPubSub() {
    try {
        if (pubSubClient && pubSubClient._rootClient && pubSubClient._rootClient.isConnected) {
            pubSubClient._rootClient.disconnect();
            logger.info("Disconnected from PubSub.");
        }
    } catch (err) {
        logger.debug("error disconnecting pubsub", err);
    }
}

async function createClient() {

    const streamer = accountAccess.getAccounts().streamer;

    await disconnectPubSub();

    logger.info("Connecting to Twitch PubSub...");

    pubSubClient = new PubSubClient(pubSubClient && pubSubClient._rootClient);

    const apiClient = twitchClient.getClient();

    await removeListeners(pubSubClient);

    try {
        // throws error if one doesnt exist
        pubSubClient.getUserListener(streamer.userId);
    } catch (err) {
        await pubSubClient.registerUserListener(apiClient);
    }

    try {

        const rewardRedemptionHandler =
        require("../../events/twitch-events/reward-redemption");
        const redemptionListener = await pubSubClient.onRedemption(streamer.userId,
            (message) => {
                rewardRedemptionHandler.handleRewardRedemption(message);
            });

        listeners.push(redemptionListener);
    } catch (err) {
        logger.error("Failed to connect to Twitch PubSub!", err);
        return;
    }

    logger.info("Connected to the Twitch PubSub!");
}

exports.createClient = createClient;
exports.disconnectPubSub = disconnectPubSub;
exports.removeListeners = removeListeners;


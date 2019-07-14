"use strict";

const cloudSyncCommands = require("../../cloud-sync/commands/command-list");
const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "commandListBytebinToken",
        description: "Get bytebin id to access allowed commands for a user. Access the json by going to https://bytebin.lucko.me/ID-HERE.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger) => {
        let event = trigger.metadata.chatEvent;
        return await cloudSyncCommands.getCommandListSyncId(event.user_name, event.user_roles);
    }
};

module.exports = model;
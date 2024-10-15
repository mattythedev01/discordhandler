const { SlashCommandBuilder } = require("discord.js");
const PlantSetup = require("../../schemas/plantSetupSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start your plant journey!")
    .toJSON(),
  testMode: false,
  devOnly: false,
  deleted: false,
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const username = interaction.user.username;

      // Check if the user already exists in the database
      let userSetup = await PlantSetup.findOne({ userID: userId });

      if (!userSetup) {
        // If the user doesn't exist, create a new entry
        userSetup = new PlantSetup({
          userID: userId,
          username: username,
          plantStore: [],
          plantStoreName: [],
          money: 10000,
          level: 1,
        });
      } else {
        // If the user exists, update their username in case it has changed
        userSetup.username = username;
      }

      // Log the start command usage in the plantSetupSchema
      userSetup.lastStartCommand = new Date();

      // Save the user setup (this will create a new document if it's new, or update the existing one)
      await userSetup.save();

      await interaction.reply(
        `Welcome to your plant journey, ${username}! Your current stats:\nPlants: ${userSetup.plantStore.length}\nMoney: ${userSetup.money}\nLevel: ${userSetup.level}`
      );
    } catch (err) {
      console.log("[ERROR]".red + "Error in your start.js run function:");
      console.log(err);
      await interaction.reply(
        "An error occurred while starting your plant journey. Please try again later."
      );
    }
  },

  // This command doesn't require autocomplete, so we can remove that part
};

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const PlantSetup = require("../../schemas/plantSetupSchema");
const Shops = require("../../schemas/shopsSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View and buy from the plant shops!")
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

      // Check if the user exists in the database
      let userSetup = await PlantSetup.findOne({ userID: userId });

      if (!userSetup) {
        return interaction.reply(
          "Please use the /start command first to begin your plant journey!"
        );
      }

      // Get all shop types from the schema
      const shopTypes = Shops.schema.path("shopType").enumValues;

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle("Plant Shops")
        .setDescription("Choose a shop to buy:")
        .setColor("#00FF00");

      // Create buttons
      const buttons = [];

      shopTypes.forEach((shopType, index) => {
        const price = index === 0 ? 1000 : 1000 * 1000;
        embed.addFields({ name: shopType, value: `Price: ${price} money` });

        buttons.push(
          new ButtonBuilder()
            .setCustomId(`buy_${shopType}`)
            .setLabel(shopType)
            .setStyle(ButtonStyle.Primary)
        );
      });

      const row = new ActionRowBuilder().addComponents(buttons);

      await interaction.reply({ embeds: [embed], components: [row] });

      // Create a collector for button interactions
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        const [action, shopType] = i.customId.split("_");

        if (action === "buy") {
          const shopIndex = shopTypes.indexOf(shopType);
          const price = shopIndex === 0 ? 1000 : 1000 * 1000;

          if (userSetup.money < price) {
            return i.reply({
              content: "You don't have enough money to buy this shop!",
              ephemeral: true,
            });
          }

          userSetup.money -= price;
          userSetup.plantStore.push(shopType);

          await userSetup.save();

          // Create a new shop in the Shops schema
          const newShop = new Shops({
            name: `${username}'s ${shopType}`,
            description: `A ${shopType} owned by ${username}`,
            shopType: shopType,
            ownerID: userId,
            initialInvestment: price,
            plants: [], // Initialize with an empty array of plants
          });

          await newShop.save();

          // Log the stock, type, default, and max values
          console.log("New Shop Created:");
          console.log("Shop Type:", newShop.shopType);
          console.log("Stock (plants):", newShop.plants.length);
          console.log("Default Stock:", 0); // As per the schema, it starts empty
          console.log("Max Stock:", 100); // As per the schema's max value for stock

          const purchaseEmbed = new EmbedBuilder()
            .setTitle("Shop Purchased!")
            .setDescription(`You have successfully purchased the ${shopType}!`)
            .setColor("#00FF00");

          await i.reply({ embeds: [purchaseEmbed] });

          const namePrompt = await i.followUp(
            "Would you like to name your new plant store?"
          );

          const nameFilter = (response) =>
            response.author.id === interaction.user.id;
          const nameCollector = i.channel.createMessageCollector({
            filter: nameFilter,
            time: 30000,
            max: 1,
          });

          nameCollector.on("collect", async (msg) => {
            const response = msg.content.toLowerCase();
            if (["y", "yes"].includes(response)) {
              const nameQuestion = await i.followUp(
                "Okay! What would you like to name the plant shop?"
              );

              const finalNameCollector = i.channel.createMessageCollector({
                filter: nameFilter,
                time: 30000,
                max: 1,
              });

              finalNameCollector.on("collect", async (nameMsg) => {
                const shopName = nameMsg.content;
                userSetup.plantStoreName.push(shopName);
                await userSetup.save();

                // Update the shop name in the Shops schema
                newShop.name = shopName;
                await newShop.save();

                await i.followUp(
                  `Great! Your new ${shopType} has been named "${shopName}".`
                );
              });

              finalNameCollector.on("end", (collected, reason) => {
                if (reason === "time") {
                  i.followUp(
                    "You didn't provide a name in time. Your shop remains unnamed."
                  );
                }
              });
            } else if (["n", "no"].includes(response)) {
              await i.followUp(
                "Alright, your shop will remain unnamed for now."
              );
            } else {
              await i.followUp(
                "Invalid response. Your shop will remain unnamed for now."
              );
            }
          });

          nameCollector.on("end", (collected, reason) => {
            if (reason === "time") {
              i.followUp(
                "You didn't respond in time. Your shop will remain unnamed for now."
              );
            }
          });
        }
      });

      collector.on("end", (collected) => {
        interaction.editReply({ components: [] });
      });
    } catch (err) {
      console.log("[ERROR]".red + "Error in your shop.js run function:");
      console.log(err);
      await interaction.reply(
        "An error occurred while accessing the shop. Please try again later."
      );
    }
  },
};

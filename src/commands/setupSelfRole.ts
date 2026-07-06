import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  TextChannel
} from 'discord.js';
import { Command } from '../types/command.types.js';
import { ROLES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const setupSelfRoleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('setup-self-role')
    .setDescription('Deploy the self-role gender selection Embed and buttons in the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: CommandInteraction): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Fetch role details dynamically to use their actual names as button labels
      const maleRole = await guild.roles.fetch(ROLES.GENDER_MALE);
      const femaleRole = await guild.roles.fetch(ROLES.GENDER_FEMALE);

      const maleLabel = maleRole?.name || 'Male';
      const femaleLabel = femaleRole?.name || 'Female';

      const selfRoleEmbed = new EmbedBuilder()
        .setTitle("AMBIL GENDER ROLE KAMU")
        .setDescription(
          `Pilih role gender kamu untuk memudahkan sapaan di server.\n\n` +
          `<@&${ROLES.GENDER_MALE}>\n` +
          `<@&${ROLES.GENDER_FEMALE}>`
        )
        .setColor(7506394); // Blurple color code: 7506394

      const buttonMale = new ButtonBuilder()
        .setCustomId(`gender_role_${ROLES.GENDER_MALE}`)
        .setLabel(maleLabel)
        .setStyle(ButtonStyle.Primary)

      const buttonFemale = new ButtonBuilder()
        .setCustomId(`gender_role_${ROLES.GENDER_FEMALE}`)
        .setLabel(femaleLabel)
        .setStyle(ButtonStyle.Primary)

      const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buttonMale, buttonFemale);

      const channel = interaction.channel;
      if (channel && 'send' in channel) {
        await (channel as TextChannel).send({
          embeds: [selfRoleEmbed],
          components: [actionRow]
        });
        await interaction.editReply('Successfully deployed self-role gender embed and buttons!');
      } else {
        await interaction.editReply('Failed to deploy: channel is not accessible or not a text channel.');
      }
    } catch (error) {
      logger.error('Error deploying self-role setup:', error);
      await interaction.editReply('An error occurred while deploying the self-role setup.');
    }
  }
};

export default setupSelfRoleCommand;

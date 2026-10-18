import { IsIn } from 'class-validator';
import { MESSAGE_TEAM_KEYS } from '../message-teams';
import type { MessageTeam } from '../message-teams';

export class MessageTeamParam {
  @IsIn(MESSAGE_TEAM_KEYS)
  team: MessageTeam;
}

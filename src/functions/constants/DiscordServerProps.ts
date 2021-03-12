import { RoleMap} from '../../types';

/**
 * The list of valid tracks that a developer can be on.
 */
export const START_TRACKS = [
  'normal',
  'growth',
  'alumni',
];

/**
 * The mapping of the different tracks to their roles.
 */
export const ROLE_MAP: RoleMap = {
  'normal': 'Start Member',
  'growth': 'Start Growth Member',
  'alumni': 'Start Alumni'
}


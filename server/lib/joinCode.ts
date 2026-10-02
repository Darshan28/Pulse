import { customAlphabet } from 'nanoid'
import { JOIN_CODE_LENGTH } from '../../shared/types.js'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generate = customAlphabet(alphabet, JOIN_CODE_LENGTH)

export function createJoinCode(): string {
  return generate()
}

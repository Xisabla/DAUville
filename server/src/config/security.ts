import { defaultEnv } from '.'

export default {
	saltRounds: parseInt(defaultEnv('SALT_ROUNDS', '10')),
	secret: defaultEnv('SECRET', 'secretpassphrasehere')
}

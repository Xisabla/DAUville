import { defaultEnv } from '.'

export default {
	user: defaultEnv('MAIL_USER', 'None'),
	pass: defaultEnv('MAIL_PASS', 'None'),
	sendMail: defaultEnv('SEND_MAIL', 'false')
}

const Discord = require('discord.js'),
		cutie = new Discord.Client(),
		token = require('../config')
let	queue = [],
		vc = null,
		pf = 'q!',
		singing = false

cutie.on('ready', () => {
	console.log(`${cutie.user.username} is ready...`)
	vc = cutie.channels.get('275364590857093120')
	if(vc) console.log(`Managing ${vc.name}...`)
})

cutie.on('message', (message) => {
	let rest = message.content
	//if message starts with prefix and sent through a guild server
	if(rest.startsWith(pf) && message.channel.type === 'text') {
		rest = rest.substring(pf.length).trim()
		//help command
		if(rest.startsWith('help')) {
			let cmds = `**sing** - To queue up for singing\n\
				**queue** - To see the queue list\n\
				**help** - What are you even doing...\n`
			//if managing role
			if(cRoles(message))
				cmds += `**skip [index]** - To skip the specified position\n`
					//**start** - To let the singer start\n\
					//**done** - After the singer is done to unmute all\n`
			else
				cmds += `**skip** - To skip your turn if queued`
			message.channel.sendMessage({embed: {
				title: `Available commands - prefix is __${pf}__`,
				description: cmds,
				color: 0x00ff00
			}})
		//sing command
		} else if(rest.startsWith('sing')) {
			//if member in voice channel, voice channel is kaoke and managing vc
			if(message.member.voiceChannel && message.member.voiceChannel.id === vc.id && vc != null) {
				//if alreaady queued, NO
				if(queue.includes(message.member)) return
				queue.push(message.member)
				message.reply(`you are in position #\`${queue.length}\``)
			}
		//queue command
		} else if(rest.startsWith('queue')) {
			//if there's a queue
			if(queue.length > 0) {
				let msg = (singing ? `Singing now is ` : `Next singer is `) + `\`${queue[0].displayName}\`\n`
				for(let i = 1; i < queue.length; i++)
					msg += `${i}. \`${queue[i].displayName}\`\n`
				message.channel.send(msg)
			} else 
				message.reply('there\'s no queue right now, sorry :cry:')
		//start command
		/*} else if(rest.startsWith('start'))
			//if has managing perms
			if(cRoles(message))
				sQueue(message)		//call start function
			else return
		//done command
		else if(rest.startsWith('done'))
			//if has managing perms
			if(cRoles(message))
				nQueue(message)		//call done function
			else return
		//manage command
		else if(rest.startsWith('manage'))
			//if has managing perms
			if(cRoles(message)) {
				vc = message.member.voiceChannel
				message.reply(`started managing \`${vc.name}\``)
			} else return*/
		//skip command
		} else if(rest.startsWith('skip'))
			//if has managing perms
			if(cRoles) {
				let pams = rest.substring(4)
				uQueue(message, pams)		//call skip function
			} else return
	}
})

//voice state update, if user leaves or joins vc
/*cutie.on('voiceStateUpdate', (o, n) => {
	//if singing and member is not singer
	if(singing && n.id != queue[0].id)
		//if joining voice channel and voice channel is kaoke
		if(n.voiceChannel && n.voiceChannel.id === vc.id)
				n.setMute(true)
		//else if left chann is kaoke
		else if(o.voiceChannel && o.voiceChannel.id === vc.id)
			//
			if(n.voiceChannel ? n.voiceChannel.id != vc.id : true)
				//if(n.roles.exists('name', 'Member Perms'))
				n.setMute(false)
})*/


/*
 * ** Functions **
 */

//singer is done, unmute everyone
function nQueue(m) {
	//if managing vc, there's a queue and singing
		if(vc != null && queue.length > 0 && singing) {
			//vc.overwritePermissions('193643658556211200', {'SPEAK': true})
			//unmute all members in the vc
			for(let i of vc.members)
				//if member is level 2 and over... ?
				//if(i[1].roles.exists('name', 'Member Perms'))
				i[1].setMute(false)
			m.channel.sendMessage(`\`${queue[0].displayName}\` is done... unmuting everyone...\nOk :blush:`)
			queue.shift()
			singing = false
			//if there's queue, next singer in a voice channel then check if different vc, else send warning
			if(queue.length > 0 && (queue[0].voiceChannel ? queue[0].voiceChannel.id != vc.id : true))
				queue[0].sendMessage('You are up next! Please join back to the channel or skip it')
		} else
			m.reply('there\'s currently no one singing right now...')
		return
}

//next person in queue is starting... start muting
function sQueue(m) {
	//if there's a queue and managing a vc
	if(queue.length > 0 && vc != null) {
		//vc.overwritePermissions('193643658556211200', {'SPEAK': false})
		//mute members in the vc
		for(let i of vc.members)
			//if not a bot or the singer, MUTE
			if(i[0] != queue[0].id && !i[1].user.bot)
				i[1].setMute(true)
		//unmute singer
		queue[0].setMute(false)
		m.channel.sendMessage(`Muting members Xd ...\n*Singing now is* ${queue[0].toString()} :microphone:`)
		singing = true
	} else
		m.channel.sendMessage('There\'re no more members in the queue :sweat:')
	return
}

//skip person in queue by self or mod can take out
function uQueue(m, pams) {
	//normal user, skip self
	if(pams.length <1)
		//if singing and singer tries to skip self, NO
		if(singing ? m.author.id != queue[0].id : true)
			//if user is in queue, else NO
			if(queue.includes(m.member)) {
				queue.splice(queue.indexOf(m.member), 1)
				m.reply('you have been unqueued :blush:')
			} else return
		else return
	//managing user, skip position
	else if(cRoles(m)) {
		let x = parseInt(pams, 10)
		//if x is not a number, NO
		if(isNaN(x))
			return
		//x is withing range, if singing and x is 0, NO
		if(x < queue.length && (singing ? x != 0 : true)) {
			let name = queue[x].displayName
			queue.splice(x, 1)
			m.channel.sendMessage(`\`${name}\` has been unqueued from position #\`${x}\` :blush:`)
		}
	}
}

//checks for managing roles
function cRoles(m) {
	return m.member.roles.some(x => x.name === 'Moderator' || x.hasPermission('ADMINISTRATOR') || x.id === '297591992957927424')
}

/*	V1.2.1
 *	work on role restriction											check
 *	work on unqueue, passing turn									check
 *	* work on queue up use bot...									check
 *	fix if queue empty														check
 *	Pending requests...
 *	Check for user in vc													check
 *	Check if queued user is still in vc						check
 */

cutie.login(token)
